import { View, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { images } from '../constants/images';

interface FABProps {
  onPress: () => void;
  onLongPress?: () => void;
}

export function FAB({ onPress, onLongPress }: FABProps) {
  const insets = useSafeAreaInsets();
  
  return (
    <View 
      style={[
        styles.container,
        { bottom: 0 + insets.bottom } // Position at absolute bottom above tab bar
      ]}
    >
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        style={[
          styles.fab,
          { transform: [{ rotate: '45deg' }] }
        ]}
      >
        <View style={{ transform: [{ rotate: '-45deg' }] }}>
          <Image 
            source={{ uri: images.icons.sparkFab }} 
            style={{ width: 30, height: 30 }}
            resizeMode="contain"
          />
        </View>
      </Pressable>
    </View>
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
});
