#!/usr/bin/env node

const fetch = require('node-fetch');

async function sendTestNotification() {
  try {
    console.log('🔔 Sending immediate test notification...');
    
    // Use your Expo API endpoint that calls Supabase Edge Function
    const response = await fetch('http://localhost:8081/api/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: 'bcd988a6-d832-4c7c-83bf-4af40c46bf53',
        include_subscription_ids: ['b873c29b-f5b0-4b9b-b556-b5de560be16e'],
        headings: { en: '🚨 Immediate Test!' },
        contents: { en: 'This notification was sent via terminal script. Close the app now!' },
        data: { 
          type: 'terminal_test',
          scenario: 'immediate_delivery',
          timestamp: new Date().toISOString()
        }
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Notification sent successfully!');
      console.log('📱 Notification ID:', result.id);
      console.log('🎯 Recipients:', result.recipients || 'N/A');
      console.log('');
      console.log('📋 Instructions:');
      console.log('1. Close your app completely (swipe up and swipe away)');
      console.log('2. Wait 10-15 seconds');
      console.log('3. The notification should appear on your lock screen');
      console.log('');
    } else {
      console.error('❌ Failed to send notification:', result.error);
      console.error('Details:', result);
    }
    
  } catch (error) {
    console.error('💥 Script error:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('- Make sure your Expo dev server is running (npx expo start)');
    console.log('- Verify the server is accessible at http://localhost:8081');
    console.log('- Check that your app is connected to the dev server');
  }
}

// Run the script
sendTestNotification();
