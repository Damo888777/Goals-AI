export const INFO_CONTENT = {
  EAT_THE_FROG: {
    title: "Eat the Frog",
    content: "Start your day by tackling your most challenging or important task first. This technique helps you build momentum and ensures your biggest priority gets done when your energy is highest."
  },
  TODAYS_TASKS: {
    title: "Today's Tasks",
    content: "Focus on completing specific tasks scheduled for today. Keep your daily task list manageable and actionable to maintain productivity and avoid overwhelm."
  },
  POMODORO_TECHNIQUE: {
    title: "Pomodoro Technique", 
    content: "Work in focused 25-minute intervals followed by 5-minute breaks. After 4 pomodoros, take a longer 15-30 minute break. This technique helps maintain focus and prevents burnout."
  },
  GOAL_SETTING: {
    title: "Goal Setting",
    content: "Break down large goals into smaller, actionable milestones. Set specific deadlines and regularly review your progress to stay on track and motivated."
  },
  SPARK_AI: {
    title: "Spark AI",
    content: "Speak one item at a time for best results:\n\n**Tasks:** \"Schedule dentist appointment tomorrow\"\n**Goals:** \"Learn Spanish fluently\"\n**Milestones:** \"Complete project proposal by Dec.15.2025\"\n\n**Be specific with timing for tasks and milestones:**\n• \"today\" or \"tomorrow\"\n• \"next week\" or \"in 2 weeks\"\n• Exact dates: \"Jan.20.2025\"\n\nKeep it short and clear - one focused item per recording."
  },
  VISION_BOARD: {
    title: "Vision Board",
    content: "Create your visual inspiration board in two ways:\n\n**Upload Images:** Add personal photos from your gallery that represent your dreams and goals.\n\n**Generate with Spark:** Use Spark AI to create custom vision images based on your descriptions.\n\nYour vision board helps you visualize and stay motivated toward achieving your goals."
  }
} as const;

export type InfoContentKey = keyof typeof INFO_CONTENT;
