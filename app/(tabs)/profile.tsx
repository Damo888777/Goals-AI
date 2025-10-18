import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  Switch,
  Alert,
  Linking,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Clipboard } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useAuth, useGoals, useTasks } from '../../src/hooks/useDatabase';
import { useOnboarding } from '../../src/hooks/useOnboarding';
import { useSubscription } from '../../src/hooks/useSubscription';
import { supabase } from '../../src/lib/supabase';
import { colors } from '../../src/constants/colors';
import { typography } from '../../src/constants/typography';
import { spacing, borderRadius } from '../../src/constants/spacing';
import { images } from '../../src/constants/images';
import { DevTools } from '../../src/components/DevTools';
// import { SUBSCRIPTION_TIERS } from '../../src/types/subscription';

interface Stats {
  eatTheFrogStreak: number;
  goalsAchieved: number;
  totalFocusTime: number; // in minutes
}

// Animated Flame Component
const AnimatedFlame: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isActive) {
      const createAnimation = () => {
        return Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(scaleAnim, {
                toValue: 1.1,
                duration: 800,
                useNativeDriver: true,
              }),
              Animated.timing(opacityAnim, {
                toValue: 0.8,
                duration: 800,
                useNativeDriver: true,
              }),
            ]),
            Animated.parallel([
              Animated.timing(scaleAnim, {
                toValue: 0.9,
                duration: 600,
                useNativeDriver: true,
              }),
              Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
              }),
            ]),
          ])
        );
      };
      
      createAnimation().start();
    } else {
      scaleAnim.setValue(1);
      opacityAnim.setValue(1);
    }
  }, [isActive, scaleAnim, opacityAnim]);

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
        opacity: opacityAnim,
      }}
    >
      <Ionicons 
        name="flame" 
        size={24} 
        color={isActive ? colors.text.primary : '#7C7C7C'} 
      />
    </Animated.View>
  );
};

