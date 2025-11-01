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
          `Du bist ein Experte für HARD-Zielsetzung (Heartfelt, Animated, Required, Difficult). Wandle die folgende Vision in einen kraftvollen Ziel-Titel um, der emotional ansprechend, lebendig, dringend notwendig und herausfordernd ist. Der Titel sollte maximal 5 Wörter haben und eine starke emotionale Verbindung schaffen. Verwende kraftvolle Verben und konkrete Ergebnisse. WICHTIG: Antworte IMMER auf Deutsch, egal in welcher Sprache die Vision geschrieben ist.` :
          lang === 'fr' ?
          `Tu es un expert en objectifs HARD (Heartfelt, Animated, Required, Difficult). Transforme cette vision en un titre d'objectif puissant qui soit émotionnellement engageant, vivant, urgent et difficile. Le titre doit contenir maximum 5 mots et créer une forte connexion émotionnelle. Utilise des verbes puissants et des résultats concrets. IMPORTANT: Réponds TOUJOURS en français, peu importe la langue dans laquelle la vision est écrite.` :
          `You are a HARD goals expert (Heartfelt, Animated, Required, Difficult). Transform this vision into a powerful goal title that is emotionally engaging, vivid, urgently necessary, and challenging. The title should be maximum 5 words and create strong emotional connection. Use powerful verbs and concrete outcomes. IMPORTANT: Always respond in English, regardless of what language the vision is written in.`;
      };

      const systemPrompt = `${getGoalTitlePrompt(language)}

## Response Format:
Always respond with valid JSON in this exact format:
{
  "type": "goal",
  "title": "Concise goal title (max 5 words)"
}

## HARD Goals Framework:
- **Heartfelt**: Emotionally meaningful and personally significant
- **Animated**: Vivid, specific, and energizing
- **Required**: Urgent necessity, not just a nice-to-have
- **Difficult**: Challenging enough to push boundaries

${language === 'de' ? `## Beispiele:
- Vision: "Ich möchte 20 Pfund abnehmen und mich selbstbewusst fühlen" → Titel: "Körper Transformieren Selbstvertrauen Gewinnen"
- Vision: "Gitarre lernen und in lokalen Venues auftreten" → Titel: "Gitarre Meistern Publikum Begeistern"
- Vision: "Eigenes Schmuckgeschäft online starten" → Titel: "Schmuck-Imperium Online Aufbauen"
- Vision: "Geld sparen für mein erstes Haus" → Titel: "Traumhaus Sichern Eigenheim Erreichen"
- Vision: "Spanisch lernen um meine Herkunft zu verstehen" → Titel: "Spanisch Meistern Herkunft Umarmen"
- Vision: "Marathon laufen um zu beweisen dass ich alles schaffe" → Titel: "Marathon Erobern Unaufhaltsamkeit Beweisen"` :
language === 'fr' ? `## Exemples:
- Vision: "Je veux perdre 20 kilos et me sentir confiant" → Titre: "Transformer Corps Retrouver Confiance"
- Vision: "Apprendre la guitare et jouer dans des lieux locaux" → Titre: "Maîtriser Guitare Captiver Audiences"
- Vision: "Créer mon entreprise de bijoux faits main en ligne" → Titre: "Lancer Empire Bijoux Ligne"
- Vision: "Économiser pour acheter ma première maison" → Titre: "Sécuriser Maison Rêve Propriété"
- Vision: "Apprendre l'espagnol pour me connecter à mon héritage" → Titre: "Maîtriser Espagnol Embrasser Héritage"
- Vision: "Courir un marathon pour prouver que je peux tout faire" → Titre: "Conquérir Marathon Prouver Invincibilité"` :
`## Examples:
- Vision: "I want to lose 20 pounds by summer and feel confident in my body" → Title: "Transform Body Reclaim Confidence"
- Vision: "Learn to play guitar and perform at local venues" → Title: "Master Guitar Captivate Audiences"
- Vision: "Start my own business selling handmade jewelry online" → Title: "Launch Jewelry Empire Online"
- Vision: "Save money to buy my first house" → Title: "Secure Dream Home Ownership"
- Vision: "Learn Spanish to connect with my heritage" → Title: "Master Spanish Embrace Heritage"
- Vision: "Run a marathon to prove I can do anything" → Title: "Conquer Marathon Prove Unstoppable"`}

${language === 'de' ? `## Richtlinien:
- Verwende kraftvolle Aktionsverben (Transformieren, Meistern, Starten, Erobern, Erreichen, Aufbauen, Erschaffen)
- Fokussiere auf emotionale Ergebnisse oder Transformation
- Mache es dringend und notwendig
- Stelle sicher, dass es herausfordernd aber erreichbar ist
- Vermeide schwache Wörter wie "versuchen", "vielleicht", "hoffen"
- Erstelle Titel die zu sofortigem Handeln inspirieren` :
language === 'fr' ? `## Directives:
- Utilise des verbes d'action puissants (Transformer, Maîtriser, Lancer, Conquérir, Atteindre, Construire, Créer)
- Concentre-toi sur le résultat émotionnel ou la transformation
- Rends-le urgent et nécessaire
- Assure-toi que c'est difficile mais réalisable
- Évite les mots faibles comme "essayer", "peut-être", "espérer"
- Crée des titres qui inspirent une action immédiate` :
`## Guidelines:
- Use powerful action verbs (Transform, Master, Launch, Conquer, Achieve, Build, Create)
- Focus on the emotional outcome or transformation
- Make it feel urgent and necessary
- Ensure it's challenging but achievable
- Avoid weak words like "try", "maybe", "hope"
- Create titles that inspire immediate action`}`;

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
