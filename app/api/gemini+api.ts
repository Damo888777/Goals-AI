import { serverApiKeyService } from '../../src/services/apiKeyService-server';

export async function POST(request: Request) {
  try {
    const { transcription, existingGoals = [], existingMilestones = [], language = 'en', mode = 'classify' } = await request.json();
    
    if (!transcription) {
      return Response.json({ error: 'No transcription provided' }, { status: 400 });
    }

    // Get Google API key from Supabase Edge Function
    const googleApiKey = await serverApiKeyService.getGoogleApiKey()
    
    if (!googleApiKey) {
      return Response.json(
        { error: 'Google API key not configured' },
        { status: 500 }
      )
    }

    const currentDate = new Date().toISOString();
    
    // Handle goal title optimization mode
    if (mode === 'optimize_goal_title') {
      const getGoalTitlePrompt = (lang: string) => {
        return lang === 'de' ? 
          `Du bist ein Experte für HARD-Zielsetzung (Heartfelt, Animated, Required, Difficult). Wandle diese Vision in einen motivierenden Ziel-Titel um, der sofort zum Handeln inspiriert. Der Titel sollte 3-5 Wörter haben und persönlich bedeutsam sein. Verwende kraftvolle Verben und konkrete Ergebnisse, die emotional berühren. WICHTIG: Antworte IMMER auf Deutsch.` :
          lang === 'fr' ?
          `Tu es un expert en objectifs HARD (Heartfelt, Animated, Required, Difficult). Transforme cette vision en un titre d'objectif motivant qui inspire une action immédiate. Le titre doit contenir 3-5 mots et être personnellement significatif. Utilise des verbes puissants et des résultats concrets qui touchent émotionnellement. IMPORTANT: Réponds TOUJOURS en français.` :
          `You are a HARD goals expert (Heartfelt, Animated, Required, Difficult). Transform this vision into a motivating goal title that instantly inspires action. The title should be 3-5 words and personally meaningful. Use powerful verbs and concrete outcomes that emotionally resonate. IMPORTANT: Always respond in English.`;
      };

      const systemPrompt = `${getGoalTitlePrompt(language)}

## Response Format:
Always respond with valid JSON in this exact format:
{
  "type": "goal",
  "title": "Motivating goal title (3-5 words)"
}

## HARD Goals Framework (UX-Friendly):
- **Heartfelt**: Creates personal emotional connection - "Why does this matter to me?"
- **Animated**: Vivid and energizing - "I can see myself achieving this"
- **Required**: Feels necessary and urgent - "I must do this now"
- **Difficult**: Challenging but achievable - "This will stretch me but is possible"

${language === 'de' ? `## UX-Freundliche Beispiele:
- Vision: "Ich möchte abnehmen und mich selbstbewusst fühlen" → Titel: "Traumkörper Erreichen"
- Vision: "Gitarre lernen und auftreten" → Titel: "Musikstar Werden"
- Vision: "Eigenes Schmuckgeschäft starten" → Titel: "Schmuck-Imperium Erschaffen"
- Vision: "Für mein erstes Haus sparen" → Titel: "Traumhaus Verwirklichen"
- Vision: "Spanisch lernen für meine Herkunft" → Titel: "Spanisch Meistern"
- Vision: "Marathon laufen" → Titel: "Marathon Bezwingen"` :
language === 'fr' ? `## Exemples UX-Conviviaux:
- Vision: "Je veux perdre du poids et me sentir confiant" → Titre: "Transformer Mon Corps"
- Vision: "Apprendre la guitare et jouer" → Titre: "Devenir Musicien Star"
- Vision: "Créer mon entreprise de bijoux" → Titre: "Lancer Empire Bijoux"
- Vision: "Économiser pour ma première maison" → Titre: "Réaliser Maison Rêve"
- Vision: "Apprendre l'espagnol pour mon héritage" → Titre: "Maîtriser Espagnol"
- Vision: "Courir un marathon" → Titre: "Conquérir Marathon"` :
`## UX-Friendly Examples:
- Vision: "I want to lose weight and feel confident" → Title: "Transform My Body"
- Vision: "Learn guitar and perform" → Title: "Become Music Star"
- Vision: "Start my jewelry business" → Title: "Launch Jewelry Empire"
- Vision: "Save for my first house" → Title: "Secure Dream Home"
- Vision: "Learn Spanish for my heritage" → Title: "Master Spanish"
- Vision: "Run a marathon" → Title: "Conquer Marathon"`}

${language === 'de' ? `## UX-Richtlinien:
- Verwende kraftvolle Verben (Erreichen, Werden, Meistern, Erschaffen)
- Mache es persönlich und inspirierend ("Mein Traumkörper", "Musikstar Werden")
- Halte es einfach und einprägsam
- Fokussiere auf das positive Endergebnis
- Vermeide Negativität oder schwache Wörter
- Erstelle Titel die Begeisterung wecken` :
language === 'fr' ? `## Directives UX:
- Utilise des verbes puissants (Réaliser, Devenir, Maîtriser, Créer)
- Rends-le personnel et inspirant ("Mon Corps de Rêve", "Devenir Star")
- Garde-le simple et mémorable
- Concentre-toi sur le résultat positif final
- Évite la négativité ou les mots faibles
- Crée des titres qui suscitent l'enthousiasme` :
`## UX Guidelines:
- Use powerful verbs (Transform, Become, Master, Create)
- Make it personal and inspiring ("My Dream Body", "Become Star")
- Keep it simple and memorable
- Focus on the positive end result
- Avoid negativity or weak words
- Create titles that spark excitement`}`;

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: `${systemPrompt}\n\nPlease optimize this vision into a goal title: "${transcription}"\n\n${language === 'de' ? 'WICHTIG: Der Titel MUSS auf Deutsch sein!' : language === 'fr' ? 'IMPORTANT: Le titre DOIT être en français!' : 'IMPORTANT: The title MUST be in English!'}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.4, // Increased for more creative and emotionally engaging titles
          topP: 0.9,
          topK: 50,
          maxOutputTokens: 200,
          responseMimeType: "application/json"
        }
      };

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${googleApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🤖 [Gemini API] Error response:', errorText);
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!responseText) {
        throw new Error('No response text found in Gemini API response');
      }

      const parsedResponse = JSON.parse(responseText);

      return Response.json({
        type: 'goal',
        title: parsedResponse.title || transcription, // Fallback to original
      });
    }
    
    // Prepare goal/milestone context for AI
    const goalsContext = existingGoals.length > 0 
      ? `\n\nAvailable Goals: ${existingGoals.map((g: any) => `"${g.title}" (ID: ${g.id})`).join(', ')}`
      : '';
    
    const milestonesContext = existingMilestones.length > 0 
      ? `\nAvailable Milestones: ${existingMilestones.map((m: any) => `"${m.title}" (ID: ${m.id})`).join(', ')}`
      : '';
    
    // Create language-specific system prompt
    const getSystemPrompt = (lang: string) => {
      const basePrompt = lang === 'de' ? 
        `Du bist ein intelligenter Assistent, der in die Spark Produktivitäts-App integriert ist. Deine Aufgabe ist es, Benutzereingaben (von Whisper transkribiert) zu analysieren und als Aufgabe, Ziel oder Meilenstein zu klassifizieren, dann den Titel und alle erwähnten Zeitstempel zu extrahieren und bestehende Ziele/Meilensteine zu identifizieren, auf die sich der Benutzer bezieht.` :
        lang === 'fr' ?
        `Tu es un assistant intelligent intégré dans l'application de productivité Spark. Ton rôle est d'analyser les entrées vocales des utilisateurs (transcrites par Whisper) et de les classer comme Tâche, Objectif ou Jalon, puis d'extraire le titre, tout horodatage mentionné, et d'identifier les objectifs/jalons existants auxquels l'utilisateur fait référence.` :
        `You are an intelligent assistant integrated into the Spark productivity app. Your role is to analyze user voice input (transcribed by Whisper) and classify it as either a Task, Goal, or Milestone, then extract the title, any timestamp mentioned, and identify any existing goals/milestones the user is referring to.`;
      
      return basePrompt;
    };
    
    const systemPrompt = `${getSystemPrompt(language)}

## Classification Rules:

**TASK**: Single, actionable items that can be completed. Usually contains action verbs like 'do', 'call', 'buy', 'finish', 'send', 'write', 'complete', 'prepare', 'schedule', 'fix', 'update', 'review', 'organize'. Tasks are specific and time-bound.

**GOAL**: Broader objectives or desired outcomes that require multiple steps or sustained effort. Often contains words like 'want to', 'achieve', 'reach', 'improve', 'learn', 'become', 'build', 'grow', 'develop'. Goals are aspirational and outcome-focused.

**MILESTONE**: Significant checkpoints or achievements within a larger goal. They represent progress markers. Often contains words like 'complete phase', 'reach', 'launch', 'release', 'achieve milestone', 'hit target', 'deliver version'. Milestones are measurable achievements.

## Goal/Milestone Linking Rules:

When the user mentions doing something "for [goal/milestone name]" or refers to an existing goal/milestone, identify the best match from the available options using fuzzy matching. Look for:
- Direct mentions: "for my fitness goal", "for the website project"
- Indirect references: "workout routine" (might link to "Get fit" goal)
- Context clues: "save money" (might link to "Buy a house" goal)

${goalsContext}${milestonesContext}

## Date/Time Extraction Rules:

CRITICAL: Extract the EXACT date mentioned by the user. Do NOT add or subtract days.

- Extract dates ONLY if explicitly mentioned in the transcribed text
- Convert relative time expressions to ISO 8601 format:
  - "today" → current date (${new Date().toISOString().split('T')[0]})
  - "tomorrow" → current date + 1 day
  - "in X days" → current date + X days (e.g., "in 5 days" → current date + 5 days)
  - "Friday", "Monday", etc. → next occurrence of that weekday
  - Specific dates like "October 9", "9th October", "5 December", "December 5th" → EXACT date as mentioned with current year if not specified
  - Full dates like "December 5, 2025" or "05.12.2025" → EXACT date as specified
- IMPORTANT: If user says "9th October", return October 9th, NOT October 10th
- If NO date/time is mentioned in the text, return null for timestamp
- All timestamps should be set to start of day (00:00:00.000Z) unless specific time is mentioned
- For dates in the past (same year), assume next year unless context suggests otherwise

## Response Format:
Always respond with valid JSON in this exact format:
{
  "type": "task" | "goal" | "milestone",
  "title": "Clean, concise title without filler words",
  "timestamp": "2025-10-02T00:00:00.000Z" | null,
  "linkedGoalId": "goal-id-123" | null,
  "linkedMilestoneId": "milestone-id-456" | null
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
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${googleApiKey}`, {
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
      linkedGoalId: parsedResponse.linkedGoalId || null,
      linkedMilestoneId: parsedResponse.linkedMilestoneId || null,
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
