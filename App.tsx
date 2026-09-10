import React from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {useEffect, useState} from 'react';

import {
  ActionColor,
  Habit,
  clearLocalHabitData,
  getDateKey,
  initialHabits,
  isValidReminderTime,
  isHabitComplete,
  TimeOfDay,
  WEEKDAYS,
  loadHabits,
  loadOnboardingCompleted,
  loadRemindersEnabled,
  loadThemeMode,
  loadActionColor,
  saveOnboardingCompleted,
  saveHabits,
  saveRemindersEnabled,
  saveThemeMode,
  saveActionColor,
  toggleHabitCompletionOnDate,
  ThemeMode,
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
import {ErrorBoundary} from './src/components/ErrorBoundary';
import {HabitActionsModal} from './src/components/HabitActionsModal';
import {DeleteHabitModal} from './src/components/DeleteHabitModal';
import {HabitFormModal} from './src/components/HabitFormModal';
import {HistoryCalendar} from './src/components/HistoryCalendar';
import {ManageHabitsScreen} from './src/components/ManageHabitsScreen';
import {SettingsPanel} from './src/components/SettingsPanel';
import {StatsScreen} from './src/components/StatsScreen';
import {HabitList} from './src/components/TodayHabitList';

type Tab = 'Home' | 'Manage' | 'Stats' | 'Settings';

function AppContent(): React.JSX.Element {
  const [habits, setHabits] = useState(initialHabits);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitDetail, setNewHabitDetail] = useState('');
  const [newHabitReminder, setNewHabitReminder] = useState('');
  const [newHabitRepeatDays, setNewHabitRepeatDays] = useState([...WEEKDAYS]);
  const [newHabitColor, setNewHabitColor] = useState('#286B69');
  const [newHabitTimeOfDay, setNewHabitTimeOfDay] = useState<
    TimeOfDay | undefined
  >();
  const [newHabitLocation, setNewHabitLocation] = useState('');
  const [newHabitDuration, setNewHabitDuration] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);
  const [isOnboardingHydrated, setIsOnboardingHydrated] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [actionColor, setActionColor] = useState<ActionColor>('#286B69');
  const [actionHabit, setActionHabit] = useState<Habit | null>(null);
  const [deleteHabitCandidate, setDeleteHabitCandidate] =
    useState<Habit | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('Home');
  const [historyDate, setHistoryDate] = useState(() => new Date());
  const [selectedStatsHabitId, setSelectedStatsHabitId] = useState<
    number | null
  >(null);
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
  const pageBackground = themeMode === 'dark' ? '#090B0B' : colors.paper;
  const isDarkTheme = themeMode === 'dark';

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      loadHabits(),
      loadOnboardingCompleted(),
      loadRemindersEnabled(),
      loadThemeMode(),
      loadActionColor(),
    ]).then(
      ([
        savedHabits,
        onboardingCompleted,
        savedRemindersEnabled,
        savedThemeMode,
        savedActionColor,
      ]) => {
        if (!isMounted) {
          return;
        }
        setHabits(savedHabits);
        setHasCompletedOnboarding(onboardingCompleted);
        setRemindersEnabled(savedRemindersEnabled);
        setThemeMode(savedThemeMode);
        setActionColor(savedActionColor);
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
    openAddHabit();
  };

  const selectMainTab = (tab: Tab) => {
    if (tab !== 'Stats') {
      setSelectedStatsHabitId(null);
    }
    setActiveTab(tab);
  };

  const deleteLocalData = async () => {
    await Promise.all(habits.map(habit => cancelReminder(habit.id)));
    await clearLocalHabitData();
    setHabits([]);
    setHasCompletedOnboarding(false);
    selectMainTab('Home');
    setHistoryDate(new Date());
    setSelectedStatsHabitId(null);
    setEditingHabitId(null);
    setIsAddModalVisible(false);
  };

  const changeRemindersEnabled = (enabled: boolean) => {
    setRemindersEnabled(enabled);
    saveRemindersEnabled(enabled);
    if (!enabled) {
      Promise.all(habits.map(habit => cancelReminder(habit.id))).catch(
        () => undefined,
      );
    }
  };

  const changeThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode);
    saveThemeMode(mode);
  };

  const changeActionColor = (color: ActionColor) => {
    setActionColor(color);
    saveActionColor(color);
  };

  useEffect(() => {
    if (isHydrated) {
      saveHabits(habits);
    }
  }, [habits, isHydrated]);

  useEffect(() => {
    if (
      !isHydrated ||
      !remindersEnabled ||
      !habits.some(habit => habit.reminderTime)
    ) {
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
  }, [habits, isHydrated, remindersEnabled]);

  const openAddHabit = () => {
    if (!isPremium && habits.length >= 5) {
      selectMainTab('Settings');
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
    setNewHabitColor('#286B69');
    setNewHabitTimeOfDay(undefined);
    setNewHabitLocation('');
    setNewHabitDuration('');
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
    const durationText = newHabitDuration.trim();
    const durationMinutes = durationText ? Number(durationText) : undefined;
    if (!name) {
      Alert.alert('Name your habit', 'Add a name before saving this habit.');
      return;
    }
    if (name.length > 100) {
      Alert.alert('Name is too long', 'Keep habit names under 100 characters.');
      return;
    }
    if (
      habits.some(
        habit =>
          habit.id !== editingHabitId &&
          habit.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase(),
      )
    ) {
      Alert.alert('Habit already exists', 'Choose a different habit name.');
      return;
    }
    if (reminderTime && !isValidReminderTime(reminderTime)) {
      Alert.alert('Check the reminder', 'Use a 24-hour time such as 08:00.');
      return;
    }
    if (
      durationText &&
      (!Number.isInteger(durationMinutes) ||
        durationMinutes === undefined ||
        durationMinutes < 1 ||
        durationMinutes > 1440)
    ) {
      Alert.alert(
        'Check the duration',
        'Enter a whole number of minutes between 1 and 1440.',
      );
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
                color: newHabitColor,
                timeOfDay: newHabitTimeOfDay,
                location: newHabitLocation.trim() || undefined,
                durationMinutes,
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
          color: newHabitColor,
          timeOfDay: newHabitTimeOfDay,
          location: newHabitLocation.trim() || undefined,
          durationMinutes,
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
    setNewHabitColor(habit.color);
    setNewHabitTimeOfDay(habit.timeOfDay);
    setNewHabitLocation(habit.location ?? '');
    setNewHabitDuration(habit.durationMinutes?.toString() ?? '');
    setIsAddModalVisible(true);
  };

  const removeHabit = (habit: Habit) => {
    setDeleteHabitCandidate(habit);
  };

  const confirmDeleteHabit = () => {
    if (!deleteHabitCandidate) {
      return;
    }

    const habit = deleteHabitCandidate;
    setDeleteHabitCandidate(null);
    cancelReminder(habit.id);
    setHabits(current => current.filter(item => item.id !== habit.id));
  };

  const showHabitActions = (habit: Habit) => {
    setActionHabit(habit);
  };

  const toggleHabitOnDate = (habit: Habit, selectedDate: Date) => {
    if (getDateKey(selectedDate) > getDateKey(today)) {
      return;
    }

    setHabits(current =>
      current.map(item => {
        if (item.id !== habit.id) {
          return item;
        }

        return toggleHabitCompletionOnDate(item, selectedDate);
      }),
    );
  };

  if (!isOnboardingHydrated) {
    return (
      <SafeAreaView
        style={[styles.safeArea, {backgroundColor: pageBackground}]}>
        <View style={styles.onboardingLoading}>
          <Text style={styles.eyebrow}>HABITMEISTER</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasCompletedOnboarding) {
    return (
      <SafeAreaView
        style={[styles.safeArea, {backgroundColor: pageBackground}]}>
        <StatusBar
          barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'}
          backgroundColor={pageBackground}
        />
        <View style={styles.onboarding}>
          <Text style={[styles.eyebrow, {color: actionColor}]}>
            A QUIET PLACE TO BEGIN
          </Text>
          <Text
            style={[
              styles.onboardingTitle,
              themeMode === 'dark' && styles.darkOnboardingText,
            ]}>
            Build a rhythm that lasts.
          </Text>
          <Text
            style={[
              styles.onboardingCopy,
              themeMode === 'dark' && styles.darkOnboardingMutedText,
            ]}>
            Keep a few meaningful habits close, mark each small win, and let
            consistency compound.
          </Text>
          <View style={styles.onboardingRule} />
          <Text
            style={[
              styles.onboardingNote,
              themeMode === 'dark' && styles.darkOnboardingMutedText,
            ]}>
            Your habits are stored locally and work offline.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={completeOnboarding}
            style={({pressed}) => [
              styles.saveButton,
              {backgroundColor: actionColor},
              pressed && styles.buttonPressed,
            ]}>
            <Text style={styles.saveButtonText}>Begin with my habits</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, {backgroundColor: pageBackground}]}>
      <StatusBar
        barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={pageBackground}
      />
      <View style={styles.container}>
        {activeTab === 'Home' && (
          <View style={styles.header}>
            <View>
              <Text style={[styles.eyebrow, {color: actionColor}]}>
                {dateLabel}
              </Text>
              <Text style={[styles.title, isDarkTheme && styles.darkTitle]}>
                Good morning, Carl
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Open profile"
              style={[styles.avatar, {backgroundColor: `${actionColor}22`}]}>
              <Text style={[styles.avatarText, {color: actionColor}]}>C</Text>
            </Pressable>
          </View>
        )}

        <ScrollView
          contentContainerStyle={styles.contentScrollContent}
          showsVerticalScrollIndicator={false}
          style={styles.contentScroll}>
          {activeTab === 'Home' ? (
            <>
              <HistoryCalendar
                habits={habits}
                actionColor={actionColor}
                isDarkTheme={isDarkTheme}
                onChangeDate={setHistoryDate}
                selectedDate={historyDate}
              />
              <View style={styles.progressPanel}>
                <View style={styles.progressHeader}>
                  <View>
                    <Text style={[styles.panelLabel, {color: actionColor}]}>
                      TODAY'S RHYTHM
                    </Text>
                    <Text style={styles.progressTitle}>
                      {completedCount} of {habits.length} complete
                    </Text>
                  </View>
                  <Text style={[styles.progressPercent, {color: actionColor}]}>
                    {Math.round(progress * 100)}%
                  </Text>
                </View>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: actionColor,
                        width: `${progress * 100}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressHint}>
                  Small steps, repeated with care.
                </Text>
              </View>
              <HabitList
                habits={habits}
                actionColor={actionColor}
                isDarkTheme={isDarkTheme}
                onAddHabit={openAddHabit}
                onMoreActions={showHabitActions}
                onToggleHabitOnDate={toggleHabitOnDate}
                selectedDate={historyDate}
              />
            </>
          ) : activeTab === 'Manage' ? (
            <ManageHabitsScreen
              habits={habits}
              actionColor={actionColor}
              isDarkTheme={isDarkTheme}
              onAddHabit={openAddHabit}
              onEditHabit={editHabit}
              onRemoveHabit={removeHabit}
            />
          ) : activeTab === 'Stats' ? (
            selectedStatsHabitId === null ? (
              <StatsScreen
                habits={habits}
                actionColor={actionColor}
                isDarkTheme={isDarkTheme}
                onHabitPress={habit => setSelectedStatsHabitId(habit.id)}
                today={today}
              />
            ) : (
              <StatsScreen
                habits={habits}
                actionColor={actionColor}
                isDarkTheme={isDarkTheme}
                onBack={() => setSelectedStatsHabitId(null)}
                selectedHabitId={selectedStatsHabitId}
                today={today}
              />
            )
          ) : activeTab === 'Settings' ? (
            <SettingsPanel
              activeHabitCount={habits.length}
              actionColor={actionColor}
              apiKeyConfigured={Boolean(REVENUECAT_API_KEY)}
              billingMessage={billingMessage}
              isBillingBusy={isBillingBusy}
              isPremium={isPremium}
              isPremiumModalVisible={isPremiumModalVisible}
              offer={premiumOffer}
              onClosePremium={() => setIsPremiumModalVisible(false)}
              onDeleteLocalData={deleteLocalData}
              onActionColorChange={changeActionColor}
              onRemindersEnabledChange={changeRemindersEnabled}
              onThemeModeChange={changeThemeMode}
              onOpenPremium={openPremium}
              onPurchasePremium={purchasePremium}
              onRestorePremium={restorePremium}
              remindersEnabled={remindersEnabled}
              themeMode={themeMode}
            />
          ) : null}
        </ScrollView>

        <View style={styles.tabBar}>
          {(['Home', 'Manage', 'Stats', 'Settings'] as Tab[]).map(tab => (
            <Pressable key={tab} onPress={() => selectMainTab(tab)}>
              <Text
                style={[
                  styles.tab,
                  {color: activeTab === tab ? actionColor : colors.muted},
                ]}>
                {tab}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <HabitFormModal
        actionColor={actionColor}
        themeMode={themeMode}
        detail={newHabitDetail}
        duration={newHabitDuration}
        editingHabitId={editingHabitId}
        location={newHabitLocation}
        name={newHabitName}
        onChangeColor={setNewHabitColor}
        onChangeDetail={setNewHabitDetail}
        onChangeDuration={setNewHabitDuration}
        onChangeLocation={setNewHabitLocation}
        onChangeName={setNewHabitName}
        onChangeReminder={setNewHabitReminder}
        onChangeTimeOfDay={setNewHabitTimeOfDay}
        onClose={() => {
          setIsAddModalVisible(false);
          setEditingHabitId(null);
        }}
        onSave={addHabit}
        onToggleDay={toggleRepeatDay}
        reminder={newHabitReminder}
        repeatDays={newHabitRepeatDays}
        selectedColor={newHabitColor}
        timeOfDay={newHabitTimeOfDay}
        visible={isAddModalVisible}
      />
      <HabitActionsModal
        actionColor={actionColor}
        habitName={actionHabit?.name ?? ''}
        isDarkTheme={isDarkTheme}
        onClose={() => setActionHabit(null)}
        onDelete={() => {
          if (actionHabit) {
            const habit = actionHabit;
            setActionHabit(null);
            removeHabit(habit);
          }
        }}
        onEdit={() => {
          if (actionHabit) {
            const habit = actionHabit;
            setActionHabit(null);
            editHabit(habit);
          }
        }}
        visible={actionHabit !== null}
      />
      <DeleteHabitModal
        actionColor={actionColor}
        habitName={deleteHabitCandidate?.name ?? ''}
        isDarkTheme={isDarkTheme}
        onCancel={() => setDeleteHabitCandidate(null)}
        onConfirm={confirmDeleteHabit}
        visible={deleteHabitCandidate !== null}
      />
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
  contentScroll: {flex: 1},
  contentScrollContent: {flexGrow: 1, paddingBottom: 24},
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
  buttonPressed: {opacity: 0.7},
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
  darkTitle: {color: '#F5F7F6'},
  darkOnboardingText: {color: '#F5F7F6'},
  darkOnboardingMutedText: {color: '#B7C1BE'},
});

function App(): React.JSX.Element {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;
