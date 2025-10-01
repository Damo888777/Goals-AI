import { View, Text, Pressable, Image } from 'react-native';
import type { Goal } from '../types';
import { typography } from '../constants/typography';

interface GoalCardProps {
  goal?: Goal;
  isEmpty?: boolean;
  onPress?: () => void;
}

export function GoalCard({ goal, isEmpty = false, onPress }: GoalCardProps) {
  if (isEmpty) {
    return (
      <Pressable
        onPress={onPress}
        style={{
          backgroundColor: '#F5EBE0',
          borderWidth: 0.5,
          borderColor: '#A3B18A',
          borderRadius: 20,
          padding: 20,
          minHeight: 124,
          // Drop shadow matching Figma specs
          shadowColor: '#7C7C7C',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.75,
          shadowRadius: 0,
          elevation: 4,
        }}
      >
        <View style={{
          backgroundColor: '#E9EDC9',
          borderWidth: 0.5,
          borderColor: '#A3B18A',
          borderRadius: 20,
          padding: 15,
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          // Inner card shadow
          shadowColor: '#7C7C7C',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.75,
          shadowRadius: 0,
          elevation: 4,
        }}>
          <Text style={{
            ...typography.cardTitle,
            textAlign: 'center',
            marginBottom: 8,
          }}>
            No goals yet
          </Text>
          <Text style={{
            ...typography.cardDescription,
            textAlign: 'center',
          }}>
            Create your first goal and start your journey
          </Text>
        </View>
      </Pressable>
    );
  }

  const progress = goal?.progress || 0;
  const emotions = goal?.emotions || [];
  const displayedEmotions = emotions.slice(0, 2);
  const remainingCount = emotions.length - 2;

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: '#F5EBE0',
        borderWidth: 0.5,
        borderColor: '#A3B18A',
        borderRadius: 20,
        padding: 20,
        gap: 10,
        // Drop shadow matching Figma specs
        shadowColor: '#7C7C7C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.75,
        shadowRadius: 0,
        elevation: 4,
      }}
    >
      {/* Goal Card Container */}
      <View style={{
        backgroundColor: '#E9EDC9',
        borderWidth: 0.5,
        borderColor: '#A3B18A',
        borderRadius: 20,
        height: 89,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        // Inner card shadow
        shadowColor: '#7C7C7C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.75,
        shadowRadius: 0,
        elevation: 4,
      }}>
        {/* Left side - Title and Progress */}
        <View style={{ flex: 1, gap: 9 }}>
          <Text style={{
            ...typography.cardTitle,
            lineHeight: 20,
          }} numberOfLines={2}>
            {goal?.title || 'Placeholder Title'}
          </Text>

          {/* Progress Bar */}
          <View style={{ height: 17, justifyContent: 'center' }}>
            <View style={{
              height: 6,
              backgroundColor: 'rgba(120,120,120,0.2)',
              borderRadius: 3,
              marginHorizontal: 16,
            }}>
              <View style={{
                height: 6,
                backgroundColor: '#A1C181',
                borderRadius: 3,
                width: `${progress}%`,
              }} />
            </View>
          </View>
        </View>

        {/* Right side - Emotion Badges */}
        <View style={{ 
          width: 59, 
          gap: 10, 
          alignItems: 'center',
          position: 'relative',
        }}>
          {displayedEmotions.slice(0, 2).map((emotion, index) => (
            <View
              key={index}
              style={{
                backgroundColor: index === 0 ? '#BDE0FE' : '#CDB4DB',
                borderWidth: 0.3,
                borderColor: index === 0 ? '#023047' : '#3D405B',
                borderRadius: 5,
                paddingHorizontal: 15,
                paddingVertical: 5,
                height: 21,
                width: 59,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{
                fontSize: 10,
                fontWeight: '400',
                color: index === 0 ? '#023047' : '#3D405B',
              }}>
                {emotion}
              </Text>
            </View>
          ))}
          
          {remainingCount > 0 && (
            <View style={{
              position: 'absolute',
              right: -7,
              top: 34,
              backgroundColor: '#FCB9B2',
              borderWidth: 0.5,
              borderColor: '#BC4749',
              borderRadius: 8,
              width: 13,
              height: 13,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Text style={{
                fontSize: 8,
                fontWeight: '400',
                color: '#BC4749',
              }}>
                +{remainingCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}
