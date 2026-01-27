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

export async function saveRecord(record: Omit<EmotionRecord, 'id'>): Promise<string> {
  const id = crypto.randomUUID();
  await db.records.add({ ...record, id });
  return id;
}

export async function getRecordsByDateRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<EmotionRecord[]> {
  return await db.records
    .where('userId')
    .equals(userId)
    .and(r => r.createdAt >= startDate && r.createdAt <= endDate)
    .toArray();
}

export async function getWeekRecords(userId: string): Promise<EmotionRecord[]> {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  
  return await db.records
    .where('userId')
    .equals(userId)
    .and(r => r.createdAt >= weekStart)
    .toArray();
}

export async function getAllRecords(userId: string): Promise<EmotionRecord[]> {
  return await db.records
    .where('userId')
    .equals(userId)
    .reverse()
    .sortBy('createdAt');
}

export async function saveReport(report: Omit<WeeklyReport, 'id'>): Promise<string> {
  const id = crypto.randomUUID();
  await db.reports.add({ ...report, id });
  return id;
}

export async function getReports(userId: string): Promise<WeeklyReport[]> {
  return await db.reports
    .where('userId')
    .equals(userId)
    .reverse()
    .sortBy('createdAt');
}

export async function getSettings(userId: string): Promise<UserSettings | undefined> {
  return await db.settings.get(userId);
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  await db.settings.put(settings);
}

export async function getStreak(userId: string): Promise<StreakData | undefined> {
  return await db.streaks.get(userId);
}

export async function updateStreak(userId: string): Promise<StreakData> {
  const streak = await db.streaks.get(userId);
  const today = new Date().toISOString().split('T')[0];
  
  if (!streak) {
    const newStreak: StreakData = {
      userId,
      currentStreak: 1,
      longestStreak: 1,
      lastRecordDate: today,
      milestones: []
    };
    await db.streaks.add(newStreak);
    return newStreak;
  }
  
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  
  if (streak.lastRecordDate === today) {
    return streak;
  }
  
  if (streak.lastRecordDate === yesterday) {
    streak.currentStreak += 1;
    streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
  } else {
    streak.currentStreak = 1;
  }
  
  streak.lastRecordDate = today;
  
  const milestones = [7, 14, 30, 50, 100, 365];
  if (milestones.includes(streak.currentStreak) && !streak.milestones.includes(streak.currentStreak)) {
    streak.milestones.push(streak.currentStreak);
  }
  
  await db.streaks.put(streak);
  return streak;
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await db.profiles.put(profile);
}

export async function getProfile(userId: string): Promise<UserProfile | undefined> {
  return await db.profiles.get(userId);
}

export async function updateRecord(record: EmotionRecord): Promise<void> {
  await db.records.put(record);
}

export async function deleteRecord(id: string): Promise<void> {
  await db.records.delete(id);
}
