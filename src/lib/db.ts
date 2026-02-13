import { db } from '@/lib/dexie';
import {
  pushRecord,
  pushReport,
  pushProfile,
  pushSettings,
  pushStreak,
  deleteRemoteRecord,
  deleteRemoteReport,
} from '@/lib/sync';
import type { EmotionRecord, WeeklyReport, UserSettings, StreakData, UserProfile } from '@/types';

export { db };

export async function saveRecord(record: Omit<EmotionRecord, 'id'>): Promise<string> {
  const id = crypto.randomUUID();
  const full: EmotionRecord = { ...record, id };
  await db.records.add(full);
  // Fire-and-forget cloud sync
  pushRecord(full).catch(() => {});
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
  const full: WeeklyReport = { ...report, id };
  await db.reports.add(full);
  pushReport(full).catch(() => {});
  return id;
}

export async function getReports(userId: string): Promise<WeeklyReport[]> {
  return await db.reports
    .where('userId')
    .equals(userId)
    .reverse()
    .sortBy('createdAt');
}

export async function deleteReport(reportId: string): Promise<void> {
  await db.reports.delete(reportId);
  deleteRemoteReport(reportId).catch(() => {});
}

export async function getSettings(userId: string): Promise<UserSettings | undefined> {
  return await db.settings.get(userId);
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  await db.settings.put(settings);
  pushSettings(settings).catch(() => {});
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
    pushStreak(newStreak).catch(() => {});
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
  pushStreak(streak).catch(() => {});
  return streak;
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await db.profiles.put(profile);
  pushProfile(profile).catch(() => {});
}

export async function getProfile(userId: string): Promise<UserProfile | undefined> {
  return await db.profiles.get(userId);
}

export async function updateRecord(record: EmotionRecord): Promise<void> {
  await db.records.put(record);
  pushRecord(record).catch(() => {});
}

export async function deleteRecord(id: string): Promise<void> {
  await db.records.delete(id);
  deleteRemoteRecord(id).catch(() => {});
}

/** 로컬 유저 → Google 연동 시 모든 데이터의 userId를 마이그레이션 */
export async function migrateUserData(oldUserId: string, newUserId: string): Promise<void> {
  if (oldUserId === newUserId) return;

  await db.transaction('rw', [db.records, db.reports, db.settings, db.streaks, db.profiles], async () => {
    // 감정 기록 마이그레이션
    const records = await db.records.where('userId').equals(oldUserId).toArray();
    for (const record of records) {
      await db.records.update(record.id, { userId: newUserId });
    }

    // 리포트 마이그레이션
    const reports = await db.reports.where('userId').equals(oldUserId).toArray();
    for (const report of reports) {
      await db.reports.update(report.id, { userId: newUserId });
    }

    // 프로필 마이그레이션 (PK = userId이므로 delete + put)
    const profile = await db.profiles.get(oldUserId);
    if (profile) {
      await db.profiles.delete(oldUserId);
      await db.profiles.put({ ...profile, userId: newUserId, updatedAt: new Date() });
    }

    // 설정 마이그레이션
    const settings = await db.settings.get(oldUserId);
    if (settings) {
      await db.settings.delete(oldUserId);
      await db.settings.put({ ...settings, userId: newUserId });
    }

    // 스트릭 마이그레이션
    const streak = await db.streaks.get(oldUserId);
    if (streak) {
      await db.streaks.delete(oldUserId);
      await db.streaks.put({ ...streak, userId: newUserId });
    }
  });

  console.log(`[DB] Migrated ${oldUserId} → ${newUserId}`);
}
