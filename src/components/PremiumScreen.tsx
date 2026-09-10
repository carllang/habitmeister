import React from 'react';
import {Modal, Pressable, StyleSheet, Text, View} from 'react-native';

import type {PremiumOffer} from '../monetization/entitlement';

type PremiumScreenProps = {
  actionColor: string;
  themeMode: 'light' | 'dark';
  apiKeyConfigured: boolean;
  billingMessage: string;
  isBillingBusy: boolean;
  isPremium: boolean;
  isPremiumModalVisible: boolean;
  offer: PremiumOffer | null;
  onClosePremium: () => void;
  onOpenPremium: () => void;
  onPurchasePremium: () => void;
  onRestorePremium: () => void;
};

export function PremiumScreen({
  actionColor,
  themeMode,
  apiKeyConfigured,
  billingMessage,
  isBillingBusy,
  isPremium,
  isPremiumModalVisible,
  offer,
  onClosePremium,
  onOpenPremium,
  onPurchasePremium,
  onRestorePremium,
}: PremiumScreenProps): React.JSX.Element {
  const isDarkTheme = themeMode === 'dark';
  const modalBackground = isDarkTheme ? '#111414' : '#F7F3EC';
  const actionTextColor = actionColor === '#B27A00' ? '#202A2A' : '#FFFFFF';

  const modalText = isDarkTheme ? '#F5F7F6' : '#202A2A';
  const modalMutedText = isDarkTheme ? '#B7C1BE' : '#778080';

  return (
    <>
      <View style={[styles.panel, {backgroundColor: actionColor}]}>
        <Text style={styles.panelLabel}>HABITMEISTER PREMIUM</Text>
        <Text style={[styles.panelTitle, {color: actionTextColor}]}>
          More room for the life you are building.
        </Text>
        <Text style={styles.panelCopy}>
          Unlock unlimited habits, deeper insights, and data export while
          keeping the daily habit loop free for everyone.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={onOpenPremium}
          style={({pressed}) => [
            styles.primaryButton,
            {backgroundColor: actionColor},
            pressed && styles.buttonPressed,
          ]}>
          <Text style={[styles.primaryButtonText, {color: actionTextColor}]}>
            {isPremium ? 'Premium active' : 'Explore Premium'}
          </Text>
        </Pressable>
      </View>

      <Modal
        animationType="slide"
        onRequestClose={onClosePremium}
        transparent
        visible={isPremiumModalVisible}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, {backgroundColor: modalBackground}]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, {color: modalText}]}>
                Premium
              </Text>
              <Pressable accessibilityRole="button" onPress={onClosePremium}>
                <Text style={[styles.cancelText, {color: actionColor}]}>
                  Close
                </Text>
              </Pressable>
            </View>
            <Text style={[styles.modalCopyTitle, {color: modalText}]}>
              Make more room for your rhythm.
            </Text>
            <Text style={[styles.modalCopy, {color: modalMutedText}]}>
              Unlock unlimited habits and keep your progress growing across
              every season.
            </Text>
            {isPremium ? (
              <Text style={[styles.billingSuccess, {color: actionColor}]}>
                Premium is active.
              </Text>
            ) : offer ? (
              <Pressable
                accessibilityRole="button"
                disabled={isBillingBusy}
                onPress={onPurchasePremium}
                style={({pressed}) => [
                  styles.primaryButton,
                  {backgroundColor: actionColor},
                  pressed && styles.buttonPressed,
                  isBillingBusy && styles.disabledButton,
                ]}>
                <Text
                  style={[styles.primaryButtonText, {color: actionTextColor}]}>
                  {isBillingBusy
                    ? 'Connecting to Google Play...'
                    : `Continue for ${offer.price}`}
                </Text>
              </Pressable>
            ) : (
              <Text style={[styles.billingMessage, {color: modalMutedText}]}>
                {apiKeyConfigured
                  ? 'Loading the Google Play subscription...'
                  : 'Google Play billing is not configured yet.'}
              </Text>
            )}
            {billingMessage ? (
              <Text style={[styles.billingMessage, {color: modalMutedText}]}>
                {billingMessage}
              </Text>
            ) : null}
            {!isPremium && (
              <Pressable
                accessibilityRole="button"
                disabled={isBillingBusy}
                onPress={onRestorePremium}
                style={styles.restoreButton}>
                <Text style={[styles.restoreButtonText, {color: actionColor}]}>
                  Restore purchase
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: '#286B69',
    borderRadius: 6,
    marginBottom: 30,
    padding: 18,
  },
  panelLabel: {
    color: '#FFFFFF',
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
  panelCopy: {color: '#E3F0EA', fontSize: 14, lineHeight: 21, marginTop: 14},
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#D9A441',
    borderRadius: 5,
    marginTop: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  primaryButtonText: {color: '#202A2A', fontSize: 14, fontWeight: '700'},
  buttonPressed: {opacity: 0.72},
  disabledButton: {opacity: 0.55},
  modalBackdrop: {
    backgroundColor: 'rgba(32, 42, 42, 0.42)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#F7F3EC',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    padding: 24,
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalTitle: {color: '#202A2A', fontSize: 17, fontWeight: '700'},
  cancelText: {color: '#286B69', fontSize: 13, fontWeight: '700'},
  modalCopyTitle: {
    color: '#202A2A',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 22,
  },
  modalCopy: {
    color: '#778080',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },
  billingMessage: {
    color: '#778080',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 18,
    textAlign: 'center',
  },
  billingSuccess: {
    color: '#286B69',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 22,
    textAlign: 'center',
  },
  restoreButton: {alignItems: 'center', marginTop: 18, padding: 8},
  restoreButtonText: {color: '#286B69', fontSize: 13, fontWeight: '700'},
});
