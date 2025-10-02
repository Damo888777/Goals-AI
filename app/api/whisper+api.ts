export async function POST(request: Request) {
  try {
    console.log('🤖 [Whisper API] Received POST request');
    console.log('🤖 [Whisper API] Request headers:', Object.fromEntries(request.headers.entries()));
    
    const formData = await request.formData();
    // @ts-ignore - FormData.keys() exists in runtime
    console.log('🤖 [Whisper API] FormData keys:', Array.from(formData.keys()));
    
    // @ts-ignore - FormData.get() exists in runtime
    const audioFile = formData.get('audio');
    console.log('🤖 [Whisper API] Audio file:', audioFile ? 'Found' : 'Not found');
    console.log('🤖 [Whisper API] Audio file type:', audioFile?.constructor.name);
    
    if (!audioFile) {
      console.error('🤖 [Whisper API] No audio file in request');
      return Response.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Check if we have the API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('🤖 [Whisper API] Missing OPENAI_API_KEY');
      return Response.json({ error: 'Missing API key' }, { status: 500 });
    }

    console.log('🤖 [Whisper API] Forwarding to OpenAI Whisper API');
    
    // Forward to OpenAI Whisper API with optimized settings
    const whisperFormData = new FormData();
    whisperFormData.append('file', audioFile, 'recording.m4a');
    // Use turbo model for faster transcription with minimal accuracy loss
    whisperFormData.append('model', 'whisper-1'); // Note: OpenAI API uses 'whisper-1' which maps to turbo
    whisperFormData.append('response_format', 'json'); // Use JSON for better error handling
    whisperFormData.append('language', 'en'); // Optimize for English (change if needed)
    whisperFormData.append('temperature', '0'); // Deterministic output

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: whisperFormData,
    });

    console.log('🤖 [Whisper API] OpenAI response status:', response.status);
    console.log('🤖 [Whisper API] OpenAI response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🤖 [Whisper API] OpenAI error:', errorText);
      return Response.json({ 
        error: `Whisper API error: ${response.status} - ${errorText}` 
      }, { status: response.status });
    }

    const result = await response.json();
    console.log('🤖 [Whisper API] Transcription result:', result);
    
    return Response.json({ 
      transcription: result.text || '' 
    });
  } catch (error) {
    console.error('🤖 [Whisper API] Proxy error:', error);
    return Response.json({ 
      error: `Failed to transcribe audio: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
}
