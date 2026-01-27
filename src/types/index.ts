export type EmotionType = 'joy' | 'sadness' | 'anger' | 'fear' | 'surprise' | 'neutral';

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
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSettings {
  userId: string;
  // 알림 설정
  dailyReminderEnabled: boolean;
  dailyReminderTime: string; // "HH:mm"
  reminderIntervalDays: number; // 1 = 매일, 2 = 격일
  // 주간 리포트
  weeklyReportEnabled: boolean;
  weeklyReportDay: number; // 0-6 (일-토)
  weeklyReportTime: string;
  // 데이터 관리
  autoDeleteAudio: boolean;
  audioDeleteDays: number;
  // 외부 연동 (향후)
  notionIntegration?: { enabled: boolean; databaseId?: string };
  googleCalendarIntegration?: { enabled: boolean; calendarId?: string };
  // 기타
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
