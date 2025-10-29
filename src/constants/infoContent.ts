import { useTranslation } from 'react-i18next';

export const getInfoContent = (t: ReturnType<typeof useTranslation>['t']) => ({
  EAT_THE_FROG: {
    title: t('infoContent.eatTheFrog.title'),
    content: t('infoContent.eatTheFrog.content')
  },
  TODAYS_TASKS: {
    title: t('infoContent.todaysTasks.title'),
    content: t('infoContent.todaysTasks.content')
  },
  POMODORO_TECHNIQUE: {
    title: t('infoContent.pomodoroTechnique.title'),
    content: t('infoContent.pomodoroTechnique.content')
  },
  GOAL_SETTING: {
    title: t('infoContent.goalSetting.title'),
    content: t('infoContent.goalSetting.content')
  },
  SPARK_AI: {
    title: t('infoContent.sparkAI.title'),
    content: t('infoContent.sparkAI.content')
  },
  VISION_BOARD: {
    title: t('infoContent.visionBoard.title'),
    content: t('infoContent.visionBoard.content')
  }
} as const);

export type InfoContentKey = keyof ReturnType<typeof getInfoContent>;
