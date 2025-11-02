import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { typography } from '../constants/typography';

interface GreetingMessageProps {
  username?: string;
}

export function GreetingMessage({ username }: GreetingMessageProps) {
  const { t } = useTranslation();
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return t('today.greeting.morning');
    if (hour >= 12 && hour < 17) return t('today.greeting.afternoon');
    if (hour >= 17 && hour < 22) return t('today.greeting.evening');
    return t('today.greeting.night');
  };

  const getFullGreeting = () => {
    const hour = new Date().getHours();
    const greeting = getGreeting();
    const goodWord = t('today.greeting.good');
    
    // Special handling for German night greeting
    if ((hour < 5 || hour >= 22) && goodWord === 'Guten') {
      return `Gute ${greeting}`;
    }
    
    // Special handling for French greetings
    if (goodWord === 'Bon') {
      // French afternoon and night need "Bonne" (feminine)
      if (hour >= 12 && hour < 17) { // afternoon
        return `Bonne ${greeting}`;
      }
      if (hour < 5 || hour >= 22) { // night
        return `Bonne ${greeting}`;
      }
      // Morning and evening use "Bon" + combined word
      return `${goodWord}${greeting}`;
    }
    
    return `${goodWord} ${greeting}`;
  };

  const getFormattedDate = () => {
    const date = new Date();
    
    // Get weekday using switch statement for more reliable translation
    const weekdayIndex = date.getDay();
    let weekday = '';
    switch (weekdayIndex) {
      case 0: weekday = t('calendar.days.sunday'); break;
      case 1: weekday = t('calendar.days.monday'); break;
      case 2: weekday = t('calendar.days.tuesday'); break;
      case 3: weekday = t('calendar.days.wednesday'); break;
      case 4: weekday = t('calendar.days.thursday'); break;
      case 5: weekday = t('calendar.days.friday'); break;
      case 6: weekday = t('calendar.days.saturday'); break;
      default: weekday = 'Unknown';
    }
    
    // Get month using switch statement for more reliable translation
    const monthIndex = date.getMonth();
    let month = '';
    switch (monthIndex) {
      case 0: month = t('calendar.monthsFull.january'); break;
      case 1: month = t('calendar.monthsFull.february'); break;
      case 2: month = t('calendar.monthsFull.march'); break;
      case 3: month = t('calendar.monthsFull.april'); break;
      case 4: month = t('calendar.monthsFull.may'); break;
      case 5: month = t('calendar.monthsFull.june'); break;
      case 6: month = t('calendar.monthsFull.july'); break;
      case 7: month = t('calendar.monthsFull.august'); break;
      case 8: month = t('calendar.monthsFull.september'); break;
      case 9: month = t('calendar.monthsFull.october'); break;
      case 10: month = t('calendar.monthsFull.november'); break;
      case 11: month = t('calendar.monthsFull.december'); break;
      default: month = 'Unknown';
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${weekday}, ${month}.${day}.${year}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>
        {getFullGreeting()}, {username || t('today.defaultUsername')}
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
