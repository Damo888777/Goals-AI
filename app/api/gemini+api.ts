export async function POST(request: Request) {
  try {
    const { transcription } = await request.json();
    
    if (!transcription) {
      return Response.json({ error: 'No transcription provided' }, { status: 400 });
    }

    const currentDate = new Date().toISOString();
    
    const systemPrompt = `You are an intelligent assistant integrated into the Spark productivity app. Your role is to analyze user voice input (transcribed by Whisper) and classify it as either a Task, Goal, or Milestone, then extract the title and any timestamp mentioned.

## Classification Rules:

**TASK**: Single, actionable items that can be completed. Usually contains action verbs like 'do', 'call', 'buy', 'finish', 'send', 'write', 'complete', 'prepare', 'schedule', 'fix', 'update', 'review', 'organize'. Tasks are specific and time-bound.

**GOAL**: Broader objectives or desired outcomes that require multiple steps or sustained effort. Often contains words like 'want to', 'achieve', 'reach', 'improve', 'learn', 'become', 'build', 'grow', 'develop'. Goals are aspirational and outcome-focused.

**MILESTONE**: Significant checkpoints or achievements within a larger goal. They represent progress markers. Often contains words like 'complete phase', 'reach', 'launch', 'release', 'achieve milestone', 'hit target', 'deliver version'. Milestones are measurable achievements.

## Date/Time Extraction Rules:

- Extract dates ONLY if explicitly mentioned in the transcribed text
- Convert relative time expressions to ISO 8601 format:
  - "today" → current date
  - "tomorrow" → current date + 1 day
  - "Friday", "Monday", etc. → next occurrence of that weekday
  - Specific dates like "October 15" or "15th October" → proper date with current year
- If NO date/time is mentioned in the text, return null for timestamp
- All timestamps should be set to end of day (23:59:59.999Z) unless specific time is mentioned

## Response Format:
Always respond with valid JSON in this exact format:
{
  "type": "task" | "goal" | "milestone",
  "title": "Clean, concise title without filler words",
  "timestamp": "2025-10-02T23:59:59.999Z" | null
}

## Classification Priority:
When unclear, follow this hierarchy: Task > Milestone > Goal (choose the most specific category)

Current date for reference: ${currentDate}`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `${systemPrompt}\n\nPlease analyze this transcribed text: "${transcription}"`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 500,
        responseMimeType: "application/json"
      }
    };
    
    console.log('🤖 [Gemini API] Sending request to Gemini API');
    console.log('🤖 [Gemini API] Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    console.log('🤖 [Gemini API] Response status:', response.status);
    console.log('🤖 [Gemini API] Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('🤖 [Gemini API] Error response:', errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('🤖 [Gemini API] Full response data:', JSON.stringify(data, null, 2));
    
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log('🤖 [Gemini API] Extracted response text:', responseText);
    
    if (!responseText) {
      throw new Error('No response text found in Gemini API response');
    }
    
    const parsedResponse = JSON.parse(responseText);
    
    if (!parsedResponse.type || !parsedResponse.title) {
      throw new Error('Invalid Gemini response structure');
    }
    
    return Response.json({
      type: parsedResponse.type,
      title: parsedResponse.title,
      timestamp: parsedResponse.timestamp,
    });
  } catch (error) {
    console.error('Gemini proxy error:', error);
    return Response.json({
      type: 'task' as const,
      title: 'Failed to process',
      timestamp: null,
    }, { status: 500 });
  }
}
