import { View, Text, StyleSheet } from 'react-native';
import { typography } from '../constants/typography';

interface GreetingMessageProps {
  username?: string;
}

export function GreetingMessage({ username = 'User' }: GreetingMessageProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Morning';
    if (hour >= 12 && hour < 17) return 'Afternoon';
    if (hour >= 17 && hour < 22) return 'Evening';
    return 'Night';
  };

  const getFormattedDate = () => {
    const date = new Date();
    const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${weekday}, ${month}.${day}.${year}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>
        Good {getGreeting()}, {username}
      </Text>
      <Text style={styles.date}>
        {getFormattedDate()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 8,
  },
  greeting: {
    ...typography.title,
  },
  date: {
    ...typography.body,
  },
});
