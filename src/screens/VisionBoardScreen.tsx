import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { typography } from '../constants/typography';

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
  const columnWidth = 95;
  const gap = 8;

  return (
    <View style={{ flexDirection: 'row', gap, height: 401 }}>
      {/* Left Column */}
      <View style={{ flex: 1, gap }}>
        <VisionImageCard width={columnWidth} height={120} />
        <VisionImageCard width={columnWidth} height={149} />
        <VisionImageCard width={columnWidth} height={98} />
      </View>
      
      {/* Middle Column */}
      <View style={{ flex: 1, gap }}>
        <VisionImageCard width={columnWidth} height={154} />
        <VisionImageCard width={columnWidth} height={120} />
        <VisionImageCard width={columnWidth} height={134} />
      </View>
      
      {/* Right Column */}
      <View style={{ flex: 1, gap }}>
        <VisionImageCard width={columnWidth} height={100} />
        <VisionImageCard width={columnWidth} height={199} />
        <VisionImageCard width={columnWidth} height={78} />
      </View>
    </View>
  );
}

export default function VisionBoardScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const handleCreateVision = () => {
    console.log('Create Vision with AI');
    // TODO: Navigate to AI vision creation screen
  };

  const handleUploadVision = () => {
    console.log('Upload Vision from gallery');
    // TODO: Open image picker
  };

  const handleGoBack = () => {
    navigation.goBack();
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
          paddingTop: insets.top + 63,
          paddingHorizontal: 36,
          paddingBottom: 150,
          gap: 43,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ gap: 8 }}>
          <Text
            style={{
              ...typography.title,
              fontSize: 20,
              color: '#F5EBE0',
            }}
          >
            Vision Board
          </Text>
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
        <View style={{ flexDirection: 'row', gap: 30 }}>
          {/* Create Vision Button */}
          <Pressable
            onPress={handleCreateVision}
            style={{
              backgroundColor: '#3D405B',
              borderWidth: 1,
              borderColor: '#9B9B9B',
              borderRadius: 10,
              paddingHorizontal: 10,
              paddingVertical: 10,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              height: 44,
              minWidth: 120,
            }}
          >
            <View style={{ width: 20, height: 20 }}>
              <Text style={{ fontSize: 16, color: '#F5EBE0' }}>✨</Text>
            </View>
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
              paddingHorizontal: 10,
              paddingVertical: 10,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              height: 44,
              minWidth: 120,
            }}
          >
            <View style={{ width: 20, height: 20 }}>
              <Text style={{ fontSize: 16, color: '#F5EBE0' }}>+</Text>
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

      {/* Back Button (floating) */}
      <Pressable
        onPress={handleGoBack}
        style={{
          position: 'absolute',
          top: insets.top + 20,
          left: 20,
          width: 44,
          height: 44,
          backgroundColor: 'rgba(0,0,0,0.3)',
          borderRadius: 22,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 18, color: '#F5EBE0' }}>←</Text>
      </Pressable>
    </LinearGradient>
  );
}
