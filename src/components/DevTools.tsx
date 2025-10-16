import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius } from '../constants/spacing';
import { useOnboarding } from '../hooks/useOnboarding';

interface DevToolsProps {
  visible: boolean;
  onClose: () => void;
}

export function DevTools({ visible, onClose }: DevToolsProps) {
  const { resetOnboarding, isOnboardingCompleted } = useOnboarding();
  const [isPressed, setIsPressed] = useState<string | null>(null);

  const handleResetOnboarding = () => {
    Alert.alert(
      'Reset Onboarding',
      'Are you sure you want to reset the onboarding? This will clear all onboarding data and immediately restart the onboarding flow.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetOnboarding();
              onClose(); // Close the dev tools modal first
              router.replace('/onboarding'); // Navigate to onboarding immediately
            } catch (error) {
              Alert.alert('Error', 'Failed to reset onboarding');
              console.error('Reset onboarding error:', error);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[typography.title, styles.title]}>Dev Tools</Text>
          <Pressable
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={[typography.cardTitle, styles.sectionTitle]}>
              Onboarding
            </Text>
            <Text style={[typography.caption, styles.statusText]}>
              Status: {isOnboardingCompleted ? 'Completed' : 'Not Completed'}
            </Text>
            
            <Pressable
              style={[
                styles.actionButton,
                isPressed === 'reset' && styles.buttonPressed
              ]}
              onPress={handleResetOnboarding}
              onPressIn={() => setIsPressed('reset')}
              onPressOut={() => setIsPressed(null)}
            >
              <Ionicons name="refresh" size={20} color={colors.secondary} />
              <Text style={[typography.button, styles.buttonText]}>
                Reset Onboarding
              </Text>
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={[typography.cardTitle, styles.sectionTitle]}>
              App Info
            </Text>
            <Text style={[typography.caption, styles.infoText]}>
              Version: 1.0.0 (Dev)
            </Text>
            <Text style={[typography.caption, styles.infoText]}>
              Environment: Development
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.xl,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border.primary,
  },
  title: {
    color: colors.text.primary,
  },
  closeButton: {
    padding: spacing.sm,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    gap: spacing.xxl,
  },
  section: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    gap: spacing.lg,
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  sectionTitle: {
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  statusText: {
    color: colors.text.primary,
    opacity: 0.7,
  },
  actionButton: {
    backgroundColor: colors.text.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  buttonText: {
    color: colors.secondary,
  },
  infoText: {
    color: colors.text.primary,
    opacity: 0.7,
  },
});