import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { Image } from 'expo-image';
import { images } from '../constants/images';

export type ImageGenerationState = 'idle' | 'generating' | 'completed' | 'error' | 'preview';

interface ImageGenerationAnimationProps {
  state: ImageGenerationState;
  progress?: number;
}

export function ImageGenerationAnimation({ state, progress = 0 }: ImageGenerationAnimationProps) {
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
    switch (state) {
      case 'generating':
        return 'Spark is creating your vision...';
      case 'completed':
        return 'Vision created successfully!';
      case 'error':
        return 'Something went wrong';
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
              source={{ 
                uri: 'https://s3-alpha-sig.figma.com/img/f3ca/910e/67ed334fefa5709829303118cfda1a07?Expires=1760313600&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=brlfYbH8KyZQB0EbF5VpV5uvxZg0X5rbH--IHFifnrI6ah-13IWHYm4-OJjt2YtCeH1xY4MFLt~smHvxgIRVi8m5BzfWY5xZQx-xVCoY9aL-gG3wOKr37ggVxgb1rc90gz-R3QpO5ZQIxt8hjovDg4KA6S8EZTjAS57Oc8sZW2gL7IDO1JB6nrTDbFCvtofpjUjLdKHkrbZqfg4GFJMlt8jIDTVA5YPY-opiNWDRcZ39LAKmgPvnqcC03JItsZ3IlaVLRvqIRPjB3-2y7nyWGxSqNQlH0AEivG7b~0OLID3dwnhEwe1HikBvooZA7WjD4ywtpKsy-QaanDMg-1wVcQ__'
              }} 
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
              This may take a moment...
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
              Your vision has been brought to life!
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
              Unable to create your vision. Please try again.
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}
