import { serverApiKeyService } from '../../src/services/apiKeyService-server';

export async function POST(request: Request) {
  try {
    console.log('🔔 [OneSignal API] Received POST request');
    
    const { 
      app_id, 
      include_subscription_ids, 
      headings, 
      contents, 
      data 
    } = await request.json();
    
    console.log('🔔 [OneSignal API] Parameters:', { 
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
