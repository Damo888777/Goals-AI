import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { typography } from '../src/constants/typography';
import { images } from '../src/constants/images';

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
          resizeMode="cover"
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

function MasonryGrid() {
  const gap = 12;
  const numColumns = 2;
  
  // Sample vision data with varied aspect ratios like Pinterest
  const visionItems: VisionItem[] = [
    { id: 1, aspectRatio: 0.75 }, // Portrait
    { id: 2, aspectRatio: 1.5 },  // Landscape
    { id: 3, aspectRatio: 0.6 },  // Tall portrait
    { id: 4, aspectRatio: 1.2 },  // Wide
    { id: 5, aspectRatio: 0.8 },  // Square-ish
    { id: 6, aspectRatio: 1.8 },  // Very wide
    { id: 7, aspectRatio: 0.5 },  // Very tall
    { id: 8, aspectRatio: 1.0 },  // Perfect square
    { id: 9, aspectRatio: 0.9 },  // Almost square
    { id: 10, aspectRatio: 1.3 }, // Medium wide
  ];

  // Distribute items across columns using Pinterest algorithm
  const columns: Column[] = Array.from({ length: numColumns }, () => ({ items: [], height: 0 }));
  
  visionItems.forEach((item) => {
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
                backgroundColor: '#E3E3E3',
                borderRadius: 5,
                overflow: 'hidden',
              }}
            >
              {item.imageUri ? (
                <Image
                  source={{ uri: item.imageUri }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
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
          ))}
        </View>
      ))}
    </View>
  );
}

export default function VisionBoardScreen() {
  const insets = useSafeAreaInsets();

  const handleCreateVision = () => {
    console.log('Create Vision with AI');
    // TODO: Navigate to AI vision creation screen
  };

  const handleUploadVision = () => {
    console.log('Upload Vision from gallery');
    // TODO: Open image picker
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
          paddingTop: insets.top + 40,
          paddingHorizontal: 24,
          paddingBottom: 120,
          gap: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
            <Pressable
              onPress={handleGoBack}
              style={{
                width: 30,
                height: 30,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 20, color: '#F5EBE0', fontWeight: '300' }}>‹</Text>
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
          <Pressable
            onPress={handleCreateVision}
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
              resizeMode="contain"
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

          {/* Upload Vision Button */}
          <Pressable
            onPress={handleUploadVision}
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

        {/* Masonry Grid */}
        <MasonryGrid />
      </ScrollView>

    </LinearGradient>
  );
}
