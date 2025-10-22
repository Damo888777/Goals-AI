import { serverApiKeyService } from '../../src/services/apiKeyService-server';

interface PomodoroCompletionRequest {
  type: 'pomodoro_completion';
  sessionType: 'work' | 'shortBreak' | 'longBreak';
  completedPomodoros: number;
  taskTitle: string;
}

async function handlePomodoroCompletionNotification(requestBody: PomodoroCompletionRequest) {
  console.log('🍅 [Pomodoro Notification] Handling pomodoro completion');
  
  const { sessionType, completedPomodoros, taskTitle } = requestBody;
  
  // Get OneSignal configuration
  const oneSignalApiKey = await serverApiKeyService.getOneSignalApiKey();
  const appId = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID;
  
  if (!oneSignalApiKey || !appId) {
    console.error('🍅 [Pomodoro Notification] OneSignal not configured');
    return Response.json({ 
      success: false, 
      error: 'OneSignal not configured' 
    }, { status: 500 });
  }
  
  // Create notification content based on session type
  let heading, content;
  
  if (sessionType === 'work') {
    heading = '🍅 Pomodoro Complete!';
    content = `Great focus! You've completed ${completedPomodoros} pomodoro${completedPomodoros > 1 ? 's' : ''} today on "${taskTitle}". Time for a well-deserved break!`;
  } else if (sessionType === 'shortBreak') {
    heading = '☕ Break Complete!';
    content = 'Short break is over! Ready to get back to focused work?';
  } else {
    heading = '🌟 Long Break Complete!';
    content = 'You\'re refreshed and recharged! Time to tackle your goals with renewed energy.';
  }
  
  // Send to all subscribed users (for now - could be filtered by user tags)
  const notificationPayload = {
    app_id: appId,
    included_segments: ['Subscribed Users'],
    headings: { en: heading },
    contents: { en: content },
    data: {
      type: 'pomodoro_completion',
      sessionType,
      completedPomodoros,
      taskTitle
    },
    // Add notification icon and sound
    small_icon: 'ic_stat_onesignal_default',
    large_icon: 'https://goals-ai.app/icon-192.png',
    ios_sound: 'complete_sound.wav',
    android_sound: 'complete_sound'
  };
  
  console.log('🍅 [Pomodoro Notification] Sending notification:', notificationPayload);
  
  // Call OneSignal REST API
  const response = await fetch('https://api.onesignal.com/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Key ${oneSignalApiKey}`
    },
    body: JSON.stringify(notificationPayload)
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    console.error('🍅 [Pomodoro Notification] OneSignal API error:', result);
    return Response.json({ 
      success: false, 
      error: `OneSignal API error: ${response.status}`,
      details: result
    }, { status: response.status });
  }
  
  console.log('🍅 [Pomodoro Notification] Notification sent successfully:', result);
  return Response.json({
    success: true,
    id: result.id,
    recipients: result.recipients
  });
}

export async function POST(request: Request) {
  try {
    console.log('🔔 [OneSignal API] Received POST request');
    
    const requestBody = await request.json();
    console.log('🔔 [OneSignal API] Request body:', requestBody);
    
    // Handle different notification types
    if (requestBody.type === 'pomodoro_completion') {
      return handlePomodoroCompletionNotification(requestBody);
    }
    
    // Handle direct OneSignal API calls (legacy)
    const { 
      app_id, 
      include_subscription_ids, 
      headings, 
      contents, 
      data 
    } = requestBody;
    
    console.log('🔔 [OneSignal API] Direct API Parameters:', { 
      app_id, 
      include_subscription_ids, 
      headings, 
      contents, 
      data 
    });

    if (!app_id || !include_subscription_ids || !headings || !contents) {
      console.error('🔔 [OneSignal API] Missing required parameters');
      return Response.json({ 
        success: false, 
        error: 'Missing required parameters: app_id, include_subscription_ids, headings, contents' 
      }, { status: 400 });
    }

    // Get OneSignal API key from Supabase
    console.log('🔔 [OneSignal API] Fetching OneSignal API key...');
    const oneSignalApiKey = await serverApiKeyService.getOneSignalApiKey();
    
    console.log('🔔 [OneSignal API] API key result:', oneSignalApiKey ? 'KEY_FOUND' : 'KEY_NOT_FOUND');
    console.log('🔔 [OneSignal API] API key length:', oneSignalApiKey?.length || 0);
    
    if (!oneSignalApiKey) {
      console.error('🔔 [OneSignal API] OneSignal API key not available');
      return Response.json({ 
        success: false, 
        error: 'OneSignal API key not configured' 
      }, { status: 500 });
    }
    
    console.log('🔔 [OneSignal API] OneSignal API key obtained successfully');

    // Build notification payload
    const notificationPayload = {
      app_id,
      include_subscription_ids,
      headings,
      contents,
      data: data || {}
    };

    console.log('🔔 [OneSignal API] Sending notification to OneSignal...');
    console.log('🔔 [OneSignal API] Payload:', JSON.stringify(notificationPayload, null, 2));

    // Call OneSignal REST API
    const response = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${oneSignalApiKey}`
      },
      body: JSON.stringify(notificationPayload)
    });
    
    console.log('🔔 [OneSignal API] OneSignal response status:', response.status);
    console.log('🔔 [OneSignal API] OneSignal response headers:', Object.fromEntries(response.headers.entries()));

    const result = await response.json();
    console.log('🔔 [OneSignal API] OneSignal response data:', JSON.stringify(result, null, 2));

    if (!response.ok) {
      console.error('🔔 [OneSignal API] OneSignal API error:', result);
      return Response.json({ 
        success: false, 
        error: `OneSignal API error: ${response.status}`,
        details: result
      }, { status: response.status });
    }

    console.log('🔔 [OneSignal API] Notification sent successfully');
    return Response.json({
      success: true,
      id: result.id,
      recipients: result.recipients,
      external_id: result.external_id
    });

  } catch (error) {
    console.error('🔔 [OneSignal API] Exception:', error);
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }, { status: 500 });
  }
}
