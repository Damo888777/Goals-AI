import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  Pressable, 
  StyleSheet, 
  TextInput,
  ScrollView,
  Alert 
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { typography } from '../constants/typography';
import { soundService } from '../services/soundService';
import type { Goal } from '../types';

interface ReflectionData {
  keyTakeaway: string;
  biggestHurdle: string;
  lessonForNext: string;
}

interface GoalCompletionModalProps {
  visible: boolean;
  goal: Goal | null;
  onClose: () => void;
  onCompleteGoal: (goalId: string, reflectionData?: ReflectionData) => Promise<void>;
}

type FlowStep = 'notification' | 'reflection-prompt' | 'question1' | 'question2' | 'question3' | 'completed';

export function GoalCompletionModal({ 
  visible, 
  goal, 
  onClose, 
  onCompleteGoal 
}: GoalCompletionModalProps) {
  const [currentStep, setCurrentStep] = useState<FlowStep>('notification');
  const [reflectionData, setReflectionData] = useState<ReflectionData>({
    keyTakeaway: '',
    biggestHurdle: '',
    lessonForNext: ''
  });

  const handleStepTransition = (nextStep: FlowStep) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentStep(nextStep);
  };

  const handleSkipReflection = async () => {
    if (goal) {
      await onCompleteGoal(goal.id);
      resetAndClose();
    }
  };

  const handleCompleteWithReflection = async () => {
    if (goal) {
      await onCompleteGoal(goal.id, reflectionData);
      resetAndClose();
    }
  };

  const resetAndClose = () => {
    setCurrentStep('notification');
    setReflectionData({
      keyTakeaway: '',
      biggestHurdle: '',
      lessonForNext: ''
    });
    onClose();
  };

  const renderNotificationStep = () => (
    <View style={styles.content}>
      <Text style={styles.title}>All Milestones Complete! 🎯</Text>
      <Text style={styles.description}>
        You've completed all milestones for "{goal?.title}". 
        Do you feel you've achieved your goal?
      </Text>
      <View style={styles.buttonContainer}>
        <Pressable style={styles.secondaryButton} onPress={onClose}>
          <Text style={styles.secondaryButtonText}>Not Yet</Text>
        </Pressable>
        <Pressable 
          style={styles.primaryButton} 
          onPress={() => {
            soundService.playSuccessSound();
            handleStepTransition('reflection-prompt');
          }}
        >
          <Text style={styles.primaryButtonText}>Yes!</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderReflectionPrompt = () => (
    <View style={styles.content}>
      <Text style={styles.title}>🎉 Congratulations!</Text>
      <Text style={styles.description}>
        You've achieved your goal! Would you like to reflect on your journey? 
        This helps you grow and learn for future goals.
      </Text>
      <View style={styles.buttonContainer}>
        <Pressable style={styles.secondaryButton} onPress={handleSkipReflection}>
          <Text style={styles.secondaryButtonText}>Skip</Text>
        </Pressable>
        <Pressable 
          style={styles.primaryButton} 
          onPress={() => handleStepTransition('question1')}
        >
          <Text style={styles.primaryButtonText}>Reflect</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderQuestion1 = () => (
    <View style={styles.content}>
      <Text style={styles.questionTitle}>What was your key takeaway from this journey?</Text>
      <TextInput
        style={styles.textInput}
        multiline
        numberOfLines={4}
        placeholder="Type here your main insight or learning..."
        placeholderTextColor="rgba(54,73,88,0.5)"
        value={reflectionData.keyTakeaway}
        onChangeText={(text) => setReflectionData(prev => ({ ...prev, keyTakeaway: text }))}
      />
      <View style={styles.buttonContainer}>
        <Pressable 
          style={styles.secondaryButton} 
          onPress={() => handleStepTransition('question2')}
        >
          <Text style={styles.secondaryButtonText}>Skip</Text>
        </Pressable>
        <Pressable 
          style={styles.primaryButton} 
          onPress={() => handleStepTransition('question2')}
        >
          <Text style={styles.primaryButtonText}>Next</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderQuestion2 = () => (
    <View style={styles.content}>
      <Text style={styles.questionTitle}>What was the biggest hurdle you mastered, and how?</Text>
      <TextInput
        style={styles.textInput}
        multiline
        numberOfLines={4}
        placeholder="Type here a challenge you overcame..."
        placeholderTextColor="rgba(54,73,88,0.5)"
        value={reflectionData.biggestHurdle}
        onChangeText={(text) => setReflectionData(prev => ({ ...prev, biggestHurdle: text }))}
      />
      <View style={styles.buttonContainer}>
        <Pressable 
          style={styles.secondaryButton} 
          onPress={() => handleStepTransition('question3')}
        >
          <Text style={styles.secondaryButtonText}>Skip</Text>
        </Pressable>
        <Pressable 
          style={styles.primaryButton} 
          onPress={() => handleStepTransition('question3')}
        >
          <Text style={styles.primaryButtonText}>Next</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderQuestion3 = () => (
    <View style={styles.content}>
      <Text style={styles.questionTitle}>What's one lesson you'll take to your next goal?</Text>
      <TextInput
        style={styles.textInput}
        multiline
        numberOfLines={4}
        placeholder="Type here what you will apply next time..."
        placeholderTextColor="rgba(54,73,88,0.5)"
        value={reflectionData.lessonForNext}
        onChangeText={(text) => setReflectionData(prev => ({ ...prev, lessonForNext: text }))}
      />
      <View style={styles.buttonContainer}>
        <Pressable 
          style={styles.secondaryButton} 
          onPress={handleCompleteWithReflection}
        >
          <Text style={styles.secondaryButtonText}>Skip</Text>
        </Pressable>
        <Pressable 
          style={styles.primaryButton} 
          onPress={handleCompleteWithReflection}
        >
          <Text style={styles.primaryButtonText}>Complete</Text>
        </Pressable>
      </View>
    </View>
  );

  const getCurrentStepContent = () => {
    switch (currentStep) {
      case 'notification':
        return renderNotificationStep();
      case 'reflection-prompt':
        return renderReflectionPrompt();
      case 'question1':
        return renderQuestion1();
      case 'question2':
        return renderQuestion2();
      case 'question3':
        return renderQuestion3();
      default:
        return renderNotificationStep();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {getCurrentStepContent()}
          </ScrollView>
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
  modal: {
    backgroundColor: '#F5EBE0', // Trophy cream background
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: '#A3B18A',
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  content: {
    backgroundColor: '#EAE2B7', // Trophy gold background
    borderRadius: 20,
    margin: 15,
    padding: 20,
    borderWidth: 0.5,
    borderColor: '#B69121',
    shadowColor: '#B69121',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
    alignItems: 'center',
    gap: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#364958',
    fontFamily: 'Helvetica',
    textAlign: 'center',
  },
  questionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#364958',
    fontFamily: 'Helvetica',
    textAlign: 'center',
    lineHeight: 24,
  },
  description: {
    fontSize: 15,
    color: '#364958',
    fontFamily: 'Helvetica',
    fontWeight: '300',
    textAlign: 'center',
    lineHeight: 20,
  },
  textInput: {
    backgroundColor: '#F5EBE0',
    borderWidth: 0.5,
    borderColor: '#A3B18A',
    borderRadius: 12,
    padding: 15,
    fontSize: 14,
    color: '#364958',
    fontFamily: 'Helvetica',
    textAlignVertical: 'top',
    width: '100%',
    minHeight: 100,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#B69121', // Trophy gold
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F5EBE0',
    fontFamily: 'Helvetica',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#F5EBE0',
    borderWidth: 0.5,
    borderColor: '#A3B18A',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C7C7C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 0,
    elevation: 4,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#364958',
    fontFamily: 'Helvetica',
  },
});