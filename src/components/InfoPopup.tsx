import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography } from '../constants/typography';

interface InfoPopupProps {
  visible: boolean;
  title: string;
  content: string;
  onClose: () => void;
}

const renderContent = (content: string) => {
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      // Bold text
      const boldText = part.slice(2, -2);
      return (
        <Text key={index} style={styles.boldText}>
          {boldText}
        </Text>
      );
    } else {
      // Regular text
      return (
        <Text key={index} style={styles.regularText}>
          {part}
        </Text>
      );
    }
  });
};

export function InfoPopup({ visible, title, content, onClose }: InfoPopupProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.popup}>
          {/* Header with title and close button */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#364958" />
            </Pressable>
          </View>
          
          {/* Content */}
          <Text style={styles.content}>
            {renderContent(content)}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  popup: {
    backgroundColor: '#F5EBE0',
    borderRadius: 16,
    padding: 24,
    maxWidth: 320,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#364958',
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E9EDC9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    color: '#364958',
    fontWeight: '300',
    textAlign: 'left',
  },
  boldText: {
    fontWeight: 'bold',
    color: '#364958',
  },
  regularText: {
    fontWeight: '300',
    color: '#364958',
  },
});
