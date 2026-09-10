import React, {useState} from 'react';
import {Pressable, StyleSheet, Switch, Text, View} from 'react-native';

import type {PremiumOffer} from '../monetization/entitlement';
import {ACTION_COLORS, ActionColor} from '../data/habitRepository';
import {PremiumScreen} from './PremiumScreen';
import {DeleteLocalDataModal} from './DeleteLocalDataModal';

type SettingsPanelProps = {
  activeHabitCount: number;
  apiKeyConfigured: boolean;
  billingMessage: string;
  isBillingBusy: boolean;
  isPremium: boolean;
  isPremiumModalVisible: boolean;
  offer: PremiumOffer | null;
  remindersEnabled: boolean;
  themeMode: 'light' | 'dark';
  actionColor: ActionColor;
  onClosePremium: () => void;
  onDeleteLocalData: () => Promise<void>;
  onRemindersEnabledChange: (enabled: boolean) => void;
  onThemeModeChange: (mode: 'light' | 'dark') => void;
  onActionColorChange: (color: ActionColor) => void;
  onOpenPremium: () => void;
  onPurchasePremium: () => void;
  onRestorePremium: () => void;
};

export function SettingsPanel({
  activeHabitCount,
  apiKeyConfigured,
  billingMessage,
  isBillingBusy,
  isPremium,
  isPremiumModalVisible,
  offer,
  remindersEnabled,
  themeMode,
  actionColor,
  onClosePremium,
  onDeleteLocalData,
  onRemindersEnabledChange,
  onThemeModeChange,
  onActionColorChange,
  onOpenPremium,
  onPurchasePremium,
  onRestorePremium,
}: SettingsPanelProps): React.JSX.Element {
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const isDarkTheme = themeMode === 'dark';
  const textColor = isDarkTheme ? '#F1F5F2' : '#202A2A';
  const mutedColor = isDarkTheme ? '#B7C5C0' : '#778080';
  const panelColor = isDarkTheme ? '#171A19' : '#F0E8DC';

  return (
    <View>
      <View style={[styles.panel, {backgroundColor: panelColor}]}>
        <Text style={[styles.panelLabel, {color: actionColor}]}>
          PREFERENCES
        </Text>
        <Text style={[styles.panelTitle, {color: textColor}]}>
          Make the routine yours
        </Text>
        <View style={styles.settingRow}>
          <View>
            <Text style={[styles.settingTitle, {color: textColor}]}>
              Active habits
            </Text>
            <Text style={[styles.settingDetail, {color: mutedColor}]}>
              Keep your daily list focused.
            </Text>
          </View>
          <Text style={[styles.settingValue, {color: actionColor}]}>
            {activeHabitCount} / 5
          </Text>
        </View>
        <View style={styles.settingRow}>
          <View>
            <Text style={[styles.settingTitle, {color: textColor}]}>
              Action color
            </Text>
            <Text style={[styles.settingDetail, {color: mutedColor}]}>
              Choose interactive accents.
            </Text>
          </View>
          <View style={styles.colorChoices}>
            {ACTION_COLORS.map(color => (
              <Pressable
                accessibilityLabel={`Choose action color ${color}`}
                accessibilityRole="radio"
                accessibilityState={{selected: actionColor === color}}
                key={color}
                onPress={() => onActionColorChange(color)}
                style={[
                  styles.colorChoice,
                  {backgroundColor: color},
                  actionColor === color && styles.selectedColorChoice,
                ]}
              />
            ))}
          </View>
        </View>
        <View style={styles.settingRow}>
          <View>
            <Text style={[styles.settingTitle, {color: textColor}]}>Theme</Text>
            <Text style={[styles.settingDetail, {color: mutedColor}]}>
              Choose a comfortable appearance.
            </Text>
          </View>
          <Switch
            accessibilityLabel="Use dark theme"
            onValueChange={enabled =>
              onThemeModeChange(enabled ? 'dark' : 'light')
            }
            value={themeMode === 'dark'}
          />
        </View>
        <View style={styles.settingRow}>
          <View>
            <Text style={[styles.settingTitle, {color: textColor}]}>
              Reminders
            </Text>
            <Text style={[styles.settingDetail, {color: mutedColor}]}>
              Allow scheduled habit notifications.
            </Text>
          </View>
          <Switch
            accessibilityLabel="Enable reminders"
            onValueChange={onRemindersEnabledChange}
            value={remindersEnabled}
          />
        </View>
        <View style={styles.settingRow}>
          <View>
            <Text style={[styles.settingTitle, {color: textColor}]}>
              Storage
            </Text>
            <Text style={[styles.settingDetail, {color: mutedColor}]}>
              Your habits stay on this device.
            </Text>
          </View>
          <Text style={[styles.settingValue, {color: actionColor}]}>
            Offline
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => setIsDeleteModalVisible(true)}
          style={[styles.deleteButton, {borderColor: actionColor}]}>
          <Text style={[styles.deleteButtonText, {color: actionColor}]}>
            Delete local data
          </Text>
        </Pressable>
      </View>
      <PremiumScreen
        actionColor={actionColor}
        themeMode={themeMode}
        apiKeyConfigured={apiKeyConfigured}
        billingMessage={billingMessage}
        isBillingBusy={isBillingBusy}
        isPremium={isPremium}
        isPremiumModalVisible={isPremiumModalVisible}
        offer={offer}
        onClosePremium={onClosePremium}
        onOpenPremium={onOpenPremium}
        onPurchasePremium={onPurchasePremium}
        onRestorePremium={onRestorePremium}
      />
      <DeleteLocalDataModal
        actionColor={actionColor}
        isDarkTheme={isDarkTheme}
        onCancel={() => setIsDeleteModalVisible(false)}
        onConfirm={() => {
          setIsDeleteModalVisible(false);
          onDeleteLocalData().catch(() => undefined);
        }}
        visible={isDeleteModalVisible}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: '#F0E8DC',
    borderRadius: 6,
    marginBottom: 30,
    padding: 18,
  },
  panelLabel: {
    color: '#286B69',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  panelTitle: {
    color: '#202A2A',
    fontSize: 19,
    fontWeight: '700',
    marginTop: 8,
  },
  settingRow: {
    alignItems: 'center',
    borderTopColor: '#E5DED3',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingTop: 14,
  },
  settingTitle: {color: '#202A2A', fontSize: 15, fontWeight: '600'},
  settingDetail: {color: '#778080', fontSize: 12, marginTop: 4},
  settingValue: {color: '#286B69', fontSize: 12, fontWeight: '700'},
  deleteButton: {
    borderColor: '#A34B45',
    borderRadius: 5,
    borderWidth: 1,
    marginTop: 24,
    paddingVertical: 12,
  },
  deleteButtonText: {
    color: '#A34B45',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  colorChoices: {flexDirection: 'row', gap: 7},
  colorChoice: {borderRadius: 12, height: 24, width: 24},
  selectedColorChoice: {borderColor: '#FFFFFF', borderWidth: 3},
});
