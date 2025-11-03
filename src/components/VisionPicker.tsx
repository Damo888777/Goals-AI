import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useVisionImages } from '../hooks/useDatabase';
import VisionImage from '../db/models/VisionImage';

interface VisionPickerProps {
  visible: boolean;
  onClose: () => void;
  onVisionSelect: (visionImage: VisionImage) => void;
  selectedVisionImage?: VisionImage | null;
}

export default function VisionPicker({
  visible,
  onClose,
  onVisionSelect,
  selectedVisionImage
}: VisionPickerProps) {
  const { t } = useTranslation();
  const { visionImages } = useVisionImages();

  const handleVisionSelect = (image: VisionImage) => {
    onVisionSelect(image);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.visionModalOverlay}>
        <LinearGradient
          colors={['#4a4e69', '#9a8c98', '#4a4e69']}
          locations={[0, 0.5, 1]}
          style={styles.visionModalContainer}
        >
          {/* Header */}
          <View style={styles.visionModalHeader}>
            <Text style={styles.visionModalTitle}>{t('components.visionPicker.title')}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.visionModalCloseButton}
            >
              <Text style={styles.visionModalCloseText}>×</Text>
            </TouchableOpacity>
          </View>

          {/* Vision Images Grid */}
          <View style={styles.visionModalContent}>
            {visionImages.length > 0 ? (
              <ScrollView 
                style={styles.visionScrollView}
                contentContainerStyle={styles.visionScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.visionGrid}>
                  {/* Left Column */}
                  <View style={styles.visionGridColumn}>
                    {visionImages.filter((_, index) => index % 2 === 0).map((image) => (
                      <TouchableOpacity
                        key={image.id}
                        style={[
                          styles.visionGridItem,
                          { height: 150 + (Math.random() * 100) }, // Random height for masonry effect
                          selectedVisionImage?.id === image.id && styles.visionGridItemSelected
                        ]}
                        onPress={() => handleVisionSelect(image)}
                      >
                        <Image
                          source={{ uri: image.imageUrl }}
                          style={styles.visionGridImage}
                          contentFit="cover"
                        />
                        {selectedVisionImage?.id === image.id && (
                          <View style={styles.visionGridOverlay}>
                            <Text style={styles.visionGridCheckmark}>✓</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                  
                  {/* Right Column */}
                  <View style={styles.visionGridColumn}>
                    {visionImages.filter((_, index) => index % 2 === 1).map((image) => (
                      <TouchableOpacity
                        key={image.id}
                        style={[
                          styles.visionGridItem,
                          { height: 150 + (Math.random() * 100) }, // Random height for masonry effect
                          selectedVisionImage?.id === image.id && styles.visionGridItemSelected
                        ]}
                        onPress={() => handleVisionSelect(image)}
                      >
                        <Image
                          source={{ uri: image.imageUrl }}
                          style={styles.visionGridImage}
                          contentFit="cover"
                        />
                        {selectedVisionImage?.id === image.id && (
                          <View style={styles.visionGridOverlay}>
                            <Text style={styles.visionGridCheckmark}>✓</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>
            ) : (
              <View style={styles.visionEmptyState}>
                <Text style={styles.visionEmptyTitle}>{t('components.visionPicker.emptyState.title')}</Text>
                <Text style={styles.visionEmptyDescription}>
                  {t('components.visionPicker.emptyState.description')}
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Vision Modal Styles
  visionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 40,
  },
  visionModalContainer: {
    borderRadius: 20,
    width: '100%',
    height: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  visionModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 235, 224, 0.2)',
  },
  visionModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F5EBE0',
  },
  visionModalCloseButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(245, 235, 224, 0.1)',
  },
  visionModalCloseText: {
    fontSize: 24,
    color: '#F5EBE0',
    fontWeight: 'bold',
    lineHeight: 24,
  },
  visionModalContent: {
    flex: 1,
    padding: 24,
  },
  visionScrollView: {
    flex: 1,
  },
  visionScrollContent: {
    paddingBottom: 20,
  },
  visionGrid: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
    width: '100%'
  },
  visionGridColumn: {
    flex: 1,
    gap: 16,
  },
  visionGridItem: {
    width: '100%',
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#2A2D3A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    position: 'relative',
  },
  visionGridItemSelected: {
    borderWidth: 3,
    borderColor: '#F5EBE0',
    shadowColor: '#F5EBE0',
    shadowOpacity: 0.6,
  },
  visionGridImage: {
    width: '100%',
    height: '100%',
  },
  visionGridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(245, 235, 224, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visionGridCheckmark: {
    fontSize: 32,
    color: '#4a4e69',
    fontWeight: 'bold',
  },
  visionEmptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  visionEmptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F5EBE0',
    marginBottom: 12,
    textAlign: 'center',
  },
  visionEmptyDescription: {
    fontSize: 16,
    color: 'rgba(245, 235, 224, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
  },
});
