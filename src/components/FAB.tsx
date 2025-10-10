import { View, Pressable, StyleSheet, Text, Modal, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { images } from '../constants/images';

interface FABProps {
  onPress?: () => void;
  onLongPress?: () => void;
}

export function FAB({ onPress, onLongPress }: FABProps) {
  const insets = useSafeAreaInsets();
  const [showMenu, setShowMenu] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onPress) {
      onPress();
    } else {
      router.push('/spark-ai');
    }
  };

  const handleLongPress = () => {
    console.log('Long press triggered!'); // Debug log
    console.log('Current showMenu state:', showMenu); // Debug state
    
    // Always show menu first, then call custom handler if provided
    setShowMenu(true);
    console.log('Setting showMenu to true'); // Debug state change
    
    // Add haptic feedback when menu opens
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (onLongPress) {
      onLongPress();
    }
  };

  const handleMenuItemPress = (action: string) => {
    setShowMenu(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Handle menu item actions
    switch (action) {
      case 'task':
        router.push('/manual-task');
        break;
      case 'goal':
        router.push('/manual-goal');
        break;
      case 'milestone':
        router.push('/manual-milestone');
        break;
    }
  };
  
  return (
    <>
      <View 
        style={[
          styles.container,
          { bottom: 0 + insets.bottom } // Position at absolute bottom above tab bar
        ]}
      >
        <Pressable
          onPress={handlePress}
          onLongPress={handleLongPress}
          delayLongPress={500}
          onPressIn={() => setIsPressed(true)}
          onPressOut={() => setIsPressed(false)}
          style={[
            styles.fab,
            { transform: [{ rotate: '45deg' }] },
            isPressed && styles.fabPressed
          ]}
        >
          <View style={{ transform: [{ rotate: '-45deg' }] }}>
            <Image 
              source={{ uri: images.icons.sparkFab }} 
              style={{ width: 30, height: 30 }}
              contentFit="contain"
            />
          </View>
        </Pressable>
      </View>

      {/* Long Press Menu Modal */}
      {showMenu && (
        <View style={styles.menuOverlay}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFillObject}
            onPress={() => setShowMenu(false)}
          />
          <View 
            style={[
              styles.menuContainer,
              { bottom: 70 + insets.bottom, right: 80 }
            ]}
          >
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleMenuItemPress('task')}
            >
              <Text style={styles.menuText}>Create Task</Text>
            </TouchableOpacity>
            
            <View style={styles.menuDivider} />
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleMenuItemPress('goal')}
            >
              <Text style={styles.menuText}>Create Goal</Text>
            </TouchableOpacity>
            
            <View style={styles.menuDivider} />
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleMenuItemPress('milestone')}
            >
              <Text style={styles.menuText}>Create Milestone</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 20,
    zIndex: 1000,
  },
  fab: {
    width: 60,
    height: 60,
    backgroundColor: '#364958',
    borderWidth: 1,
    borderColor: '#9B9B9B',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 2.8, height: 2.8 }, // Adjusted for 45° rotation: 4 * sin(45°) ≈ 2.8
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  fabPressed: {
    shadowOffset: { width: 1.4, height: 1.4 }, // Pressed state: 2 * sin(45°) ≈ 1.4
  },
  // Menu styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 2000,
  },
  menuContainer: {
    position: 'absolute',
    backgroundColor: '#364958',
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 200,
    borderWidth: 0.5,
    borderColor: '#9B9B9B',
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 8,
  },
  menuItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 48,
    justifyContent: 'center',
  },
  menuText: {
    color: '#F5EBE0',
    fontSize: 16,
    fontWeight: '400',
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 12,
  },
});
