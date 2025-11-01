import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import { images } from '../constants/images';
import { useLanguage } from '../contexts/LanguageContext';

export type ImageGenerationState = 'idle' | 'generating' | 'completed' | 'error' | 'preview';

interface ImageGenerationAnimationProps {
  state: ImageGenerationState;
  progress?: number;
}

export function ImageGenerationAnimation({ state, progress = 0 }: ImageGenerationAnimationProps) {
  const { t, i18n } = useTranslation();
  const { currentLanguage } = useLanguage();
  
  // Debug: Log translation values to see what's actually being returned
  useEffect(() => {
    console.log('🌐 [ImageGenerationAnimation] i18n language:', i18n.language);
    console.log('🌐 [ImageGenerationAnimation] Context language:', currentLanguage);
    console.log('🌐 [ImageGenerationAnimation] Translation test:', t('imageGenerationAnimation.states.generating'));
    console.log('🌐 [ImageGenerationAnimation] i18n ready:', i18n.isInitialized);
    console.log('🌐 [ImageGenerationAnimation] State:', state);
  }, [i18n.language, currentLanguage, t, state]);
  
  // Force re-render when language changes from either source
  const [, forceUpdate] = useState({});
  useEffect(() => {
    forceUpdate({});
  }, [i18n.language, currentLanguage]);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (state === 'generating') {
      // Fade in overlay
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Continuous rotation for Spark logo
      const spinAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      );
      spinAnimation.start();

      // Sparkle animation
      const sparkleAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(sparkleAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(sparkleAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      sparkleAnimation.start();

      return () => {
        spinAnimation.stop();
        sparkleAnimation.stop();
      };
    } else if (state === 'completed') {
      // Success pulse animation
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(1000),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (state === 'error') {
      // Error shake animation
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animations
      pulseAnim.setValue(1);
      rotateAnim.setValue(0);
      fadeAnim.setValue(0);
      progressAnim.setValue(0);
      sparkleAnim.setValue(0);
    }
  }, [state, pulseAnim, rotateAnim, fadeAnim, progressAnim, sparkleAnim]);

  // Update progress animation
  useEffect(() => {
    if (state === 'generating') {
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 500,
        useNativeDriver: false,
      }).start();
    }
  }, [progress, progressAnim, state]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const sparkleOpacity = sparkleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1, 0.3],
  });

  const sparkleScale = sparkleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 1.2, 0.8],
  });

  const getStatusText = (): string => {
    // Get the translation with language-specific fallbacks
    const getTranslationWithFallback = (key: string, fallback: string) => {
      const translation = t(key, fallback);
      console.log(`🌐 [ImageGenerationAnimation] Translation for ${key}:`, translation);
      
      // If translation failed and we're not in English, provide language-specific fallbacks
      if (translation === key || translation === fallback) {
        if (currentLanguage === 'de') {
          switch (key) {
            case 'imageGenerationAnimation.states.generating':
              return 'Spark erstellt deine Vision...';
            case 'imageGenerationAnimation.states.completed':
              return 'Vision erfolgreich erstellt!';
            case 'imageGenerationAnimation.states.error':
              return 'Etwas ist schiefgelaufen';
            default:
              return fallback;
          }
        } else if (currentLanguage === 'fr') {
          switch (key) {
            case 'imageGenerationAnimation.states.generating':
              return 'Spark crée votre vision...';
            case 'imageGenerationAnimation.states.completed':
              return 'Vision créée avec succès !';
            case 'imageGenerationAnimation.states.error':
              return 'Quelque chose a mal tourné';
            default:
              return fallback;
          }
        }
      }
      
      return translation;
    };

    switch (state) {
      case 'generating':
        return getTranslationWithFallback('imageGenerationAnimation.states.generating', 'Spark is creating your vision...');
      case 'completed':
        return getTranslationWithFallback('imageGenerationAnimation.states.completed', 'Vision created successfully!');
      case 'error':
        return getTranslationWithFallback('imageGenerationAnimation.states.error', 'Something went wrong');
      default:
        return '';
    }
  };

  const getStatusColor = (): string => {
    switch (state) {
      case 'generating':
        return '#A3B18A'; // App green
      case 'completed':
        return '#10b981'; // Success green
      case 'error':
        return '#ef4444'; // Error red
      default:
        return '#6b7280';
    }
  };

  if (state === 'idle') {
    return null;
  }

  // Don't render if translations aren't ready
  if (!i18n.isInitialized) {
    console.log('🌐 [ImageGenerationAnimation] Translations not ready, showing fallback');
    return (
      <Animated.View 
        style={{ 
          opacity: fadeAnim,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(74, 78, 105, 0.95)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 3000,
        }}
      >
        <View style={{
          backgroundColor: '#F5EBE0',
          borderWidth: 1,
          borderColor: '#A3B18A',
          borderRadius: 20,
          padding: 32,
          marginHorizontal: 36,
          alignItems: 'center',
          shadowColor: '#F5EBE0',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.75,
          shadowRadius: 0,
          elevation: 8,
        }}>
          <Text style={{
            color: '#364958',
            fontSize: 20,
            fontFamily: 'Helvetica-Bold',
            marginBottom: 8,
            textAlign: 'center',
          }}>
            Spark is creating your vision...
          </Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View 
      style={{ 
        opacity: fadeAnim,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(74, 78, 105, 0.95)', // Match app gradient
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 3000,
      }}
    >
      <View style={{
        backgroundColor: '#F5EBE0',
        borderWidth: 1,
        borderColor: '#A3B18A',
        borderRadius: 20,
        padding: 32,
        marginHorizontal: 36,
        alignItems: 'center',
        shadowColor: '#F5EBE0',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.75,
        shadowRadius: 0,
        elevation: 8,
      }}>
        {/* Spark Logo with Animation */}
        <View style={{ position: 'relative', marginBottom: 24 }}>
          <Animated.View
            style={{
              width: 80,
              height: 80,
              transform: [
                { scale: pulseAnim },
                { rotate: state === 'generating' ? spin : '0deg' },
              ],
            }}
          >
            <Image 
              source={images.icons.sparkle} 
              style={{ 
                width: '100%', 
                height: '100%',
                tintColor: getStatusColor(),
              }}
              contentFit="contain"
            />
          </Animated.View>

          {/* Sparkle effects around logo */}
          {state === 'generating' && (
            <>
              <Animated.View
                style={{
                  position: 'absolute',
                  top: -5,
                  right: -5,
                  width: 20,
                  height: 20,
                  opacity: sparkleOpacity,
                  transform: [{ scale: sparkleScale }],
                }}
              >
                <Image
                  source={images.icons.sparkle}
                  style={{ 
                    width: '100%', 
                    height: '100%',
                    tintColor: '#A3B18A',
                  }}
                  contentFit="contain"
                />
              </Animated.View>
              <Animated.View
                style={{
                  position: 'absolute',
                  bottom: 5,
                  left: -8,
                  width: 16,
                  height: 16,
                  opacity: sparkleOpacity,
                  transform: [{ scale: sparkleScale }],
                }}
              >
                <Image
                  source={images.icons.sparkle}
                  style={{ 
                    width: '100%', 
                    height: '100%',
                    tintColor: '#F5EBE0',
                  }}
                  contentFit="contain"
                />
              </Animated.View>
              <Animated.View
                style={{
                  position: 'absolute',
                  top: 20,
                  left: -10,
                  width: 14,
                  height: 14,
                  opacity: sparkleOpacity,
                  transform: [{ scale: sparkleScale }],
                }}
              >
                <Image
                  source={images.icons.sparkle}
                  style={{ 
                    width: '100%', 
                    height: '100%',
                    tintColor: '#A3B18A',
                  }}
                  contentFit="contain"
                />
              </Animated.View>
            </>
          )}
        </View>

        {/* Status Text */}
        <Text style={{
          color: '#364958',
          fontSize: 20,
          fontFamily: 'Helvetica-Bold',
          marginBottom: 8,
          textAlign: 'center',
        }}>
          {getStatusText()}
        </Text>

        {/* Progress indicator for generating */}
        {state === 'generating' && (
          <View style={{ width: '100%', alignItems: 'center' }}>
            <View style={{
              width: '100%',
              height: 4,
              backgroundColor: 'rgba(54, 73, 88, 0.2)',
              borderRadius: 2,
              marginBottom: 12,
              overflow: 'hidden',
            }}>
              <Animated.View
                style={{
                  height: '100%',
                  backgroundColor: '#A3B18A',
                  borderRadius: 2,
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                }}
              />
            </View>
            <Text style={{
              color: '#364958',
              fontSize: 15,
              fontFamily: 'Helvetica-Light',
              textAlign: 'center',
              opacity: 0.8,
            }}>
              {(() => {
                const key = 'imageGenerationAnimation.messages.pleaseWait';
                const fallback = 'This may take a moment...';
                const translation = t(key, fallback);
                
                if ((translation === key || translation === fallback) && currentLanguage === 'de') {
                  return 'Das kann einen Moment dauern...';
                } else if ((translation === key || translation === fallback) && currentLanguage === 'fr') {
                  return 'Cela peut prendre un moment...';
                }
                
                return translation;
              })()}
            </Text>
          </View>
        )}

        {/* Success message */}
        {state === 'completed' && (
          <View style={{ alignItems: 'center' }}>
            <Text style={{
              color: '#364958',
              fontSize: 24,
              marginBottom: 8,
            }}>
              ✨
            </Text>
            <Text style={{
              color: '#364958',
              fontSize: 15,
              fontFamily: 'Helvetica-Light',
              textAlign: 'center',
            }}>
              {(() => {
                const key = 'imageGenerationAnimation.messages.visionComplete';
                const fallback = 'Your vision has been brought to life!';
                const translation = t(key, fallback);
                
                if ((translation === key || translation === fallback) && currentLanguage === 'de') {
                  return 'Deine Vision wurde zum Leben erweckt!';
                } else if ((translation === key || translation === fallback) && currentLanguage === 'fr') {
                  return 'Votre vision a pris vie !';
                }
                
                return translation;
              })()}
            </Text>
          </View>
        )}

        {/* Error message */}
        {state === 'error' && (
          <View style={{ alignItems: 'center' }}>
            <Text style={{
              color: '#ef4444',
              fontSize: 24,
              marginBottom: 8,
            }}>
              ⚠️
            </Text>
            <Text style={{
              color: '#364958',
              fontSize: 15,
              fontFamily: 'Helvetica-Light',
              textAlign: 'center',
            }}>
              {(() => {
                const key = 'imageGenerationAnimation.messages.errorMessage';
                const fallback = 'Unable to create your vision. Please try again.';
                const translation = t(key, fallback);
                
                if ((translation === key || translation === fallback) && currentLanguage === 'de') {
                  return 'Deine Vision konnte nicht erstellt werden. Bitte versuche es erneut.';
                } else if ((translation === key || translation === fallback) && currentLanguage === 'fr') {
                  return 'Impossible de créer votre vision. Veuillez réessayer.';
                }
                
                return translation;
              })()}
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}
