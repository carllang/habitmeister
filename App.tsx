import React from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {useEffect, useState} from 'react';

import {
  Habit,
  getDateKey,
  getHabitStreak,
  initialHabits,
  isValidReminderTime,
  isHabitComplete,
  WEEKDAYS,
  loadHabits,
  loadOnboardingCompleted,
  saveOnboardingCompleted,
  saveHabits,
} from './src/data/habitRepository';
import {
  configureRevenueCat,
  entitlementClient,
  PremiumOffer,
} from './src/monetization/entitlement';
import {DEV_PREMIUM_OVERRIDE, REVENUECAT_API_KEY} from './src/config';
import {
  cancelReminder,
  initialiseReminderNotifications,
  rescheduleReminders,
} from './src/notifications/reminderService';
import {TimePickerField} from './src/TimePickerField';

type Tab = 'Today' | 'History' | 'Settings' | 'Premium';

function App(): React.JSX.Element {
  const [habits, setHabits] = useState(initialHabits);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitDetail, setNewHabitDetail] = useState('');
  const [newHabitReminder, setNewHabitReminder] = useState('');
  const [newHabitRepeatDays, setNewHabitRepeatDays] = useState([...WEEKDAYS]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isOnboardingHydrated, setIsOnboardingHydrated] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('Today');
  const [editingHabitId, setEditingHabitId] = useState<number | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [isPremiumModalVisible, setIsPremiumModalVisible] = useState(false);
  const [premiumOffer, setPremiumOffer] = useState<PremiumOffer | null>(null);
  const [isBillingBusy, setIsBillingBusy] = useState(false);
  const [billingMessage, setBillingMessage] = useState('');
  const today = new Date();
  const dateLabel = today
    .toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
    .toUpperCase();
  const completedCount = habits.filter(habit =>
    isHabitComplete(habit, today),
  ).length;
  const progress = habits.length === 0 ? 0 : completedCount / habits.length;

  useEffect(() => {
    let isMounted = true;
    Promise.all([loadHabits(), loadOnboardingCompleted()]).then(
      ([savedHabits, onboardingCompleted]) => {
        if (!isMounted) {
          return;
        }
        setHabits(savedHabits);
        setHasCompletedOnboarding(onboardingCompleted);
        setIsHydrated(true);
        setIsOnboardingHydrated(true);
      },
    );
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (__DEV__ && DEV_PREMIUM_OVERRIDE !== null) {
      setIsPremium(DEV_PREMIUM_OVERRIDE);
      return () => {
        isMounted = false;
      };
    }

    configureRevenueCat(REVENUECAT_API_KEY);
    entitlementClient.getPremiumEntitlement().then(premium => {
      if (isMounted) {
        setIsPremium(premium);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const completeOnboarding = () => {
    setHasCompletedOnboarding(true);
    saveOnboardingCompleted();
  };

  useEffect(() => {
    if (isHydrated) {
      saveHabits(habits);
    }
  }, [habits, isHydrated]);

  useEffect(() => {
    if (!isHydrated || !habits.some(habit => habit.reminderTime)) {
      return;
    }

    let isMounted = true;
    const syncReminders = async () => {
      if ((await initialiseReminderNotifications()) && isMounted) {
        await rescheduleReminders(habits);
      }
    };
    syncReminders();

    return () => {
      isMounted = false;
    };
  }, [habits, isHydrated]);

  const openAddHabit = () => {
    if (!isPremium && habits.length >= 5) {
      setActiveTab('Premium');
      Alert.alert(
        'Free plan limit',
        'Upgrade to add more than 5 active habits.',
      );
      return;
    }
    setNewHabitName('');
    setNewHabitDetail('');
    setNewHabitReminder('');
    setNewHabitRepeatDays([...WEEKDAYS]);
    setIsAddModalVisible(true);
  };

  const openPremium = async () => {
    setBillingMessage('');
    setIsPremiumModalVisible(true);
    const offer = await entitlementClient.getPremiumOffer();
    setPremiumOffer(offer);
    if (!offer && REVENUECAT_API_KEY) {
      setBillingMessage('Premium is temporarily unavailable. Try again later.');
    }
  };

  const purchasePremium = async () => {
    if (!premiumOffer || isBillingBusy) {
      return;
    }
    setBillingMessage('');
    setIsBillingBusy(true);
    const purchased = await entitlementClient.purchasePremium(premiumOffer);
    setIsBillingBusy(false);
    if (purchased) {
      setIsPremium(true);
      setIsPremiumModalVisible(false);
      return;
    }
    setBillingMessage('Purchase was not completed. No changes were made.');
  };

  const restorePremium = async () => {
    if (isBillingBusy) {
      return;
    }
    setBillingMessage('');
    setIsBillingBusy(true);
    const restored = await entitlementClient.restorePurchases();
    setIsBillingBusy(false);
    if (restored) {
      setIsPremium(true);
      setIsPremiumModalVisible(false);
      return;
    }
    setBillingMessage('No active Premium purchase was found.');
  };

  const toggleRepeatDay = (day: (typeof WEEKDAYS)[number]) => {
    setNewHabitRepeatDays(current =>
      current.includes(day)
        ? current.filter(selectedDay => selectedDay !== day)
        : [...current, day],
    );
  };

  const addHabit = () => {
    const name = newHabitName.trim();
    const reminderTime = newHabitReminder.trim();
    if (!name) {
      Alert.alert('Name your habit', 'Add a name before saving this habit.');
      return;
    }
    if (reminderTime && !isValidReminderTime(reminderTime)) {
      Alert.alert('Check the reminder', 'Use a 24-hour time such as 08:00.');
      return;
    }
    if (newHabitRepeatDays.length === 0) {
      Alert.alert(
        'Choose a repeat day',
        'Select at least one day for this habit.',
      );
      return;
    }
    setHabits(current => {
      const detail = newHabitDetail.trim() || 'Daily';
      const savedReminderTime = reminderTime || undefined;
      if (editingHabitId !== null) {
        return current.map(habit =>
          habit.id === editingHabitId
            ? {
                ...habit,
                name,
                detail,
                reminderTime: savedReminderTime,
                repeatDays: newHabitRepeatDays,
              }
            : habit,
        );
      }
      return [
        ...current,
        {
          id: Date.now(),
          name,
          detail,
          completed: false,
          color: '#286B69',
          completedDates: [],
          repeatDays: newHabitRepeatDays,
          reminderTime: savedReminderTime,
        },
      ];
    });
    setIsAddModalVisible(false);
    setEditingHabitId(null);
  };

  const editHabit = (habit: Habit) => {
    setEditingHabitId(habit.id);
    setNewHabitName(habit.name);
    setNewHabitDetail(habit.detail);
    setNewHabitReminder(habit.reminderTime ?? '');
    setNewHabitRepeatDays(habit.repeatDays);
    setIsAddModalVisible(true);
  };

  const removeHabit = (habit: Habit) => {
    Alert.alert('Delete habit?', `Remove ${habit.name} from your routine?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          cancelReminder(habit.id);
          setHabits(current => current.filter(item => item.id !== habit.id));
        },
      },
    ]);
  };

  const showHabitActions = (habit: Habit) => {
    Alert.alert(habit.name, undefined, [
      {text: 'Edit', onPress: () => editHabit(habit)},
      {text: 'Delete', style: 'destructive', onPress: () => removeHabit(habit)},
      {text: 'Cancel', style: 'cancel'},
    ]);
  };

  const toggleHabit = (habit: Habit) => {
    const todayKey = getDateKey(today);
    setHabits(current =>
      current.map(item => {
        if (item.id !== habit.id) {
          return item;
        }

        const completed = isHabitComplete(item, today);
        const completedDates = completed
          ? item.completedDates.filter(date => date !== todayKey)
          : [...item.completedDates, todayKey];

        return {...item, completed: !completed, completedDates};
      }),
    );
  };

  const historyDays = Array.from({length: 7}, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    return date;
  });

  if (!isOnboardingHydrated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.onboardingLoading}>
          <Text style={styles.eyebrow}>HABITMEISTER</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasCompletedOnboarding) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.paper} />
        <View style={styles.onboarding}>
          <Text style={styles.eyebrow}>A QUIET PLACE TO BEGIN</Text>
          <Text style={styles.onboardingTitle}>Build a rhythm that lasts.</Text>
          <Text style={styles.onboardingCopy}>
            Keep a few meaningful habits close, mark each small win, and let
            consistency compound.
          </Text>
          <View style={styles.onboardingRule} />
          <Text style={styles.onboardingNote}>
            Your habits are stored locally and work offline.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={completeOnboarding}
            style={({pressed}) => [
              styles.saveButton,
              pressed && styles.buttonPressed,
            ]}>
            <Text style={styles.saveButtonText}>Begin with my habits</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.paper} />
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>{dateLabel}</Text>
            <Text style={styles.title}>Good morning, Carl</Text>
          </View>
          <Pressable accessibilityLabel="Open profile" style={styles.avatar}>
            <Text style={styles.avatarText}>C</Text>
          </Pressable>
        </View>

        {activeTab === 'Today' ? (
          <View style={styles.progressPanel}>
            <View style={styles.progressHeader}>
              <View>
                <Text style={styles.panelLabel}>TODAY'S RHYTHM</Text>
                <Text style={styles.progressTitle}>
                  {completedCount} of {habits.length} complete
                </Text>
              </View>
              <Text style={styles.progressPercent}>
                {Math.round(progress * 100)}%
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, {width: `${progress * 100}%`}]}
              />
            </View>
            <Text style={styles.progressHint}>
              Small steps, repeated with care.
            </Text>
          </View>
        ) : activeTab === 'History' ? (
          <View style={styles.historyPanel}>
            <Text style={styles.panelLabel}>LAST 7 DAYS</Text>
            <Text style={styles.historyTitle}>
              Your consistency, at a glance
            </Text>
            <View style={styles.historyGrid}>
              {historyDays.map(date => {
                const dayKey = getDateKey(date);
                const completed = habits.filter(habit =>
                  isHabitComplete(habit, date),
                ).length;
                return (
                  <View key={dayKey} style={styles.historyDay}>
                    <Text style={styles.historyDayName}>
                      {date.toLocaleDateString(undefined, {weekday: 'short'})}
                    </Text>
                    <View
                      style={[
                        styles.historyDot,
                        completed > 0 && styles.historyDotComplete,
                      ]}
                    />
                    <Text style={styles.historyDayCount}>
                      {completed}/{habits.length}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : activeTab === 'Settings' ? (
          <View style={styles.settingsPanel}>
            <Text style={styles.panelLabel}>PREFERENCES</Text>
            <Text style={styles.historyTitle}>Make the routine yours</Text>
            <View style={styles.settingRow}>
              <View>
                <Text style={styles.settingTitle}>Active habits</Text>
                <Text style={styles.settingDetail}>
                  Keep your daily list focused.
                </Text>
              </View>
              <Text style={styles.settingValue}>{habits.length} / 5</Text>
            </View>
            <View style={styles.settingRow}>
              <View>
                <Text style={styles.settingTitle}>Storage</Text>
                <Text style={styles.settingDetail}>
                  Your habits stay on this device.
                </Text>
              </View>
              <Text style={styles.settingValue}>Offline</Text>
            </View>
          </View>
        ) : (
          <View style={styles.premiumPanel}>
            <Text style={[styles.panelLabel, styles.premiumPanelLabel]}>
              HABITMEISTER PREMIUM
            </Text>
            <Text style={styles.historyTitle}>
              More room for the life you are building.
            </Text>
            <Text style={styles.premiumCopy}>
              Unlock unlimited habits, deeper insights, and data export while
              keeping the daily habit loop free for everyone.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={openPremium}
              style={({pressed}) => [
                styles.saveButton,
                pressed && styles.buttonPressed,
              ]}>
              <Text style={styles.saveButtonText}>
                {isPremium ? 'Premium active' : 'Explore Premium'}
              </Text>
            </Pressable>
          </View>
        )}

        {activeTab === 'Today' && (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your habits</Text>
            <Text style={styles.sectionCount}>{habits.length} active</Text>
          </View>
        )}

        {activeTab === 'Today' && (
          <View style={styles.habitList}>
            {habits.map(habit => (
              <View key={habit.id} style={styles.habitRow}>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{checked: isHabitComplete(habit, today)}}
                  onPress={() => toggleHabit(habit)}
                  style={({pressed}) => [
                    styles.habitTapTarget,
                    pressed && styles.habitRowPressed,
                  ]}>
                  <View
                    style={[
                      styles.habitMarker,
                      {backgroundColor: habit.color},
                    ]}>
                    {isHabitComplete(habit, today) && (
                      <Text style={styles.checkmark}>OK</Text>
                    )}
                  </View>
                  <View style={styles.habitCopy}>
                    <Text
                      style={[
                        styles.habitName,
                        isHabitComplete(habit, today) && styles.completedText,
                      ]}>
                      {habit.name}
                    </Text>
                    <Text style={styles.habitDetail}>
                      {habit.detail}
                      {habit.reminderTime ? `  ·  ${habit.reminderTime}` : ''}
                      {`  ·  ${habit.repeatDays.join(', ')}`}
                    </Text>
                  </View>
                  <Text style={styles.streak}>
                    {getHabitStreak(habit, today)} day streak
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityLabel={`More actions for ${habit.name}`}
                  onPress={() => showHabitActions(habit)}
                  style={styles.moreButton}>
                  <Text style={styles.moreText}>...</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'Today' && (
          <Pressable
            accessibilityRole="button"
            onPress={openAddHabit}
            style={({pressed}) => [
              styles.addButton,
              pressed && styles.buttonPressed,
            ]}>
            <Text style={styles.addButtonText}>+ Add a habit</Text>
          </Pressable>
        )}

        <View style={styles.tabBar}>
          {(['Today', 'History', 'Settings', 'Premium'] as Tab[]).map(tab => (
            <Pressable key={tab} onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tab, activeTab === tab && styles.activeTab]}>
                {tab}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <Modal
        animationType="slide"
        onRequestClose={() => setIsAddModalVisible(false)}
        transparent
        visible={isAddModalVisible}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingHabitId === null ? 'New habit' : 'Edit habit'}
              </Text>
              <Pressable
                onPress={() => {
                  setIsAddModalVisible(false);
                  setEditingHabitId(null);
                }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            </View>
            <Text style={styles.inputLabel}>HABIT NAME</Text>
            <TextInput
              autoFocus
              onChangeText={setNewHabitName}
              placeholder="e.g. Drink water"
              placeholderTextColor={colors.muted}
              style={styles.input}
              value={newHabitName}
            />
            <Text style={styles.inputLabel}>DETAIL (OPTIONAL)</Text>
            <TextInput
              onChangeText={setNewHabitDetail}
              placeholder="e.g. 6 glasses"
              placeholderTextColor={colors.muted}
              style={styles.input}
              value={newHabitDetail}
            />
            <Text style={styles.inputLabel}>REPEAT ON</Text>
            <View style={styles.repeatDayRow}>
              {WEEKDAYS.map(day => {
                const selected = newHabitRepeatDays.includes(day);
                return (
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{checked: selected}}
                    accessibilityLabel={`Repeat on ${day}`}
                    key={day}
                    onPress={() => toggleRepeatDay(day)}
                    style={[
                      styles.repeatDay,
                      selected && styles.repeatDaySelected,
                    ]}>
                    <Text
                      style={[
                        styles.repeatDayText,
                        selected && styles.repeatDayTextSelected,
                      ]}>
                      {day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.inputLabel}>REMINDER (OPTIONAL)</Text>
            <TimePickerField
              clearTextStyle={styles.clearReminderText}
              colors={colors}
              inputStyle={styles.timePickerButton}
              onChange={setNewHabitReminder}
              onClear={() => setNewHabitReminder('')}
              value={newHabitReminder}
            />
            <Pressable
              accessibilityRole="button"
              onPress={addHabit}
              style={({pressed}) => [
                styles.saveButton,
                pressed && styles.buttonPressed,
              ]}>
              <Text style={styles.saveButtonText}>Save habit</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <Modal
        animationType="slide"
        onRequestClose={() => setIsPremiumModalVisible(false)}
        transparent
        visible={isPremiumModalVisible}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Premium</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setIsPremiumModalVisible(false)}>
                <Text style={styles.cancelText}>Close</Text>
              </Pressable>
            </View>
            <Text style={styles.premiumModalTitle}>
              Make more room for your rhythm.
            </Text>
            <Text style={styles.premiumModalCopy}>
              Unlock unlimited habits and keep your progress growing across
              every season.
            </Text>
            {isPremium ? (
              <Text style={styles.billingSuccess}>Premium is active.</Text>
            ) : premiumOffer ? (
              <Pressable
                accessibilityRole="button"
                disabled={isBillingBusy}
                onPress={purchasePremium}
                style={({pressed}) => [
                  styles.saveButton,
                  pressed && styles.buttonPressed,
                  isBillingBusy && styles.disabledButton,
                ]}>
                <Text style={styles.saveButtonText}>
                  {isBillingBusy
                    ? 'Connecting to Google Play...'
                    : `Continue for ${premiumOffer.price}`}
                </Text>
              </Pressable>
            ) : (
              <Text style={styles.billingMessage}>
                {REVENUECAT_API_KEY
                  ? 'Loading the Google Play subscription...'
                  : 'Google Play billing is not configured yet.'}
              </Text>
            )}
            {billingMessage ? (
              <Text style={styles.billingMessage}>{billingMessage}</Text>
            ) : null}
            {!isPremium && (
              <Pressable
                accessibilityRole="button"
                disabled={isBillingBusy}
                onPress={restorePremium}
                style={styles.restoreButton}>
                <Text style={styles.restoreButtonText}>Restore purchase</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const colors = {
  paper: '#F7F3EC',
  ink: '#202A2A',
  muted: '#778080',
  line: '#E5DED3',
  teal: '#286B69',
  warm: '#F0E8DC',
};

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: colors.paper},
  onboardingLoading: {alignItems: 'center', flex: 1, justifyContent: 'center'},
  onboarding: {flex: 1, justifyContent: 'center', padding: 28},
  onboardingTitle: {
    color: colors.ink,
    fontSize: 38,
    fontWeight: '700',
    lineHeight: 44,
    marginTop: 18,
    maxWidth: 330,
  },
  onboardingCopy: {
    color: colors.muted,
    fontSize: 17,
    lineHeight: 26,
    marginTop: 18,
    maxWidth: 330,
  },
  onboardingRule: {
    backgroundColor: colors.line,
    height: 1,
    marginVertical: 28,
    width: 72,
  },
  onboardingNote: {color: colors.muted, fontSize: 12, marginBottom: 24},
  container: {flex: 1, paddingHorizontal: 22, paddingTop: 20},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  eyebrow: {
    color: colors.teal,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  title: {color: colors.ink, fontSize: 28, fontWeight: '700', marginTop: 7},
  avatar: {
    alignItems: 'center',
    backgroundColor: '#D4E1DA',
    borderRadius: 21,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  avatarText: {color: colors.teal, fontSize: 16, fontWeight: '700'},
  progressPanel: {
    backgroundColor: colors.warm,
    borderRadius: 6,
    padding: 18,
    marginBottom: 30,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  panelLabel: {
    color: colors.teal,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  progressTitle: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: '700',
    marginTop: 8,
  },
  progressPercent: {color: colors.teal, fontSize: 26, fontWeight: '700'},
  progressTrack: {
    backgroundColor: '#D8D5C9',
    borderRadius: 4,
    height: 7,
    marginTop: 18,
    overflow: 'hidden',
  },
  progressFill: {backgroundColor: colors.teal, borderRadius: 4, height: 7},
  progressHint: {color: colors.muted, fontSize: 12, marginTop: 12},
  historyPanel: {
    backgroundColor: colors.warm,
    borderRadius: 6,
    marginBottom: 30,
    padding: 18,
  },
  historyTitle: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: '700',
    marginTop: 8,
  },
  historyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 22,
  },
  historyDay: {alignItems: 'center'},
  historyDayName: {color: colors.muted, fontSize: 11, fontWeight: '600'},
  historyDot: {
    backgroundColor: '#D8D5C9',
    borderRadius: 7,
    height: 14,
    marginVertical: 8,
    width: 14,
  },
  historyDotComplete: {backgroundColor: colors.teal},
  historyDayCount: {color: colors.ink, fontSize: 10},
  settingsPanel: {
    backgroundColor: colors.warm,
    borderRadius: 6,
    marginBottom: 30,
    padding: 18,
  },
  settingRow: {
    alignItems: 'center',
    borderTopColor: colors.line,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingTop: 14,
  },
  settingTitle: {color: colors.ink, fontSize: 15, fontWeight: '600'},
  settingDetail: {color: colors.muted, fontSize: 12, marginTop: 4},
  settingValue: {color: colors.teal, fontSize: 12, fontWeight: '700'},
  premiumPanel: {
    backgroundColor: colors.teal,
    borderRadius: 6,
    marginBottom: 30,
    padding: 18,
  },
  premiumPanelLabel: {color: '#FFFFFF'},
  premiumCopy: {color: '#E3F0EA', fontSize: 14, lineHeight: 21, marginTop: 14},
  premiumModalTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 2,
  },
  premiumModalCopy: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },
  billingMessage: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 18,
    textAlign: 'center',
  },
  billingSuccess: {
    color: colors.teal,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 22,
    textAlign: 'center',
  },
  disabledButton: {opacity: 0.55},
  restoreButton: {alignItems: 'center', marginTop: 18, padding: 8},
  restoreButtonText: {color: colors.teal, fontSize: 13, fontWeight: '700'},
  sectionHeader: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {color: colors.ink, fontSize: 18, fontWeight: '700'},
  sectionCount: {color: colors.muted, fontSize: 12},
  habitList: {borderTopColor: colors.line, borderTopWidth: 1},
  habitRow: {
    alignItems: 'center',
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 76,
    paddingVertical: 12,
  },
  habitTapTarget: {alignItems: 'center', flex: 1, flexDirection: 'row'},
  habitRowPressed: {opacity: 0.65},
  habitMarker: {
    alignItems: 'center',
    borderRadius: 17,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  checkmark: {color: '#FFFFFF', fontSize: 10, fontWeight: '800'},
  habitCopy: {flex: 1, marginLeft: 14},
  habitName: {color: colors.ink, fontSize: 16, fontWeight: '600'},
  completedText: {textDecorationLine: 'line-through'},
  habitDetail: {color: colors.muted, fontSize: 12, marginTop: 4},
  streak: {color: colors.teal, fontSize: 11, fontWeight: '700'},
  moreButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    marginLeft: 4,
    width: 30,
  },
  moreText: {
    color: colors.muted,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 2,
  },
  addButton: {
    alignItems: 'center',
    borderColor: colors.teal,
    borderRadius: 5,
    borderWidth: 1,
    marginTop: 24,
    paddingVertical: 13,
  },
  addButtonText: {color: colors.teal, fontSize: 14, fontWeight: '700'},
  buttonPressed: {opacity: 0.7},
  modalBackdrop: {
    backgroundColor: 'rgba(32, 42, 42, 0.35)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    padding: 22,
    paddingBottom: 30,
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 26,
  },
  modalTitle: {color: colors.ink, fontSize: 22, fontWeight: '700'},
  cancelText: {color: colors.teal, fontSize: 14, fontWeight: '600'},
  inputLabel: {
    color: colors.teal,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 7,
    marginTop: 14,
  },
  input: {
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    color: colors.ink,
    fontSize: 16,
    paddingBottom: 10,
    paddingHorizontal: 0,
  },
  timePickerButton: {
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    paddingBottom: 10,
    paddingTop: 2,
  },
  clearReminderText: {
    color: colors.teal,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  repeatDayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  repeatDay: {
    alignItems: 'center',
    borderColor: colors.line,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  repeatDaySelected: {backgroundColor: colors.teal, borderColor: colors.teal},
  repeatDayText: {color: colors.muted, fontSize: 12, fontWeight: '700'},
  repeatDayTextSelected: {color: '#FFFFFF'},
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.teal,
    borderRadius: 5,
    marginTop: 30,
    paddingVertical: 14,
  },
  saveButtonText: {color: '#FFFFFF', fontSize: 14, fontWeight: '700'},
  tabBar: {
    borderTopColor: colors.line,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: -22,
    marginTop: 'auto',
    paddingBottom: 10,
    paddingTop: 18,
  },
  tab: {color: colors.muted, fontSize: 12, fontWeight: '600'},
  activeTab: {color: colors.teal},
});

export default App;
