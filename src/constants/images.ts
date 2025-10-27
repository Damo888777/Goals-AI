// Image URLs from Figma Design
export const images = {
  icons: {
    frog: require('../../assets/frog.png'),
    tomato: require('../../assets/tomato.png'),
    notes: require('../../assets/TodaysTask.png'),
    sparkFab: require('../../assets/Spark_FAB.png'),
    sparkle: require('../../assets/sparkle.png'),
    // Microphone icon from Figma (icon/Microphone)
    microphone: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDEuNUM5Ljc5IDEuNSA4IDMuMjkgOCA1LjVWMTEuNUM4IDEzLjcxIDkuNzkgMTUuNSAxMiAxNS41QzE0LjIxIDE1LjUgMTYgMTMuNzEgMTYgMTEuNVY1LjVDMTYgMy4yOSAxNC4yMSAxLjUgMTIgMS41WiIgZmlsbD0iY3VycmVudENvbG9yIi8+CjxwYXRoIGQ9Ik0xOSAxMC41VjExLjVDMTkgMTUuMzYgMTUuODYgMTguNSAxMiAxOC41QzguMTQgMTguNSA1IDE1LjM2IDUgMTEuNVYxMC41SDNWMTEuNUMzIDE2LjQ3IDYuODEgMjAuNSAxMS41IDIwLjk0VjIzSDEyLjVWMjAuOTRDMTcuMTkgMjAuNSAyMSAxNi40NyAyMSAxMS41VjEwLjVIMTlaIiBmaWxsPSJjdXJyZW50Q29sb3IiLz4KPC9zdmc+',
    // SparkAI icon from assets
    sparkAI: require('../../assets/SparkAI_Dark.png'),
    // SparkAI Light icon for microphone button
    sparkAILight: require('../../assets/SparkAI_Light.png'),
    trophy: require('../../assets/trophy.png'),
    createVision: require('../../assets/Vision.png'),
    uploadVision: require('../../assets/Vision.png'),
  },
  tabIcons: {
    today: require('../../assets/today_tab.png'),
    goals: require('../../assets/goal_tab.png'),
    plan: require('../../assets/plan_tab.png'),
    profile: require('../../assets/profile_tab.png'),
  },
  visionPlaceholder: 'https://www.figma.com/api/mcp/asset/a7d59cac-d4f3-47ed-8bbc-c1a3c7c9e8cc',
} as const;
