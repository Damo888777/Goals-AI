import { View, Text, ScrollView, Pressable, Modal, Alert } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { typography } from '../src/constants/typography';
import { emptyStateSpacing } from '../src/constants/spacing';
import { images } from '../src/constants/images';
import { InfoPopup } from '../src/components/InfoPopup';
import { BackChevronButton } from '../src/components/ChevronButton';
import { useVisionImages } from '../src/hooks/useDatabase';
import * as ImagePicker from 'expo-image-picker';
import VisionImage from '../src/db/models/VisionImage';

interface VisionImageProps {
  width: number;
  height: number;
  imageUri?: string;
}

function VisionImageCard({ width, height, imageUri }: VisionImageProps) {
  const { t } = useTranslation();
  return (
    <View
      style={{
        width,
        height,
        backgroundColor: '#E3E3E3',
        borderRadius: 5,
        overflow: 'hidden',
      }}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
        />
      ) : (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            opacity: 0.2,
          }}
        >
          <Text style={{ fontSize: 12, color: '#999' }}>{t('visionBoard.placeholder.vision')}</Text>
        </View>
      )}
    </View>
  );
}

interface VisionItem {
  id: string;
  aspectRatio: number;
  height?: number;
  imageUri?: string;
  createdAt?: Date;
  source?: string;
  visionImage?: VisionImage;
}

interface Column {
  items: VisionItem[];
  height: number;
}

interface MasonryGridProps {
  visionImages: VisionItem[];
  onImagePress: (visionItem: VisionItem) => void;
}

function MasonryGrid({ visionImages, onImagePress }: MasonryGridProps) {
  const { t } = useTranslation();
  const gap = 12;
  const numColumns = 2;
  
  // Show empty state card if no images
  if (visionImages.length === 0) {
    return (
      <View style={{
        backgroundColor: '#F5EBE0',
        borderWidth: 0.5,
        borderColor: '#A3B18A',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 91,
        marginTop: 16,
        shadowColor: '#7C7C7C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.75,
        shadowRadius: 0,
        elevation: 4,
      }}>
        <Text style={{
          ...typography.emptyTitle,
          marginBottom: emptyStateSpacing.titleMarginBottom,
        }}>
          {t('visionBoard.emptyState.title')}
        </Text>
        <Text style={typography.emptyDescription}>
          {t('visionBoard.emptyState.description')}
        </Text>
      </View>
    );
  }
  
  return <MasonryLayout items={visionImages} gap={gap} numColumns={numColumns} isEmpty={false} onImagePress={onImagePress} />;
}

