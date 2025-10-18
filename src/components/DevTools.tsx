import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing, borderRadius } from '../constants/spacing';
import { useOnboarding } from '../hooks/useOnboarding';
import database from '../db';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DevToolsProps {
  visible: boolean;
  onClose: () => void;
  onShowPaywall?: () => void;
  onShowUpgradePaywall?: () => void;
}

export function DevTools({ visible, onClose, onShowPaywall, onShowUpgradePaywall }: DevToolsProps) {
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

  const handleCompleteReset = () => {
    Alert.alert(
      'COMPLETE DATA WIPE',
      '⚠️ This will permanently delete ALL app data including:\n\n• All goals, milestones, and tasks\n• All vision board images\n• Onboarding data\n• User preferences\n• Focus history\n• All local storage\n\nThis action cannot be undone! Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'WIPE ALL DATA',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🔥 Starting complete data wipe...');
              
              // Clear all AsyncStorage
              await AsyncStorage.clear();
              console.log('✅ AsyncStorage cleared');
              
              // Clear all database tables
              if (database) {
                await database.write(async () => {
                  // Delete all records from all tables
                  const collections = [
                    'goals',
                    'milestones', 
                    'tasks',
                    'vision_images',
                    'focus_sessions'
                  ];
                  
                  for (const collectionName of collections) {
                    try {
                      if (!database) {
                        console.warn(`⚠️ Database not available, skipping ${collectionName}`);
                        return;
                      }
                      const collection = database.get(collectionName);
                      const allRecords = await collection.query().fetch();
                      
                      for (const record of allRecords) {
                        await record.destroyPermanently();
                      }
                      
                      console.log(`✅ Cleared ${collectionName}: ${allRecords.length} records deleted`);
                    } catch (error) {
                      console.error(`❌ Error clearing ${collectionName}:`, error);
                    }
                  }
                });
              }
              
              // Reset onboarding last to ensure fresh start
              await resetOnboarding();
              
              console.log('🚀 Complete data wipe finished, restarting app...');
              
              onClose(); // Close modal
              router.replace('/onboarding'); // Force restart onboarding
              
              Alert.alert('Success', 'All data has been wiped. The app has been reset to first-time use state.');
              
            } catch (error) {
              console.error('❌ Error during complete reset:', error);
              Alert.alert('Error', 'Failed to complete data wipe. Check console for details.');
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

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={{ gap: spacing.xxl }}>
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
            
            <Pressable
              style={[
                styles.dangerButton,
                isPressed === 'wipe' && styles.buttonPressed
              ]}
              onPress={handleCompleteReset}
              onPressIn={() => setIsPressed('wipe')}
              onPressOut={() => setIsPressed(null)}
            >
              <Ionicons name="trash" size={20} color="#FFFFFF" />
              <Text style={[typography.button, styles.dangerButtonText]}>
                WIPE ALL DATA
              </Text>
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={[typography.cardTitle, styles.sectionTitle]}>
              Subscription Testing
            </Text>
            <Text style={[typography.caption, styles.statusText]}>
              Test RevenueCat integration and paywalls
            </Text>
            
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

          {/* Paywall Testing Section */}
          <View style={styles.section}>
            <Text style={[typography.cardTitle, styles.sectionTitle]}>
              Paywall Testing
            </Text>
            
            <Pressable
              style={[
                styles.actionButton,
                isPressed === 'onboarding-paywall' && styles.buttonPressed
              ]}
              onPress={() => {
                onClose();
                router.push('/onboarding-paywall');
              }}
              onPressIn={() => setIsPressed('onboarding-paywall')}
              onPressOut={() => setIsPressed(null)}
            >
              <Ionicons name="card" size={20} color={colors.secondary} />
              <Text style={[typography.button, styles.buttonText]}>
                Show Onboarding Paywall
              </Text>
            </Pressable>
            
            <Pressable
              style={[
                styles.actionButton,
                isPressed === 'upgrade-paywall' && styles.buttonPressed
              ]}
              onPress={() => {
                onClose();
                router.push('/paywall?type=feature_upgrade');
              }}
              onPressIn={() => setIsPressed('upgrade-paywall')}
              onPressOut={() => setIsPressed(null)}
            >
              <Ionicons name="arrow-up" size={20} color={colors.secondary} />
              <Text style={[typography.button, styles.buttonText]}>
                Show Feature Upgrade Paywall
              </Text>
            </Pressable>
            
            <Pressable
              style={[
                styles.paywallButton,
                isPressed === 'force-paywall' && styles.buttonPressed
              ]}
              onPress={() => {
                onClose();
                router.push('/onboarding-paywall');
              }}
              onPressIn={() => setIsPressed('force-paywall')}
              onPressOut={() => setIsPressed(null)}
            >
              <Ionicons name="flash" size={20} color="#FFFFFF" />
              <Text style={[typography.button, styles.paywallButtonText]}>
                Force Onboarding Paywall
              </Text>
            </Pressable>
          </View>
          </View>

        </ScrollView>
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
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
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
  dangerButton: {
    backgroundColor: '#DC3545',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    shadowColor: '#DC3545',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  infoText: {
    color: colors.text.primary,
    opacity: 0.7,
  },
  paywallButton: {
    backgroundColor: '#6A5ACD',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    shadowColor: '#6A5ACD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  paywallButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  upgradeButton: {
    backgroundColor: '#228B22',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    shadowColor: '#228B22',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});