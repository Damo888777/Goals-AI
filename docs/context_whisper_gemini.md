# Spark AI Integration - Context Documentation

## Overview

This document describes the AI integration flow for the Spark productivity app, which captures Tasks, Goals, and Milestones via voice input using a two-stage AI processing pipeline.

## Environment Configuration

The following API keys are required and should be stored in your `.env` file:

```env
OPEN_AI_KEY=your_openai_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
```

Both keys are already properly configured in the environment.

## Tech Stack

- **Frontend Framework**: React Native with TypeScript (Expo)
- **Speech-to-Text**: OpenAI Whisper API
- **Natural Language Processing**: Google Gemini 2.5 Flash Preview (Latest)

## AI Processing Flow: The Two-Stage Pipeline

The AI integration works as a **two-stage pipeline**, where each AI model has a specific, focused responsibility:

### Stage 1: The Ear (OpenAI Whisper)

**Responsibility**: Listen and transcribe

**Input**: 
- Raw audio file from the user's voice recording

**Process**: 
- Whisper analyzes only the audio signal and converts it into plain text
- It is a specialized transcription expert that focuses solely on accurate speech recognition
- Whisper has NO knowledge of tasks, goals, dates, or app context

**Output**: 
- A simple text string (e.g., "I need to finish the presentation for Project Alpha by tomorrow")

**Key Point**: Whisper is the secretary who takes dictation - nothing more.

---

### Stage 2: The Brain (Google Gemini 2.5 Flash Preview)

**Responsibility**: Understand, analyze, and structure

**Input**: 
- The transcribed text string from Whisper
- Context: current date (for relative date calculations)

**Process**: 
Gemini applies intelligent analysis using the system prompt rules:

1. **Classification** - Determines if the input is a Task, Goal, or Milestone
2. **Title Extraction** - Extracts and cleans the main content (removes filler words)
3. **Date Recognition** - Identifies and converts temporal expressions to ISO 8601 format
   - "tomorrow" → calculates next day
   - "Friday" → finds next occurrence
   - "October 15" → formats as proper date

**Output**: 
- A structured JSON object with three fields:
  ```json
  {
    "type": "task" | "goal" | "milestone",
    "title": "Clean, concise title",
    "timestamp": "2025-10-02T23:59:59.999Z" or null
  }
  ```

**Key Point**: Gemini is the project manager who reads the dictation and creates a clean, actionable entry in the system.

---

## Classification Logic

### TASK
Single, actionable items that can be completed in one sitting or action.

**Indicators**: Action verbs (call, buy, finish, send, write, complete, prepare)

**Examples**:
- "Call the dentist tomorrow"
- "Buy groceries"
- "Send email to team"

### GOAL
Broader objectives requiring multiple steps or sustained effort over time.

**Indicators**: Aspirational words (want to, achieve, improve, learn, build, grow)

**Examples**:
- "Learn Spanish this year"
- "Improve my fitness"
- "Build a side business"

### MILESTONE
Significant checkpoints or achievements that mark progress toward a larger goal.

**Indicators**: Progress markers (complete phase, launch, reach, deliver, hit target)

**Examples**:
- "Launch the beta version"
- "Complete Phase 1"
- "Reach 1000 subscribers"

### Ambiguity Resolution
When the classification is unclear, Gemini follows this hierarchy:
**Task > Milestone > Goal** (choose the most specific category)

---

## Date/Time Handling

Gemini extracts timestamps ONLY when explicitly mentioned in the transcribed text:

| User Says | Gemini Interprets |
|-----------|-------------------|
| "tomorrow" | Current date + 1 day |
| "today" | Current date |
| "Friday" | Next occurrence of Friday |
| "October 15" | 2025-10-15T23:59:59.999Z |
| No date mentioned | `null` |

All timestamps are returned in ISO 8601 format for consistent parsing.

---

## Integration Flow Summary

```
User Voice Input (Audio)
        ↓
    Whisper API
        ↓
    Text String
        ↓
    Gemini API (+ Current Date Context)
        ↓
    Structured JSON
        ↓
React Native App State (Pre-filled Form)
```

The app receives the JSON response and automatically:
1. Routes to the appropriate screen (Task/Goal/Milestone)
2. Pre-fills the title field
3. Pre-selects the date (if available)
4. Allows the user to review and save

---

## API Configuration

### Whisper Configuration
- Model: `whisper-1`
- Language: Auto-detect or specify
- Response format: `text` or `json`

### Gemini Configuration
```json
{
  "temperature": 0.3,
  "topP": 0.8,
  "topK": 40,
  "maxOutputTokens": 500,
  "responseMimeType": "application/json"
}
```

Low temperature (0.3) ensures consistent, predictable classifications.

---

## Error Handling Considerations

1. **Whisper fails to transcribe**: Show error, allow user to retry recording
2. **Gemini returns invalid JSON**: Catch parsing error, use fallback (default to "task", no timestamp)
3. **Network errors**: Implement retry logic with exponential backoff
4. **Empty transcription**: Prompt user to speak more clearly or try again

---

## Best Practices

1. **Always pass current date** to Gemini for accurate relative date calculations
2. **Validate JSON structure** before using the response in your app
3. **Provide user feedback** during both processing stages (transcribing... analyzing...)
4. **Allow manual override** - User can always change the classification or date after AI suggestion
5. **Log failures** for debugging and improving prompt over time

---

## Future Enhancements

- Support for recurring tasks (daily, weekly, monthly)
- Context awareness (link tasks to existing goals automatically)
- Multi-language support
- Priority detection from voice tone or keywords
- Integration with calendar APIs for smart scheduling

---
