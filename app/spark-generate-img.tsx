import { View, Text, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { imageGenerationService, StyleOption } from '../src/services/imageGenerationService';
import { useOnboarding } from '../src/hooks/useOnboarding';
import { useSubscription } from '../src/hooks/useSubscription';
import { ImageGenerationAnimation, ImageGenerationState } from '../src/components/ImageGenerationAnimation';
import { BackChevronButton } from '../src/components/ChevronButton';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { useVisionImages } from '../src/hooks/useDatabase';
import { images } from '../src/constants/images';


interface StyleButtonProps {
  style: StyleOption;
  selected: boolean;
  onPress: () => void;
  imageUri: any;
  label: string;
}

function StyleButton({ style, selected, onPress, imageUri, label }: StyleButtonProps) {
  return (
    <View style={{ width: 150, alignItems: 'center', gap: 8 }}>
      <View style={{
        shadowColor: '#F5EBE0',
        shadowOffset: {
          width: 0,
          height: selected ? 2 : 4,
        },
        shadowOpacity: 0.75,
        shadowRadius: 0,
        elevation: 8, // For Android
        borderRadius: 15,
      }}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPress();
          }}
          style={{
            width: 100,
            height: 100,
            borderRadius: 15,
            borderWidth: 0.5,
            borderColor: '#A3B18A',
            overflow: 'hidden',
            minHeight: 44,
          }}
        >
          <Image
            source={imageUri}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
          {selected && (
            <View style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(54, 73, 88, 0.4)',
              borderRadius: 15,
            }} />
          )}
        </Pressable>
      </View>
      <Text style={{
        color: '#F5EBE0',
        fontSize: 15,
        textAlign: 'center',
        fontFamily: 'Helvetica',
        width: '100%',
      }}>
        {label}
      </Text>
    </View>
  );
}

