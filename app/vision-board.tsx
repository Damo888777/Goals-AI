import { View, Text, ScrollView, Pressable } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { typography } from '../src/constants/typography';
import { images } from '../src/constants/images';
import { InfoPopup } from '../src/components/InfoPopup';
import { INFO_CONTENT } from '../src/constants/infoContent';

interface VisionImageProps {
  width: number;
  height: number;
  imageUri?: string;
}

function VisionImageCard({ width, height, imageUri }: VisionImageProps) {
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
          <Text style={{ fontSize: 12, color: '#999' }}>Vision</Text>
        </View>
      )}
    </View>
  );
}

interface VisionItem {
  id: number;
  aspectRatio: number;
  height?: number;
  imageUri?: string;
}

interface Column {
  items: VisionItem[];
  height: number;
}

interface MasonryGridProps {
  visionImages: VisionItem[];
}

function MasonryGrid({ visionImages }: MasonryGridProps) {
  const gap = 12;
  const numColumns = 2;
  
  // Show empty state card if no images
  if (visionImages.length === 0) {
    return (
      <View style={{
        backgroundColor: '#F5EBE0',
        borderRadius: 12,
        paddingVertical: 32,
        paddingHorizontal: 24,
        alignItems: 'center',
        marginTop: 16,
        shadowColor: '#7C7C7C',
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.75,
        shadowRadius: 0,
        elevation: 8, // For Android
      }}>
        <Text style={{
          fontSize: 18,
          fontWeight: '600',
          color: '#3D405B',
          marginBottom: 8,
          textAlign: 'center',
        }}>
          No vision yet
        </Text>
        <Text style={{
          fontSize: 14,
          color: '#6B7280',
          textAlign: 'center',
          lineHeight: 20,
        }}>
          Add your first vision and start your journey
        </Text>
      </View>
    );
  }
  
  return <MasonryLayout items={visionImages} gap={gap} numColumns={numColumns} isEmpty={false} />;
}

function MasonryLayout({ items, gap, numColumns, isEmpty }: { 
  items: VisionItem[], 
  gap: number, 
  numColumns: number, 
  isEmpty: boolean 
}) {

  // Distribute items across columns using Pinterest algorithm
  const columns: Column[] = Array.from({ length: numColumns }, () => ({ items: [], height: 0 }));
  
  items.forEach((item) => {
    // Find the shortest column
    const shortestColumn = columns.reduce((prev, current) => 
      prev.height < current.height ? prev : current
    );
    
    // Calculate item height based on aspect ratio (using base height for layout)
    const baseHeight = 150;
    const itemHeight = baseHeight / item.aspectRatio;
    
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
            <View
              key={item.id}
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
                    {isEmpty ? '' : 'Vision'}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

export default function VisionBoardScreen() {
  const insets = useSafeAreaInsets();
  const [visionImages, setVisionImages] = useState<VisionItem[]>([]);
  const [showInfoPopup, setShowInfoPopup] = useState(false);

  const handleCreateVision = () => {
    router.push('/spark-generate-img');
  };

  const handleUploadVision = () => {
    console.log('Upload Vision from gallery');
    // Simulate adding an uploaded vision image
    const newVision: VisionItem = {
      id: Date.now() + 1,
      aspectRatio: Math.random() * 1.5 + 0.5, // Random aspect ratio between 0.5 and 2.0
      imageUri: `https://picsum.photos/300/${Math.floor(Math.random() * 200 + 200)}`, // Random placeholder image
    };
    setVisionImages(prev => [...prev, newVision]);
  };

  const handleGoBack = () => {
    router.back();
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
          paddingHorizontal: 24,
          paddingBottom: 120,
          gap: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  handleGoBack();
                }}
                style={{
                  width: 30,
                  height: 30,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <View style={{
                  width: 20,
                  height: 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <View style={{
                    width: 12,
                    height: 12,
                    borderLeftWidth: 2,
                    borderBottomWidth: 2,
                    borderColor: '#F5EBE0',
                    transform: [{ rotate: '45deg' }],
                    borderRadius: 1,
                  }} />
                </View>
              </Pressable>
              <Text
                style={{
                  ...typography.title,
                  fontSize: 20,
                  color: '#F5EBE0',
                }}
              >
                Vision Board
              </Text>
            </View>
            
            {/* Info Button */}
            <Pressable 
              onPress={() => setShowInfoPopup(true)}
              style={{
                width: 44,
                height: 44,
                alignItems: 'center',
                justifyContent: 'center',
              }}
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
          <Text
            style={{
              fontSize: 15,
              fontWeight: '300',
              color: '#F5EBE0',
              lineHeight: 18,
            }}
          >
            Your place to visualize your dreams and goals. Upload or generate your vision easily.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', gap: 16, width: '100%' }}>
          {/* Create Vision Button */}
          <View style={{
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
          }}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handleCreateVision();
              }}
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
              source={{ uri: images.icons.createVision }} 
              style={{ width: 16, height: 16 }}
              contentFit="contain"
            />
            <Text
              style={{
                fontSize: 15,
                fontWeight: 'bold',
                color: '#F5EBE0',
              }}
            >
              Create Vision
            </Text>
            </Pressable>
          </View>

          {/* Upload Vision Button */}
          <View style={{
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
          }}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handleUploadVision();
              }}
              style={{
                backgroundColor: '#003049',
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
            <View
              style={{
                width: 16,
                height: 16,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  position: 'absolute',
                  width: 12,
                  height: 3,
                  backgroundColor: '#F5EBE0',
                  borderRadius: 1.5,
                }}
              />
              <View
                style={{
                  position: 'absolute',
                  width: 3,
                  height: 12,
                  backgroundColor: '#F5EBE0',
                  borderRadius: 1.5,
                }}
              />
            </View>
            <Text
              style={{
                fontSize: 15,
                fontWeight: 'bold',
                color: '#F5EBE0',
              }}
            >
              Upload Vision
            </Text>
            </Pressable>
          </View>
        </View>

        {/* Masonry Grid */}
        <MasonryGrid visionImages={visionImages} />
      </ScrollView>

      {/* Info Popup */}
      <InfoPopup
        visible={showInfoPopup}
        title={INFO_CONTENT.VISION_BOARD.title}
        content={INFO_CONTENT.VISION_BOARD.content}
        onClose={() => setShowInfoPopup(false)}
      />
    </LinearGradient>
  );
}
