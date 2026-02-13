import Dexie, { type Table } from 'dexie';
import type { EmotionRecord, WeeklyReport, UserSettings, StreakData, UserProfile } from '@/types';

class PulseDiaryDB extends Dexie {
  records!: Table<EmotionRecord>;
  reports!: Table<WeeklyReport>;
  settings!: Table<UserSettings>;
  streaks!: Table<StreakData>;
  profiles!: Table<UserProfile>;

  constructor() {
    super('pulsediary');
    
    this.version(1).stores({
      records: 'id, userId, createdAt',
      reports: 'id, userId, weekStart',
      settings: 'userId',
      streaks: 'userId',
      profiles: 'userId'
    });
  }
}

export const db = new PulseDiaryDB();
