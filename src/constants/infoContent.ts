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
    content: "**Record one item at a time for best results.**\n\n**Tasks:** \"Buy groceries tomorrow\"\n**Goals:** \"Save 10,000 euros\"\n**Milestones:** \"Get first client by March\"\n\n**Link to existing goals:**\nSay the goal name clearly:\n\"This milestone is for my saving 10,000 euros goal\"\n\"Add task to my fitness goal\"\n\n**Tips:**\n• Speak 5-15 seconds\n• Use exact goal names\n• Be specific with dates\n• One item per recording"
  },
  VISION_BOARD: {
    title: "Vision Board",
    content: "Create your visual inspiration board in two ways:\n\n**Upload Images:** Add personal photos from your gallery that represent your dreams and goals.\n\n**Generate with Spark:** Use Spark AI to create custom vision images based on your descriptions.\n\nYour vision board helps you visualize and stay motivated toward achieving your goals."
  }
} as const;

export type InfoContentKey = keyof typeof INFO_CONTENT;
