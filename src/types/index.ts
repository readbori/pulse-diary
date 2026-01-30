export type EmotionType = 'joy' | 'sadness' | 'anger' | 'fear' | 'surprise' | 'neutral';

export type MBTIType = 
  | 'INTJ' | 'INTP' | 'ENTJ' | 'ENTP'
  | 'INFJ' | 'INFP' | 'ENFJ' | 'ENFP'
  | 'ISTJ' | 'ISFJ' | 'ESTJ' | 'ESFJ'
  | 'ISTP' | 'ISFP' | 'ESTP' | 'ESFP';

export interface EmotionRecord {
  id: string;
  userId: string;
  createdAt: Date;
  audioBlob?: Blob;
  transcript: string;
  duration: number;
  language: 'ko' | 'en';
  emotions?: {
    primary: EmotionType;
    scores: Record<EmotionType, number>;
  };
  syncStatus: 'local' | 'synced';
}

export interface WeeklyReport {
  id: string;
  userId: string;
  weekStart: Date;
  weekEnd: Date;
  recordCount: number;
  emotionSummary: Record<EmotionType, number>;
  content: {
    summary: string;
    patterns: string;
    empathy: string;
    positives: string;
    suggestions: string;
  };
  aiModel: 'haiku' | 'sonnet';
  createdAt: Date;
}

export interface UserProfile {
  userId: string;
  name: string;
  birthYear?: number;
  occupation?: string;
  interests?: string[];
  mbti?: MBTIType;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSettings {
  userId: string;
  dailyReminderEnabled: boolean;
  dailyReminderTime: string;
  reminderIntervalDays: number;
  weeklyReportEnabled: boolean;
  weeklyReportDay: number;
  weeklyReportTime: string;
  reportFrequency: 'daily' | 'weekly' | 'monthly';
  maxReportsPerWeek: number;
  autoDeleteAudio: boolean;
  audioDeleteDays: number;
  notionIntegration?: { enabled: boolean; databaseId?: string };
  googleCalendarIntegration?: { enabled: boolean; calendarId?: string };
  language: 'ko' | 'en';
  theme: 'light' | 'dark' | 'system';
}

export interface StreakData {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastRecordDate: string;
  milestones: number[];
}

export interface User {
  id: string;
  email: string;
  name?: string;
  tier: 'free' | 'advanced' | 'premium';
  createdAt: Date;
}