export default function SparkGenerateIMGScreen() {
  const insets = useSafeAreaInsets();
  const { addVisionImage } = useVisionImages();
  const { userPreferences } = useOnboarding();
  const { canUseSparkAIVision } = useSubscription();
  const [visionText, setVisionText] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<StyleOption>('photorealistic');
  const [generationState, setGenerationState] = useState<ImageGenerationState>('idle');
  const [generatedImageUri, setGeneratedImageUri] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBackPressed, setIsBackPressed] = useState(false);
  const [isCreatePressed, setIsCreatePressed] = useState(false);
  const [isSavePressed, setIsSavePressed] = useState(false);
  const [isDeletePressed, setIsDeletePressed] = useState(false);
  const [isTryAgainPressed, setIsTryAgainPressed] = useState(false);

  const styleOptions = [
    {
      id: 'photorealistic' as StyleOption,
      label: 'Photorealistic',
      imageUri: require('../assets/styles/style_photorealistic.png')
    },
    {
      id: 'anime' as StyleOption,
      label: 'Anime',
      imageUri: require('../assets/styles/style_anime.png')
    },
    {
      id: 'watercolour' as StyleOption,
      label: 'Watercolour',
      imageUri: require('../assets/styles/style_watercolour.png')
    },
    {
      id: 'cyberpunk' as StyleOption,
      label: 'Cyberpunk',
      imageUri: require('../assets/styles/style_cyberpunk.png')
    }
  ];

  const handleGoBack = () => {
    router.back();
  };

  const handleCreateVision = async () => {
    if (!visionText.trim()) {
      Alert.alert('Missing Vision', 'Please describe your vision before creating an image.');
      return;
    }

    if (isGenerating) {
      return; // Prevent multiple simultaneous generations
    }

    // Check subscription access for Vision image generation
    // Get current usage count (you may need to implement this based on your database)
    const currentUsage = 0; // TODO: Get actual usage count from database
    if (!canUseSparkAIVision(currentUsage)) {
      // Trigger paywall for feature upgrade
      router.push('/paywall?type=feature_upgrade');
      return;
    }

    try {
      setIsGenerating(true);
      setGenerationState('generating');
      
      // Haptic feedback for start
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const result = await imageGenerationService.generateImage({
        userText: visionText,
        style: selectedStyle,
        genderPreference: userPreferences?.genderPreference || userPreferences?.personalization || undefined
      });

      if (result.success && result.imageBase64) {
        // Save image to device using FileSystem API
        const filename = `spark-vision-${Date.now()}.png`;
        const fileUri = FileSystem.cacheDirectory + filename;
        
        await FileSystem.writeAsStringAsync(fileUri, result.imageBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        setGeneratedImageUri(fileUri);
        setGenerationState('preview');
        
        // Success haptic
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
      } else {
        setGenerationState('error');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        
        Alert.alert(
          'Generation Failed', 
          result.error || 'Unable to generate your vision. Please try again.',
          [
            {
              text: 'OK',
              onPress: () => setGenerationState('idle')
            }
          ]
        );
      }
    } catch (error) {
      console.error('Image generation error:', error);
      setGenerationState('error');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      Alert.alert(
        'Generation Error',
        'An unexpected error occurred. Please check your internet connection and try again.',
        [
          {
            text: 'OK',
            onPress: () => setGenerationState('idle')
          }
        ]
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <LinearGradient
      colors={['#4a4e69', '#9a8c98', '#4a4e69']}
      locations={[0, 0.5, 1]}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingLeft: 36,
          paddingRight: 36,
          paddingBottom: 50,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Container matching Figma layout */}
        <View style={{ width: 321, gap: 43 }}>
          {/* Vision Board Sections Container */}
          <View style={{ gap: 43 }}>
            {/* Header Section */}
            <View style={{ gap: 11 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
                <BackChevronButton
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    handleGoBack();
                  }}
                  color="#F5EBE0"
                  style={{
                    width: 30,
                    height: 30,
                    opacity: isBackPressed ? 0.6 : 1,
                  }}
                />
                <Text style={{
                  flex: 1,
                  color: '#F5EBE0',
                  fontSize: 20,
                  fontFamily: 'Helvetica-Bold',
                  lineHeight: 0,
                }}>
                  Bring Your Vision to Life
                </Text>
              </View>
              <Text style={{
                color: '#F5EBE0',
                fontSize: 15,
                fontFamily: 'Helvetica-Light',
                lineHeight: 0,
                width: '100%',
              }}>
                Describe the scene that represents your dream. The more detail, the better.
              </Text>
              <Text style={{
                color: '#F5EBE0',
                fontSize: 15,
                fontFamily: 'Helvetica-Light',
                lineHeight: 0,
                width: '100%',
              }}>
                e.g. "Running across the finish line of a marathon, smiling and feeling strong."
              </Text>
            </View>

            {/* Vision Input Field */}
            <View style={{
              backgroundColor: '#F5EBE0',
              borderWidth: 0.5,
              borderColor: '#A3B18A',
              borderRadius: 15,
              padding: 10,
              width: '100%',
              shadowColor: '#F5EBE0',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.75,
              shadowRadius: 0,
              elevation: 4,
            }}>
              <TextInput
                value={visionText}
                onChangeText={setVisionText}
                placeholder="Type your vision here..."
                placeholderTextColor="rgba(54,73,88,0.5)"
                multiline
                numberOfLines={4}
                style={{
                  fontSize: 15,
                  fontFamily: 'Helvetica-Light',
                  color: '#364958',
                  minHeight: 80,
                }}
                textAlignVertical="top"
              />
            </View>

            {/* Choose Style Section */}
            <View style={{ gap: 20 }}>
              <View style={{ gap: 8 }}>
                <Text style={{
                  color: '#F5EBE0',
                  fontSize: 20,
                  fontFamily: 'Helvetica-Bold',
                  lineHeight: 0,
                  width: '100%',
                }}>
                  Choose your style
                </Text>
                <Text style={{
                  color: '#F5EBE0',
                  fontSize: 15,
                  fontFamily: 'Helvetica-Light',
                  lineHeight: 0,
                  width: '100%',
                }}>
                  Spark will bring your text to life in this style.
                </Text>
              </View>

              {/* Style Options Grid */}
              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 15,
                rowGap: 20,
                width: '100%',
              }}>
                {styleOptions.map((option) => (
                  <StyleButton
                    key={option.id}
                    style={option.id}
                    selected={selectedStyle === option.id}
                    onPress={() => setSelectedStyle(option.id)}
                    imageUri={option.imageUri}
                    label={option.label}
                  />
                ))}
              </View>
            </View>
          </View>

          {/* Create Vision Button */}
          <View style={[
            {
              shadowColor: '#F5EBE0',
              shadowOffset: {
                width: 0,
                height: 4,
              },
              shadowOpacity: 0.75,
              shadowRadius: 0,
              elevation: 8, // For Android
              borderRadius: 10,
            },
            isCreatePressed && {
              shadowOffset: { width: 0, height: 2 },
            }
          ]}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handleCreateVision();
              }}
              onPressIn={() => setIsCreatePressed(true)}
              onPressOut={() => setIsCreatePressed(false)}
              style={{
                backgroundColor: isGenerating ? 'rgba(61, 64, 91, 0.6)' : '#3D405B',
                borderWidth: 1,
                borderColor: '#9B9B9B',
                borderRadius: 10,
                paddingHorizontal: 10,
                paddingVertical: 10,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                height: 40,
                width: '100%',
                opacity: isGenerating ? 0.6 : 1,
              }}
              disabled={isGenerating}
            >
            <Image
              source={require('../assets/sparkle.png')}
              style={{ 
                width: 20, 
                height: 20,
                tintColor: '#F5EBE0',
              }}
              contentFit="contain"
            />
            <Text style={{
              color: '#F5EBE0',
              fontSize: 15,
              fontFamily: 'Helvetica-Bold',
              lineHeight: 0,
            }}>
              {isGenerating ? 'Creating...' : 'Create Vision'}
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
    
    {/* Image Generation Animation Overlay */}
    {generationState !== 'preview' && (
      <ImageGenerationAnimation 
        state={generationState}
        progress={0.5} // You can implement actual progress tracking if needed
      />
    )}
    
    {/* Image Preview Overlay */}
    {generationState === 'preview' && generatedImageUri && (
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: insets.top + 20,
        paddingBottom: insets.bottom + 20,
      }}>
        {/* Generated Image */}
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          maxHeight: '70%',
        }}>
          <Image
            source={{ uri: generatedImageUri }}
            style={{
              width: '100%',
              aspectRatio: 1,
              borderRadius: 15,
              backgroundColor: '#2A2D3A',
            }}
            contentFit="contain"
          />
        </View>
        
        {/* Action Buttons */}
        <View style={{
          width: '100%',
          gap: 15,
          marginTop: 30,
        }}>
          {/* Save Button */}
          <View style={[
            {
              shadowColor: '#F5EBE0',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.75,
              shadowRadius: 0,
              elevation: 8,
              borderRadius: 10,
            },
            isSavePressed && {
              shadowOffset: { width: 0, height: 2 },
            }
          ]}>
            <Pressable
              onPress={async () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                
                if (generatedImageUri) {
                  try {
                    // Calculate aspect ratio (assume square for generated images)
                    const aspectRatio = 1.0;
                    
                    // Save to vision board database
                    await addVisionImage(generatedImageUri, aspectRatio, 'generated');
                    
                    // Show success and redirect to vision board
                    Alert.alert('Saved!', 'Your vision has been saved to your Vision Board.', [
                      {
                        text: 'View Vision Board',
                        onPress: () => {
                          router.push('/vision-board');
                        }
                      }
                    ]);
                  } catch (error) {
                    Alert.alert('Error', 'Failed to save image to Vision Board.');
                  }
                }
              }}
              onPressIn={() => setIsSavePressed(true)}
              onPressOut={() => setIsSavePressed(false)}
              style={{
                backgroundColor: '#A3B18A',
                borderRadius: 10,
                paddingVertical: 15,
                alignItems: 'center',
              }}
            >
              <Text style={{
                color: '#2A2D3A',
                fontSize: 16,
                fontFamily: 'Helvetica-Bold',
              }}>
                Save to Vision Board
              </Text>
            </Pressable>
          </View>
          
          {/* Bottom Row: Delete (left) and Try Again (right) */}
          <View style={{
            flexDirection: 'row',
            gap: 15,
          }}>
            {/* Delete Button */}
            <View style={[
              {
                flex: 1,
                shadowColor: '#F5EBE0',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.75,
                shadowRadius: 0,
                elevation: 8,
                borderRadius: 10,
              },
              isDeletePressed && {
                shadowOffset: { width: 0, height: 2 },
              }
            ]}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  Alert.alert(
                    'Delete Image',
                    'Are you sure you want to delete this generated image?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => {
                          setGenerationState('idle');
                          setGeneratedImageUri(null);
                          router.back();
                        }
                      }
                    ]
                  );
                }}
                onPressIn={() => setIsDeletePressed(true)}
                onPressOut={() => setIsDeletePressed(false)}
                style={{
                  backgroundColor: '#ffa69e',
                  borderWidth: 1,
                  borderColor: '#BC4B51',
                  borderRadius: 10,
                  paddingVertical: 15,
                  alignItems: 'center',
                }}
              >
                <Text style={{
                  color: '#BC4B51',
                  fontSize: 16,
                  fontFamily: 'Helvetica-Bold',
                }}>
                  Delete
                </Text>
              </Pressable>
            </View>
            
            {/* Try Again Button */}
            <View style={[
              {
                flex: 1,
                shadowColor: '#F5EBE0',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.75,
                shadowRadius: 0,
                elevation: 8,
                borderRadius: 10,
              },
              isTryAgainPressed && {
                shadowOffset: { width: 0, height: 2 },
              }
            ]}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setGenerationState('idle');
                  setGeneratedImageUri(null);
                }}
                onPressIn={() => setIsTryAgainPressed(true)}
                onPressOut={() => setIsTryAgainPressed(false)}
                style={{
                  backgroundColor: '#3D405B',
                  borderWidth: 1,
                  borderColor: '#9B9B9B',
                  borderRadius: 10,
                  paddingVertical: 10,
                  paddingHorizontal: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 10,
                }}
              >
                <Image
                  source={require('../assets/sparkle.png')}
                  style={{ 
                    width: 20, 
                    height: 20,
                    tintColor: '#F5EBE0',
                  }}
                  contentFit="contain"
                />
                <Text style={{
                  color: '#F5EBE0',
                  fontSize: 15,
                  fontFamily: 'Helvetica-Bold',
                }}>
                  Recreate Image
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    )}
  </LinearGradient>
  );
}
