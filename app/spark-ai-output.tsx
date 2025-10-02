import React from 'react';
import { View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import SparkAIOutput, { SparkOutputType } from '../src/components/SparkAIOutput';

export default function SparkAIOutputScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    type: SparkOutputType;
    title: string;
    timestamp: string;
    transcription: string;
  }>();

  const handleSave = (data: any) => {
    // Handle saving the data (integrate with your data management system)
    console.log('Saving SparkAI output:', data);
    
    // Navigate back or to appropriate screen
    router.back();
  };

  const handleCancel = () => {
    // Navigate back without saving
    router.back();
  };

  return (
    <SparkAIOutput
      type={params.type || 'task'}
      userVoiceInput={params.transcription || ''}
      aiTitle={params.title || ''}
      aiTimestamp={params.timestamp || ''}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}
