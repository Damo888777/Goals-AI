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

function MasonryGrid() {
  const gap = 8;

  return (
    <View style={{ flexDirection: 'row', gap, height: 401, justifyContent: 'center' }}>
      {/* Left Column */}
      <View style={{ flex: 1, gap, maxWidth: 95 }}>
        <VisionImageCard width={95} height={120} />
        <VisionImageCard width={95} height={149} />
        <VisionImageCard width={95} height={98} />
      </View>
      
      {/* Middle Column */}
      <View style={{ flex: 1, gap, maxWidth: 95 }}>
        <VisionImageCard width={95} height={154} />
        <VisionImageCard width={95} height={120} />
        <VisionImageCard width={95} height={134} />
      </View>
      
      {/* Right Column */}
      <View style={{ flex: 1, gap, maxWidth: 95 }}>
        <VisionImageCard width={95} height={100} />
        <VisionImageCard width={95} height={199} />
        <VisionImageCard width={95} height={78} />
      </View>
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
        <View style={{ flexDirection: 'row', gap: 25, justifyContent: 'center' }}>
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
              maxWidth: 150,
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
              maxWidth: 150,
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