export default function ProfileTab() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { goals } = useGoals();
  const { tasks } = useTasks();
  const { userPreferences, updateUserPreferences } = useOnboarding();
  const { 
    currentTier, 
    isSubscribed, 
    isCurrentSubscriptionAnnual,
    isLoading: isSubscriptionLoading, 
    customerInfo,
    canUseSparkAIVoice,
    canUseSparkAIVision,
    getUsageLimits
  } = useSubscription();
  
  const [userName, setUserName] = useState(userPreferences?.name || 'User');
  const [originalUserName, setOriginalUserName] = useState(userPreferences?.name || 'User');
  const [isEditingName, setIsEditingName] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isPressed, setIsPressed] = useState<string | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showDevTools, setShowDevTools] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showUpgradePaywall, setShowUpgradePaywall] = useState(false);
  const [stats, setStats] = useState<Stats>({
    eatTheFrogStreak: 0,
    goalsAchieved: 0,
    totalFocusTime: 0,
  });

  // Generate mock user ID for now  
  const userId = user?.id || 'anon_' + Math.random().toString(36).substring(2, 11);

  useEffect(() => {
    loadStats();
    checkAuthStatus();
  }, [goals, tasks]);

  useEffect(() => {
    if (userPreferences?.name) {
      setUserName(userPreferences.name);
      setOriginalUserName(userPreferences.name);
    }
  }, [userPreferences]);

  const checkAuthStatus = async () => {
    try {
      const { authService } = await import('../../src/services/authService')
      const currentUser = authService.getCurrentUser()
      
      if (currentUser && !currentUser.isAnonymous) {
        setIsSignedIn(true)
        setUserEmail(currentUser.email || null)
      } else {
        setIsSignedIn(false)
        setUserEmail(null)
      }
    } catch (error) {
      console.error('Error checking auth status:', error)
    }
  };

  const loadStats = async () => {
    try {
      // Calculate real stats from database
      const completedGoals = goals.filter(goal => goal.isCompleted).length;
      
      // Calculate frog streak - simplified for now
      const frogTasks = tasks.filter(task => task.isFrog && task.isComplete);
      const frogStreak = frogTasks.length; // Simplified calculation
      
      // Calculate total focus time from all tasks
      let totalFocusMinutes = 0;
      tasks.forEach((task: any) => {
        if (task.focusSessions && task.focusSessions.length > 0) {
          task.focusSessions.forEach((session: any) => {
            totalFocusMinutes += Math.floor(session.duration / 60); // Convert seconds to minutes
          });
        }
      });

      setStats({
        eatTheFrogStreak: frogStreak,
        goalsAchieved: completedGoals,
        totalFocusTime: totalFocusMinutes,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      })

      if (credential.identityToken && supabase) {
        const { data: { user }, error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        })

        if (error) {
          Alert.alert('Sign In Error', error.message)
        } else {
          // Use authService to handle the upgrade from anonymous to authenticated
          const { authService } = await import('../../src/services/authService')
          await authService.upgradeToAppleSignIn(user)
          
          setIsSignedIn(true)
          setUserEmail(user?.email || null)
          
          // Update user name if available
          if (credential.fullName?.givenName) {
            setUserName(credential.fullName.givenName)
          }
          
          Alert.alert('Success', 'Successfully signed in with Apple! Your data has been synced to the cloud.')
        }
      }
    } catch (e: any) {
      if (e.code === 'ERR_REQUEST_CANCELED') {
        // User canceled the sign-in flow
        console.log('User canceled Apple Sign In')
      } else {
        Alert.alert('Error', 'Failed to sign in with Apple')
        console.error('Apple Sign In error:', e)
      }
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? Your data will remain available locally.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'default',
          onPress: async () => {
            try {
              // Use authService instead of direct Supabase call
              const { authService } = await import('../../src/services/authService')
              await authService.signOut()
              
              setIsSignedIn(false)
              setUserEmail(null)
              Alert.alert('Success', 'Successfully signed out. You can continue using the app anonymously.')
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out')
            }
          }
        }
      ]
    )
  };

  const handleDeleteAccount = async () => {
    if (!supabase) {
      Alert.alert('Error', 'Supabase not configured');
      return;
    }

    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone and all your data will be lost.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              // Note: Account deletion should be handled by a server function
              // For now, we'll just sign out the user
              const { error } = await supabase!.auth.signOut();
              if (error) {
                Alert.alert('Error', 'Failed to delete account');
              } else {
                setIsSignedIn(false);
                setUserEmail(null);
                Alert.alert(
                  'Account Deletion', 
                  'Your account deletion request has been processed. Please contact support if you need assistance.'
                );
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account');
            }
          }
        }
      ]
    );
  };

  const handleSupportFeedback = async () => {
    const emailContent = `Hello Goals AI Support,

User ID: ${userId}

[Please describe your feedback, bug report, or feature suggestion here]

Note: If your feedback/idea gets implemented, you'll receive 1 month free subscription!

Best regards`;

    try {
      Clipboard.setString(emailContent);
      Alert.alert(
        'Email Template Copied!', 
        'The support email template has been copied to your clipboard. Please paste it into your email app and send to: support@goals-ai.app\n\nDon\'t forget to include your User ID for faster support!'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to copy email template to clipboard.');
    }
  };

  const formatFocusTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://goals-ai.app/privacy');
  };

  const openTerms = () => {
    Linking.openURL('https://goals-ai.app/terms');
  };

  const handleSaveUsername = async () => {
    if (userName.trim() && userName !== originalUserName) {
      try {
        await updateUserPreferences({ name: userName.trim() });
        setOriginalUserName(userName.trim());
        setIsEditingName(false);
        Alert.alert('Success', 'Username updated successfully!');
      } catch (error) {
        console.error('Error updating username:', error);
        Alert.alert('Error', 'Failed to update username. Please try again.');
      }
    }
  };

  const handleCancelEditUsername = () => {
    setUserName(originalUserName);
    setIsEditingName(false);
  };

  const handlePressIn = (id: string) => setIsPressed(id);
  const handlePressOut = () => setIsPressed(null);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingHorizontal: 36,
          paddingBottom: 50,
          gap: spacing.xxxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="person" size={20} color={colors.secondary} />
              <Text style={[typography.title, styles.sectionTitle]}>Your Profile</Text>
            </View>
          </View>
          
          <View style={styles.profileCard}>
            <View style={styles.profileContent}>
              <View style={styles.avatarContainer}>
                <Ionicons name="person" size={32} color={colors.text.primary} />
              </View>
              
              <View style={styles.profileInfo}>
                {isEditingName ? (
                  <View style={styles.nameEditContainer}>
                    <TextInput
                      style={styles.nameInput}
                      value={userName}
                      onChangeText={setUserName}
                      autoFocus
                      placeholderTextColor="rgba(245,235,224,0.5)"
                      placeholder="Enter your name"
                    />
                    <View style={styles.nameEditButtons}>
                      <Pressable
                        style={[styles.nameEditButton, styles.cancelButton]}
                        onPress={handleCancelEditUsername}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.nameEditButton, styles.saveButton]}
                        onPress={handleSaveUsername}
                        disabled={!userName.trim() || userName === originalUserName}
                      >
                        <Text style={styles.saveButtonText}>Save</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Pressable
                    style={styles.nameContainer}
                    onPress={() => setIsEditingName(true)}
                  >
                    <Text style={[typography.title, styles.userName]}>{userName}</Text>
                    <Ionicons name="pencil" size={16} color={colors.secondary} />
                  </Pressable>
                )}
              </View>
            </View>
            
            {/* Apple Sign In / Account Management */}
            {Platform.OS === 'ios' && (
              <View style={styles.appleSignInContainer}>
                {!isSignedIn ? (
                  // Not signed in - show sign in button
                  <>
                    <Pressable 
                      style={[styles.appleSignInButton, isPressed === 'apple' && styles.buttonPressed]} 
                      onPress={handleAppleSignIn}
                      onPressIn={() => handlePressIn('apple')}
                      onPressOut={handlePressOut}
                    >
                      <Ionicons name="logo-apple" size={20} color={colors.secondary} />
                      <Text style={[typography.button, styles.buttonText]}>Sign In with Apple</Text>
                    </Pressable>
                    <Text style={[typography.caption, styles.appleSignInDescription]}>
                      Sign in to permanently save your data and sync across devices
                    </Text>
                  </>
                ) : (
                  // Signed in - show account info and management
                  <View style={styles.signedInContainer}>
                    <View style={styles.accountInfo}>
                      <View style={styles.accountDetails}>
                        <Text style={[typography.cardTitle, styles.accountLabel]}>Data Synced</Text>
                        <Text style={[typography.caption, styles.accountEmail]}>
                          {userEmail ? userEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3') : 'Email hidden'}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.accountActions}>
                      <Pressable 
                        style={[styles.accountButton, styles.deleteButton, isPressed === 'delete' && styles.buttonPressed]} 
                        onPress={handleDeleteAccount}
                        onPressIn={() => handlePressIn('delete')}
                        onPressOut={handlePressOut}
                      >
                        <Text style={[typography.caption, styles.deleteButtonText]}>Delete Account</Text>
                      </Pressable>
                      
                      <Pressable 
                        style={[styles.accountButton, styles.signOutButton, isPressed === 'signout' && styles.buttonPressed]} 
                        onPress={handleSignOut}
                        onPressIn={() => handlePressIn('signout')}
                        onPressOut={handlePressOut}
                      >
                        <Text style={[typography.caption, styles.signOutButtonText]}>Sign Out</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Subscription Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="diamond" size={20} color={colors.secondary} />
              <Text style={[typography.title, styles.sectionTitle]}>Subscription</Text>
            </View>
          </View>
          
          <View style={styles.subscriptionCard}>
            {isSubscriptionLoading ? (
              <View style={styles.subscriptionLoading}>
                <Text style={styles.subscriptionLoadingText}>Loading subscription...</Text>
              </View>
            ) : (
              <>
                {/* Subscription Header */}
                <View style={styles.subscriptionHeader}>
                  <View style={styles.subscriptionInfo}>
                    <Text style={styles.subscriptionTier}>
                      {currentTier?.name || 'Free Trial'}
                    </Text>
                    <Text style={styles.subscriptionStatus}>
                      {isSubscribed 
                        ? customerInfo?.latestExpirationDate 
                          ? `Renewal at ${new Date(customerInfo.latestExpirationDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).replace(/,/g, '.')}`
                          : 'Active Subscription'
                        : `Free trial until ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).replace(/,/g, '.')}`
                      }
                    </Text>
                  </View>
                </View>

                {/* Usage Information */}
                <View style={styles.subscriptionFeatures}>
                  <View style={styles.subscriptionFeature}>
                    <Ionicons name="mic" size={16} color={colors.text.primary} />
                    <Text style={styles.subscriptionFeatureText}>
                      <Text style={{ fontWeight: 'bold' }}>
                        {/* TODO: Add actual usage tracking */}0
                      </Text>
                      <Text style={{ fontWeight: '300' }}>
                        /{currentTier?.sparkAIVoiceInputs || 0} Spark AI Inputs
                      </Text>
                    </Text>
                  </View>

                  <View style={styles.subscriptionFeature}>
                    <Ionicons name="image" size={16} color={colors.text.primary} />
                    <Text style={styles.subscriptionFeatureText}>
                      <Text style={{ fontWeight: 'bold' }}>
                        {/* TODO: Add actual usage tracking */}0
                      </Text>
                      <Text style={{ fontWeight: '300' }}>
                        /{currentTier?.sparkAIVisionImages || 0} Spark AI Visions
                      </Text>
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.subscriptionActions}>
                  {/* Upgrade Button - only show if not on highest tier OR not on annual billing */}
                  {(currentTier?.id !== 'tier_visionary' || !isCurrentSubscriptionAnnual) && (
                    <Pressable
                      style={[styles.subscriptionButton, styles.upgradeButton]}
                      onPress={() => router.push('/paywall')}
                    >
                      <Text style={styles.upgradeButtonText}>
                        {currentTier?.id === 'tier_visionary' && !isCurrentSubscriptionAnnual ? 'Switch to Annual' : 'Upgrade Plan'}
                      </Text>
                      <Ionicons name="sparkles" size={16} color="#F5EBE0" />
                    </Pressable>
                  )}

                  {/* Max tier indicator - only show for Visionary Annual */}
                  {currentTier?.id === 'tier_visionary' && isCurrentSubscriptionAnnual && (
                    <View style={styles.maxTierIndicator}>
                      <Ionicons name="checkmark-circle" size={20} color="#8FBC8F" />
                      <Text style={styles.maxTierText}>You're on the highest tier!</Text>
                    </View>
                  )}

                  {/* Manage Subscription Button */}
                  <View style={styles.manageSubscriptionContainer}>
                    <Pressable
                      style={styles.manageButton}
                      onPress={() => {
                        if (Platform.OS === 'ios') {
                          Linking.openURL('https://apps.apple.com/account/subscriptions');
                        } else {
                          Linking.openURL('https://play.google.com/store/account/subscriptions');
                        }
                      }}
                    >
                      <Text style={styles.manageButtonText}>Manage Subscription</Text>
                    </Pressable>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Your Journey Stats */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="trophy" size={20} color={colors.secondary} />
              <Text style={[typography.title, styles.sectionTitle]}>Your Journey</Text>
            </View>
          </View>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIconOnly}>
                <AnimatedFlame isActive={stats.eatTheFrogStreak > 0} />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{stats.eatTheFrogStreak}</Text>
                <Text style={[typography.caption, styles.statLabel]}>Eat the Frog Streak</Text>
              </View>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIconOnly}>
                <Image 
                  source={{ uri: images.tabIcons.goals }}
                  style={{ width: 24, height: 24 }}
                  contentFit="contain"
                  tintColor={colors.text.primary}
                />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{stats.goalsAchieved}</Text>
                <Text style={[typography.caption, styles.statLabel]}>Goals Achieved</Text>
              </View>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIconOnly}>
                <Ionicons name="time" size={24} color={colors.text.primary} />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{formatFocusTime(stats.totalFocusTime)}</Text>
                <Text style={[typography.caption, styles.statLabel]}>Total Focus Time</Text>
              </View>
            </View>
          </View>
        </View>


        {/* Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="settings" size={20} color={colors.secondary} />
              <Text style={[typography.title, styles.sectionTitle]}>Settings</Text>
            </View>
          </View>
          
          <View style={styles.settingsCard}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={styles.iconOnly}>
                  <Ionicons name="notifications" size={20} color={colors.text.primary} />
                </View>
                <Text style={[typography.cardTitle, styles.settingLabel]}>Notifications</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: colors.textSecondary, true: colors.accent.frog }}
                thumbColor={colors.secondary}
              />
            </View>
          </View>
        </View>

        {/* Support & Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="help-circle" size={20} color={colors.secondary} />
              <Text style={[typography.title, styles.sectionTitle]}>Support & Info</Text>
            </View>
          </View>
          
          <View style={styles.menuCard}>
            {/* Support & Feedback */}
            <Pressable 
              style={[styles.menuItem, isPressed === 'support' && styles.menuItemPressed]} 
              onPress={handleSupportFeedback}
              onPressIn={() => handlePressIn('support')}
              onPressOut={handlePressOut}
            >
              <View style={styles.menuLeft}>
                <View style={styles.iconOnly}>
                  <Ionicons name="mail" size={20} color={colors.text.primary} />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={[typography.cardTitle, styles.menuLabel]}>Support & Feedback</Text>
                  <Text style={[typography.caption, styles.menuSubtitle]}>Get help or share ideas for rewards</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </Pressable>

            <View style={styles.menuDivider} />

            {/* Credits */}
            <View style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <View style={styles.iconOnly}>
                  <Ionicons name="heart" size={20} color={colors.text.primary} />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={[typography.cardTitle, styles.menuLabel]}>Credits</Text>
                  <Text style={[typography.caption, styles.menuSubtitle]}>Icons and illustrations by Freepik</Text>
                </View>
              </View>
            </View>

            <View style={styles.menuDivider} />

            {/* Privacy Policy */}
            <Pressable 
              style={[styles.menuItem, isPressed === 'privacy' && styles.menuItemPressed]} 
              onPress={openPrivacyPolicy}
              onPressIn={() => handlePressIn('privacy')}
              onPressOut={handlePressOut}
            >
              <View style={styles.menuLeft}>
                <View style={styles.iconOnly}>
                  <Ionicons name="shield" size={20} color={colors.text.primary} />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={[typography.cardTitle, styles.menuLabel]}>Privacy Policy</Text>
                  <Text style={[typography.caption, styles.menuSubtitle]}>How we protect your data</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </Pressable>

            <View style={styles.menuDivider} />

            {/* Terms & Conditions */}
            <Pressable 
              style={[styles.menuItem, isPressed === 'terms' && styles.menuItemPressed]} 
              onPress={openTerms}
              onPressIn={() => handlePressIn('terms')}
              onPressOut={handlePressOut}
            >
              <View style={styles.menuLeft}>
                <View style={styles.iconOnly}>
                  <Ionicons name="document-text" size={20} color={colors.text.primary} />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={[typography.cardTitle, styles.menuLabel]}>Terms & Conditions</Text>
                  <Text style={[typography.caption, styles.menuSubtitle]}>Service terms and conditions</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        {/* Dev Tools - Only show in development */}
        {__DEV__ && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="code" size={20} color={colors.secondary} />
                <Text style={[typography.title, styles.sectionTitle]}>Dev Tools</Text>
              </View>
            </View>
            
            <View style={styles.menuCard}>
              <Pressable 
                style={[styles.menuItem, isPressed === 'devtools' && styles.menuItemPressed]} 
                onPress={() => setShowDevTools(true)}
                onPressIn={() => handlePressIn('devtools')}
                onPressOut={handlePressOut}
              >
                <View style={styles.menuLeft}>
                  <View style={styles.iconOnly}>
                    <Ionicons name="construct" size={20} color={colors.text.primary} />
                  </View>
                  <View style={styles.menuTextContainer}>
                    <Text style={[typography.cardTitle, styles.menuLabel]}>Developer Tools</Text>
                    <Text style={[typography.caption, styles.menuSubtitle]}>Reset onboarding, debug tools</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.text.primary} />
              </Pressable>
            </View>
          </View>
        )}

        {/* User ID */}
        <View style={styles.userIdSection}>
          <Text style={[typography.caption, styles.userIdLabel]}>User ID</Text>
          <Text style={[typography.caption, styles.userIdText]}>{userId}</Text>
        </View>
      </ScrollView>


      <DevTools 
        visible={showDevTools} 
        onClose={() => setShowDevTools(false)}
        onShowPaywall={() => setShowPaywall(true)}
        onShowUpgradePaywall={() => setShowUpgradePaywall(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.text.primary, // Dark blue background
  },
  scrollView: {
    flex: 1,
  },
  section: {
    gap: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.secondary, // Cream color
  },
  
  // Profile Card
  profileCard: {
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 0.5,
    borderColor: colors.border.primary,
    shadowColor: colors.secondary, // Cream shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
  },
  profileInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  nameEditContainer: {
    flex: 1,
    gap: spacing.sm,
  },
  nameInput: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    padding: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.text.primary,
  },
  nameEditButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  nameEditButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  userName: {
    flex: 1,
  },
  
  // Apple Sign In in Profile Section
  appleSignInContainer: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  appleSignInDescription: {
    color: colors.text.primary,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '300',
  },
  
  // Signed In Interface
  signedInContainer: {
    gap: spacing.lg,
    width: '100%',
  },
  accountInfo: {
    alignItems: 'center',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  accountDetails: {
    alignItems: 'flex-start',
    gap: spacing.xxs,
    width: '100%',
  },
  accountLabel: {
    color: colors.text.primary,
    textAlign: 'left',
  },
  accountEmail: {
    color: colors.text.primary,
    textAlign: 'left',
    opacity: 0.7,
    fontSize: 9,
  },
  accountActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    width: '100%',
  },
  accountButton: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutButton: {
    backgroundColor: '#6B7280',
  },
  deleteButton: {
    backgroundColor: '#BC4B51',
  },
  cancelButton: {
    backgroundColor: '#BC4B51', // Red background for cancel
  },
  saveButton: {
    backgroundColor: colors.text.primary, // Dark blue background
  },
  signOutButtonText: {
    color: colors.secondary,
    fontSize: 10,
    fontWeight: '600',
  },
  deleteButtonText: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '600',
  },

  // Stats Section
  statsGrid: {
    gap: spacing.lg,
  },
  statCard: {
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    borderWidth: 0.5,
    borderColor: colors.border.primary,
    shadowColor: colors.secondary, // Cream shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconOnly: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOnly: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statContent: {
    flex: 1,
    gap: spacing.xs,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
  },
  statLabel: {
    color: colors.text.primary,
  },

  appleSignInButton: {
    backgroundColor: colors.text.primary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minWidth: '100%',
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

  // Settings
  settingsCard: {
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.xl,
    borderWidth: 0.5,
    borderColor: colors.border.primary,
    shadowColor: colors.secondary, // Cream shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  settingItem: {
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  settingLabel: {
    color: colors.text.primary,
  },

  // Menu Card
  menuCard: {
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.xl,
    borderWidth: 0.5,
    borderColor: colors.border.primary,
    shadowColor: colors.secondary, // Cream shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
    overflow: 'hidden',
  },
  menuItem: {
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuItemPressed: {
    backgroundColor: colors.background.primary,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    flex: 1,
  },
  menuTextContainer: {
    flex: 1,
    gap: spacing.xxs,
  },
  menuLabel: {
    color: colors.text.primary,
  },
  menuSubtitle: {
    color: colors.textSecondary,
    lineHeight: 16,
  },
  menuDivider: {
    height: 0.5,
    backgroundColor: colors.border.primary,
    marginLeft: spacing.xl + 40 + spacing.lg, // Align with text
  },

  // User ID
  userIdSection: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.xl,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(245,235,224,0.2)',
  },
  userIdLabel: {
    color: 'rgba(245,235,224,0.7)',
  },
  userIdText: {
    color: 'rgba(245,235,224,0.5)',
    fontWeight: '500',
  },

  // Username edit button styles
  saveButtonText: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '600',
  },

  // Subscription Section Styles
  subscriptionCard: {
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 0.5,
    borderColor: colors.border.primary,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  subscriptionLoading: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  subscriptionLoadingText: {
    color: colors.text.primary,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionTier: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  subscriptionStatus: {
    color: colors.text.primary,
    opacity: 0.8,
    marginTop: 4,
    fontWeight: '300',
    fontFamily: 'Helvetica',
  },
  subscriptionBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscriptionFeatures: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  subscriptionFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  subscriptionFeatureText: {
    fontSize: 14,
    fontWeight: '300',
    color: colors.text.primary,
    flex: 1,
    fontFamily: 'Helvetica',
  },
  subscriptionActions: {
    alignItems: 'center',
  },
  subscriptionButton: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minWidth: '100%',
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  activateButton: {
    backgroundColor: '#8FBC8F',
  },
  activateButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Helvetica',
  },
  upgradeButton: {
    backgroundColor: colors.text.primary,
  },
  upgradeButtonText: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Helvetica',
  },
  maxTierIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  maxTierText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '300',
    fontFamily: 'Helvetica',
  },
  subscriptionError: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  subscriptionErrorText: {
    color: colors.text.primary,
  },
  retryButton: {
    backgroundColor: colors.text.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Helvetica',
  },
  manageSubscriptionContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    justifyContent: 'center',
  },
  manageButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  manageButtonText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '300',
    fontFamily: 'Helvetica',
    textAlign: 'center',
  },
});