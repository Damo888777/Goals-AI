import { serverApiKeyService } from '../../src/services/apiKeyService-server';

export async function GET(request: Request) {
  try {
    console.log('🔍 [Test Keys API] Testing API key retrieval...');
    
    // Test all API keys
    const openaiKey = await serverApiKeyService.getOpenAIApiKey();
    const googleKey = await serverApiKeyService.getGoogleApiKey();
    const onesignalKey = await serverApiKeyService.getOneSignalApiKey();
    
    const results = {
      openai: {
        configured: !!openaiKey,
        length: openaiKey?.length || 0
      },
      google: {
        configured: !!googleKey,
        length: googleKey?.length || 0
      },
      onesignal: {
        configured: !!onesignalKey,
        length: onesignalKey?.length || 0
      }
    };
    
    console.log('🔍 [Test Keys API] Results:', results);
    
    return Response.json({
      success: true,
      keys: results,
      message: 'API key configuration test completed'
    });

  } catch (error) {
    console.error('🔍 [Test Keys API] Exception:', error);
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }, { status: 500 });
  }
}
