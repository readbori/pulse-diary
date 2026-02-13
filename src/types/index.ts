export type EmotionType =
  // 긍정 감정
  | 'happiness'    // 행복
  | 'gratitude'    // 감사
  | 'excitement'   // 설렘
  | 'calm'         // 평온
  | 'hope'         // 희망
  | 'pride'        // 자부심
  // 부정 감정
  | 'sadness'      // 슬픔
  | 'loneliness'   // 외로움
  | 'anger'        // 분노
  | 'irritation'   // 짜증
  | 'anxiety'      // 불안
  | 'fear'         // 공포
  | 'shame'        // 부끄러움
  | 'disgust'      // 혐오
  // 중립/복합 감정
  | 'surprise'     // 놀람
  | 'confusion'    // 혼란
  | 'boredom'      // 지루함
  | 'nostalgia';   // 그리움

/** 기존 6감정 → 신규 18감정 매핑 (하위 호환용) */
export const LEGACY_EMOTION_MAP: Record<string, EmotionType> = {
  joy: 'happiness',
  neutral: 'calm',
};

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
    quote?: string;
  };
  aiModel: 'haiku' | 'sonnet' | 'gpt-4o-mini' | 'oss-120b';
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