function MasonryLayout({ items, gap, numColumns, isEmpty, onImagePress }: { 
  items: VisionItem[], 
  gap: number, 
  numColumns: number, 
  isEmpty: boolean,
  onImagePress: (visionItem: VisionItem) => void 
}) {
  const { t } = useTranslation();
  // Distribute items across columns using Pinterest algorithm
  const columns: Column[] = Array.from({ length: numColumns }, () => ({ items: [], height: 0 }));
  
  items.forEach((item) => {
    // Find the shortest column
    const shortestColumn = columns.reduce((prev, current) => 
      prev.height < current.height ? prev : current
    );
    
    // Calculate item height based on aspect ratio with Pinterest-like variation
    const baseWidth = 150;
    let itemHeight = baseWidth / item.aspectRatio;
    
    // Create more dramatic height variations like Pinterest
    const heightVariations = [0.7, 0.85, 1.0, 1.15, 1.3, 1.5, 1.8]; // Different height multipliers
    const randomVariation = heightVariations[Math.floor(Math.random() * heightVariations.length)];
    itemHeight = itemHeight * randomVariation;
    
    // Ensure reasonable bounds
    itemHeight = Math.max(100, Math.min(350, itemHeight));
    
    // Add item to shortest column
    shortestColumn.items.push({ ...item, height: itemHeight });
    shortestColumn.height += itemHeight + gap;
  });

  return (
    <View style={{ 
      flexDirection: 'row', 
      gap,
      alignItems: 'flex-start',
      width: '100%'
    }}>
      {columns.map((column, columnIndex) => (
        <View key={columnIndex} style={{ flex: 1, gap }}>
          {column.items.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => !isEmpty && item.imageUri && onImagePress(item)}
              style={{
                width: '100%',
                height: item.height || 100,
                backgroundColor: isEmpty ? '#E3E3E3' : '#F0F0F0',
                borderRadius: 5,
                overflow: 'hidden',
                opacity: isEmpty ? 0.3 : 1,
              }}
            >
              {item.imageUri && !isEmpty ? (
                <Image
                  source={{ uri: item.imageUri }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              ) : (
                <View
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    opacity: isEmpty ? 0.5 : 0.2,
                  }}
                >
                  <Text style={{ 
                    fontSize: isEmpty ? 10 : 12, 
                    color: isEmpty ? '#AAA' : '#999' 
                  }}>
                    {isEmpty ? '' : t('visionBoard.placeholder.vision')}
                  </Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

export default function VisionBoardScreen() {
  console.log('🟢 VisionBoardScreen component mounting');
  
  const { t } = useTranslation();
  console.log('🟢 Getting safe area insets...');
  const insets = useSafeAreaInsets();
  console.log('🟢 Safe area insets:', insets);
  
  console.log('🟢 Initializing state...');
  const { visionImages: dbVisionImages, addVisionImage, deleteVisionImage } = useVisionImages();
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const [isBackPressed, setIsBackPressed] = useState(false);
  const [isInfoPressed, setIsInfoPressed] = useState(false);
  const [isCreatePressed, setIsCreatePressed] = useState(false);
  const [isUploadPressed, setIsUploadPressed] = useState(false);
  const [selectedImage, setSelectedImage] = useState<VisionItem | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  console.log('🟢 State initialized successfully');

  // Convert database vision images to VisionItem format
  const visionImages: VisionItem[] = dbVisionImages.map((img) => ({
    id: img.id,
    aspectRatio: img.aspectRatio,
    imageUri: img.imageUri,
    createdAt: img.createdAt,
    source: img.source,
    visionImage: img,
  }));

  const handleCreateVision = () => {
    console.log('🟢 Create Vision button clicked in VisionBoardScreen');
    console.log('🟢 Attempting to navigate to /spark-generate-img');
    
    try {
      router.push('/spark-generate-img');
      console.log('🟢 Navigation to spark-generate-img executed');
    } catch (error) {
      console.error('🔴 Error navigating to spark-generate-img:', error);
    }
  };

  const handleUploadVision = async () => {
    console.log('Upload Vision from gallery');
    
    // Request permission to access media library
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      console.log('Permission to access media library denied');
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: undefined, // Allow any aspect ratio
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const aspectRatio = asset.width / asset.height;
      
      // Add to database
      await addVisionImage(asset.uri, aspectRatio, 'uploaded');
    }
  };

  const handleImagePress = (visionItem: VisionItem) => {
    setSelectedImage(visionItem);
    setShowImagePreview(true);
  };

  const handleDeleteImage = async () => {
    if (selectedImage?.visionImage) {
      Alert.alert(
        t('visionBoard.deleteAlert.title'),
        t('visionBoard.deleteAlert.message'),
        [
          { text: t('visionBoard.deleteAlert.cancel'), style: 'cancel' },
          {
            text: t('visionBoard.deleteAlert.delete'),
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteVisionImage(selectedImage.visionImage!.id);
                setShowImagePreview(false);
                setSelectedImage(null);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } catch (error) {
                Alert.alert(t('visionBoard.deleteAlert.error'), t('visionBoard.deleteAlert.errorMessage'));
              }
            }
          }
        ]
      );
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleGoBack = () => {
    console.log('🟢 Back button pressed, attempting to go back');
    try {
      router.back();
      console.log('🟢 router.back() executed');
    } catch (error) {
      console.error('🔴 Error in handleGoBack:', error);
    }
  };

  console.log('🟢 About to render VisionBoardScreen JSX');
  
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
          paddingHorizontal: 24,
          paddingBottom: 120,
          gap: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
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
              lineHeight: 24,
            }}>
              {t('screens.visionBoard.title')}
            </Text>
            
            {/* Info Button */}
            <Pressable 
              onPress={() => setShowInfoPopup(true)}
              onPressIn={() => setIsInfoPressed(true)}
              onPressOut={() => setIsInfoPressed(false)}
              style={[
                {
                  width: 44,
                  height: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                isInfoPressed && { opacity: 0.6 }
              ]}
            >
              <View style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: '#F5EBE0',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{
                  fontSize: 14,
                  color: '#F5EBE0',
                  fontWeight: '600',
                }}>
                  i
                </Text>
              </View>
            </Pressable>
          </View>
          <Text style={{
            color: '#F5EBE0',
            fontSize: 15,
            fontFamily: 'Helvetica-Light',
            lineHeight: 20,
            width: '100%',
          }}>
            {t('screens.visionBoard.subtitle')}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', gap: 16, width: '100%' }}>
          {/* Create Vision Button */}
          <View style={[
            {
              backgroundColor: 'transparent', // Required for shadow efficiency
              shadowColor: '#F5EBE0',
              shadowOffset: {
                width: 0,
                height: 4,
              },
              shadowOpacity: 0.75,
              shadowRadius: 0,
              elevation: 8, // For Android
              borderRadius: 10,
              flex: 1,
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
                backgroundColor: '#3D405B',
                borderWidth: 1,
                borderColor: '#9B9B9B',
                borderRadius: 10,
                paddingHorizontal: 16,
                paddingVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                height: 44,
                flex: 1,
              }}
            >
            <Image 
              source={images.icons.sparkle} 
              style={{ 
                width: 16, 
                height: 16,
                tintColor: '#F5EBE0',
              }}
              contentFit="contain"
            />
            <Text
              style={{
                fontSize: 15,
                fontWeight: 'bold',
                color: '#F5EBE0',
              }}
            >
              {t('screens.visionBoard.buttons.createVision')}
            </Text>
            </Pressable>
          </View>

          {/* Upload Vision Button */}
          <View style={[
            {
              backgroundColor: 'transparent', // Required for shadow efficiency
              shadowColor: '#F5EBE0',
              shadowOffset: {
                width: 0,
                height: 4,
              },
              shadowOpacity: 0.75,
              shadowRadius: 0,
              elevation: 8, // For Android
              borderRadius: 10,
              flex: 1,
            },
            isUploadPressed && {
              shadowOffset: { width: 0, height: 2 },
            }
          ]}>
            <Pressable
              onPress={async () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                await handleUploadVision();
              }}
              onPressIn={() => setIsUploadPressed(true)}
              onPressOut={() => setIsUploadPressed(false)}
              style={{
                backgroundColor: '#003049',
                borderWidth: 1,
                borderColor: '#9B9B9B',
                borderRadius: 10,
                paddingHorizontal: 16,
                paddingVertical: 12,
                alignItems: 'center',
                justifyContent: 'center',
                height: 44,
                flex: 1,
              }}
            >
            <Text
              style={{
                fontSize: 15,
                fontWeight: 'bold',
                color: '#F5EBE0',
                textAlign: 'center',
                flex: 1,
              }}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.8}
            >
              {t('screens.visionBoard.buttons.uploadVision')}
            </Text>
            </Pressable>
          </View>
        </View>
        
        {/* Masonry Grid */}
        <MasonryGrid visionImages={visionImages} onImagePress={handleImagePress} />
      </ScrollView>

      {/* Info Popup */}
      <InfoPopup
        visible={showInfoPopup}
        title={t('infoContent.visionBoard.title')}
        content={t('infoContent.visionBoard.content')}
        onClose={() => setShowInfoPopup(false)}
      />

      {/* Image Preview Modal */}
      <Modal
        visible={showImagePreview}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImagePreview(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 20,
        }}>
          {selectedImage && (
            <>
              {/* Header with Delete and Close buttons */}
              <View style={{
                position: 'absolute',
                top: insets.top + 20,
                left: 20,
                right: 20,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 10,
              }}>
                {/* Delete Button */}
                <Pressable
                  onPress={handleDeleteImage}
                  style={{
                    width: 44,
                    height: 44,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <View style={{
                    width: 24,
                    height: 24,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    {/* Delete icon - trash can */}
                    <View style={{
                      width: 16,
                      height: 18,
                      position: 'relative',
                    }}>
                      {/* Trash can lid */}
                      <View style={{
                        position: 'absolute',
                        top: 2,
                        left: 1,
                        right: 1,
                        height: 2,
                        backgroundColor: '#ffb3ba',
                        borderRadius: 1,
                      }} />
                      {/* Trash can body */}
                      <View style={{
                        position: 'absolute',
                        top: 4,
                        left: 2,
                        right: 2,
                        bottom: 0,
                        backgroundColor: '#ffb3ba',
                        borderRadius: 2,
                      }} />
                      {/* Trash can handle */}
                      <View style={{
                        position: 'absolute',
                        top: 0,
                        left: 5,
                        right: 5,
                        height: 2,
                        borderWidth: 1,
                        borderColor: '#ffb3ba',
                        borderRadius: 1,
                        backgroundColor: 'transparent',
                      }} />
                    </View>
                  </View>
                </Pressable>

                {/* Close Button */}
                <Pressable
                  onPress={() => setShowImagePreview(false)}
                  style={{
                    width: 44,
                    height: 44,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <View style={{
                    width: 24,
                    height: 24,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    {/* X icon */}
                    <View style={{
                      width: 18,
                      height: 18,
                      position: 'relative',
                    }}>
                      {/* First diagonal line */}
                      <View style={{
                        position: 'absolute',
                        top: 8,
                        left: 0,
                        right: 0,
                        height: 2,
                        backgroundColor: '#F5EBE0',
                        borderRadius: 1,
                        transform: [{ rotate: '45deg' }],
                      }} />
                      {/* Second diagonal line */}
                      <View style={{
                        position: 'absolute',
                        top: 8,
                        left: 0,
                        right: 0,
                        height: 2,
                        backgroundColor: '#F5EBE0',
                        borderRadius: 1,
                        transform: [{ rotate: '-45deg' }],
                      }} />
                    </View>
                  </View>
                </Pressable>
              </View>

              {/* Image */}
              <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                maxHeight: '70%',
              }}>
                <Image
                  source={{ uri: selectedImage.imageUri }}
                  style={{
                    width: '100%',
                    aspectRatio: selectedImage.aspectRatio,
                    borderRadius: 15,
                    backgroundColor: '#2A2D3A',
                  }}
                  contentFit="contain"
                />
              </View>

              {/* Image Info */}
              <View style={{
                width: '100%',
                paddingTop: 20,
                alignItems: 'center',
                gap: 8,
              }}>
                {/* Goal Connection - Since we don't have goal linking yet, show generic info */}
                <Text style={{
                  color: '#F5EBE0',
                  fontSize: 18,
                  fontWeight: 'bold',
                  textAlign: 'center',
                }}>
                  {t('visionBoard.imagePreview.title')}
                </Text>
                
                {/* Timestamp */}
                <Text style={{
                  color: 'rgba(245, 235, 224, 0.7)',
                  fontSize: 14,
                  textAlign: 'center',
                }}>
                  {selectedImage.createdAt ? formatTimestamp(selectedImage.createdAt) : t('visionBoard.imagePreview.unknownDate')}
                </Text>
                
                {/* Source */}
                <Text style={{
                  color: 'rgba(245, 235, 224, 0.7)',
                  fontSize: 14,
                  textAlign: 'center',
                  textTransform: 'capitalize',
                }}>
                  {selectedImage.source || t('visionBoard.imagePreview.unknownSource')}
                </Text>
              </View>
            </>
          )}
        </View>
      </Modal>
    </LinearGradient>
  );
}
