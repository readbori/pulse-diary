/**
 * Dexie ↔ Supabase bidirectional sync module.
 *
 * Strategy:
 *   - Push: After each local write, fire-and-forget push to Supabase.
 *   - Pull: On login, fetch all cloud data → upsert into Dexie (cloud wins).
 *   - syncAll: pull → then push any remaining 'local' records.
 *   - Offline: All sync errors are caught & logged — never crash the app.
 */

import { db } from '@/lib/dexie';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type {
  EmotionRecord,
  EmotionType,
  WeeklyReport,
  UserProfile,
  UserSettings,
  StreakData,
} from '@/types';

// ─── Helpers ───

function getAuthUserId(): string | null {
  const raw = localStorage.getItem('pulse_user_id');
  if (!raw || raw === 'demo-user') return null;
  return raw;
}

function canSync(): boolean {
  return isSupabaseConfigured() && getAuthUserId() !== null;
}

// ─── Type adapters: Dexie (camelCase) ↔ Supabase (snake_case) ───

// --- EmotionRecord ---

interface SupabaseEmotionRecord {
  id: string;
  user_id: string;
  created_at: string;
  transcript: string;
  duration: number;
  language: string;
  emotion_primary: string | null;
  emotion_scores: Record<string, number> | null;
  sync_status: string;
}

function recordToSupabase(r: EmotionRecord): SupabaseEmotionRecord {
  return {
    id: r.id,
    user_id: r.userId,
    created_at: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
    transcript: r.transcript,
    duration: r.duration,
    language: r.language,
    emotion_primary: r.emotions?.primary ?? null,
    emotion_scores: r.emotions?.scores ?? null,
    sync_status: 'synced',
  };
}

function recordFromSupabase(s: SupabaseEmotionRecord): EmotionRecord {
  return {
    id: s.id,
    userId: s.user_id,
    createdAt: new Date(s.created_at),
    transcript: s.transcript,
    duration: s.duration,
    language: s.language as 'ko' | 'en',
    emotions: s.emotion_primary
      ? {
          primary: s.emotion_primary as EmotionType,
          scores: (s.emotion_scores ?? {}) as Record<EmotionType, number>,
        }
      : undefined,
    syncStatus: 'synced',
  };
}

// --- WeeklyReport ---

interface SupabaseWeeklyReport {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  record_count: number;
  emotion_summary: Record<string, number> | null;
  content: Record<string, string> | null;
  ai_model: string | null;
  created_at: string;
}

function reportToSupabase(r: WeeklyReport): SupabaseWeeklyReport {
  return {
    id: r.id,
    user_id: r.userId,
    week_start: r.weekStart instanceof Date ? r.weekStart.toISOString() : String(r.weekStart),
    week_end: r.weekEnd instanceof Date ? r.weekEnd.toISOString() : String(r.weekEnd),
    record_count: r.recordCount,
    emotion_summary: r.emotionSummary as Record<string, number>,
    content: r.content as unknown as Record<string, string>,
    ai_model: r.aiModel,
    created_at: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
  };
}

function reportFromSupabase(s: SupabaseWeeklyReport): WeeklyReport {
  const content = (s.content ?? {}) as Record<string, string>;
  return {
    id: s.id,
    userId: s.user_id,
    weekStart: new Date(s.week_start),
    weekEnd: new Date(s.week_end),
    recordCount: s.record_count,
    emotionSummary: (s.emotion_summary ?? {}) as Record<EmotionType, number>,
    content: {
      summary: content.summary ?? '',
      patterns: content.patterns ?? '',
      empathy: content.empathy ?? '',
      positives: content.positives ?? '',
      suggestions: content.suggestions ?? '',
    },
    aiModel: (s.ai_model ?? 'oss-120b') as WeeklyReport['aiModel'],
    createdAt: new Date(s.created_at),
  };
}

// --- UserProfile ---

interface SupabaseUserProfile {
  user_id: string;
  name: string;
  birth_year: number | null;
  occupation: string | null;
  interests: string[] | null;
  mbti: string | null;
  created_at: string;
  updated_at: string;
}

function profileToSupabase(p: UserProfile): SupabaseUserProfile {
  return {
    user_id: p.userId,
    name: p.name,
    birth_year: p.birthYear ?? null,
    occupation: p.occupation ?? null,
    interests: p.interests ?? null,
    mbti: p.mbti ?? null,
    created_at: p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt),
    updated_at: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : String(p.updatedAt),
  };
}

function profileFromSupabase(s: SupabaseUserProfile): UserProfile {
  return {
    userId: s.user_id,
    name: s.name,
    birthYear: s.birth_year ?? undefined,
    occupation: s.occupation ?? undefined,
    interests: s.interests ?? undefined,
    mbti: (s.mbti ?? undefined) as UserProfile['mbti'],
    createdAt: new Date(s.created_at),
    updatedAt: new Date(s.updated_at),
  };
}

// --- UserSettings ---

interface SupabaseUserSettings {
  user_id: string;
  daily_reminder_enabled: boolean | null;
  daily_reminder_time: string | null;
  reminder_interval_days: number | null;
  weekly_report_enabled: boolean | null;
  weekly_report_day: number | null;
  weekly_report_time: string | null;
  report_frequency: string | null;
  max_reports_per_week: number | null;
  auto_delete_audio: boolean | null;
  audio_delete_days: number | null;
  language: string | null;
  theme: string | null;
}

function settingsToSupabase(s: UserSettings): SupabaseUserSettings {
  return {
    user_id: s.userId,
    daily_reminder_enabled: s.dailyReminderEnabled,
    daily_reminder_time: s.dailyReminderTime,
    reminder_interval_days: s.reminderIntervalDays,
    weekly_report_enabled: s.weeklyReportEnabled,
    weekly_report_day: s.weeklyReportDay,
    weekly_report_time: s.weeklyReportTime,
    report_frequency: s.reportFrequency,
    max_reports_per_week: s.maxReportsPerWeek,
    auto_delete_audio: s.autoDeleteAudio,
    audio_delete_days: s.audioDeleteDays,
    language: s.language,
    theme: s.theme,
  };
}

function settingsFromSupabase(s: SupabaseUserSettings): UserSettings {
  return {
    userId: s.user_id,
    dailyReminderEnabled: s.daily_reminder_enabled ?? false,
    dailyReminderTime: s.daily_reminder_time ?? '21:00',
    reminderIntervalDays: s.reminder_interval_days ?? 1,
    weeklyReportEnabled: s.weekly_report_enabled ?? true,
    weeklyReportDay: s.weekly_report_day ?? 0,
    weeklyReportTime: s.weekly_report_time ?? '09:00',
    reportFrequency: (s.report_frequency ?? 'weekly') as UserSettings['reportFrequency'],
    maxReportsPerWeek: s.max_reports_per_week ?? 1,
    autoDeleteAudio: s.auto_delete_audio ?? false,
    audioDeleteDays: s.audio_delete_days ?? 30,
    language: (s.language ?? 'ko') as UserSettings['language'],
    theme: (s.theme ?? 'light') as UserSettings['theme'],
    // Optional integration fields default to undefined
  };
}

// --- StreakData ---

interface SupabaseStreakData {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_record_date: string | null;
  milestones: number[] | null;
}

function streakToSupabase(s: StreakData): SupabaseStreakData {
  return {
    user_id: s.userId,
    current_streak: s.currentStreak,
    longest_streak: s.longestStreak,
    last_record_date: s.lastRecordDate,
    milestones: s.milestones,
  };
}

function streakFromSupabase(s: SupabaseStreakData): StreakData {
  return {
    userId: s.user_id,
    currentStreak: s.current_streak,
    longestStreak: s.longest_streak,
    lastRecordDate: s.last_record_date ?? '',
    milestones: s.milestones ?? [],
  };
}

// ─── Push functions (Local → Cloud) ───

export async function pushRecord(record: EmotionRecord): Promise<void> {
  if (!canSync()) return;
  try {
    const row = recordToSupabase(record);
    const { error } = await supabase.from('emotion_records').upsert(row, { onConflict: 'id' });
    if (error) {
      console.warn('[Sync] pushRecord failed:', error.message);
      return;
    }
    // Mark as synced locally
    await db.records.update(record.id, { syncStatus: 'synced' });
  } catch (err) {
    console.warn('[Sync] pushRecord error:', err);
  }
}

export async function pushReport(report: WeeklyReport): Promise<void> {
  if (!canSync()) return;
  try {
    const row = reportToSupabase(report);
    const { error } = await supabase.from('weekly_reports').upsert(row, { onConflict: 'id' });
    if (error) console.warn('[Sync] pushReport failed:', error.message);
  } catch (err) {
    console.warn('[Sync] pushReport error:', err);
  }
}

export async function pushProfile(profile: UserProfile): Promise<void> {
  if (!canSync()) return;
  try {
    const row = profileToSupabase(profile);
    const { error } = await supabase.from('user_profiles').upsert(row, { onConflict: 'user_id' });
    if (error) console.warn('[Sync] pushProfile failed:', error.message);
  } catch (err) {
    console.warn('[Sync] pushProfile error:', err);
  }
}

export async function pushSettings(settings: UserSettings): Promise<void> {
  if (!canSync()) return;
  try {
    const row = settingsToSupabase(settings);
    const { error } = await supabase.from('user_settings').upsert(row, { onConflict: 'user_id' });
    if (error) console.warn('[Sync] pushSettings failed:', error.message);
  } catch (err) {
    console.warn('[Sync] pushSettings error:', err);
  }
}

export async function pushStreak(streak: StreakData): Promise<void> {
  if (!canSync()) return;
  try {
    const row = streakToSupabase(streak);
    const { error } = await supabase.from('streak_data').upsert(row, { onConflict: 'user_id' });
    if (error) console.warn('[Sync] pushStreak failed:', error.message);
  } catch (err) {
    console.warn('[Sync] pushStreak error:', err);
  }
}

export async function deleteRemoteRecord(recordId: string): Promise<void> {
  if (!canSync()) return;
  try {
    const { error } = await supabase.from('emotion_records').delete().eq('id', recordId);
    if (error) console.warn('[Sync] deleteRemoteRecord failed:', error.message);
  } catch (err) {
    console.warn('[Sync] deleteRemoteRecord error:', err);
  }
}

export async function deleteRemoteReport(reportId: string): Promise<void> {
  if (!canSync()) return;
  try {
    const { error } = await supabase.from('weekly_reports').delete().eq('id', reportId);
    if (error) console.warn('[Sync] deleteRemoteReport failed:', error.message);
  } catch (err) {
    console.warn('[Sync] deleteRemoteReport error:', err);
  }
}

// ─── Pull functions (Cloud → Local) ───

async function pullRecords(userId: string): Promise<void> {
  const { data, error } = await supabase
    .from('emotion_records')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.warn('[Sync] pullRecords failed:', error.message);
    return;
  }

  if (!data || data.length === 0) return;

  const records = (data as SupabaseEmotionRecord[]).map(recordFromSupabase);
  await db.records.bulkPut(records);
  console.log(`[Sync] Pulled ${records.length} records from cloud`);
}

async function pullReports(userId: string): Promise<void> {
  const { data, error } = await supabase
    .from('weekly_reports')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.warn('[Sync] pullReports failed:', error.message);
    return;
  }

  if (!data || data.length === 0) return;

  const reports = (data as SupabaseWeeklyReport[]).map(reportFromSupabase);
  await db.reports.bulkPut(reports);
  console.log(`[Sync] Pulled ${reports.length} reports from cloud`);
}

async function pullProfile(userId: string): Promise<void> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    // PGRST116 = no rows — that's OK
    if (error.code !== 'PGRST116') {
      console.warn('[Sync] pullProfile failed:', error.message);
    }
    return;
  }

  if (data) {
    const profile = profileFromSupabase(data as SupabaseUserProfile);
    await db.profiles.put(profile);
    console.log('[Sync] Pulled profile from cloud');
  }
}

async function pullSettings(userId: string): Promise<void> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.warn('[Sync] pullSettings failed:', error.message);
    }
    return;
  }

  if (data) {
    const settings = settingsFromSupabase(data as SupabaseUserSettings);
    await db.settings.put(settings);
    console.log('[Sync] Pulled settings from cloud');
  }
}

async function pullStreak(userId: string): Promise<void> {
  const { data, error } = await supabase
    .from('streak_data')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.warn('[Sync] pullStreak failed:', error.message);
    }
    return;
  }

  if (data) {
    const streak = streakFromSupabase(data as SupabaseStreakData);
    await db.streaks.put(streak);
    console.log('[Sync] Pulled streak from cloud');
  }
}

// ─── Push pending (local-only records → cloud) ───

async function pushPendingRecords(userId: string): Promise<void> {
  const localRecords = await db.records
    .where('userId')
    .equals(userId)
    .and((r) => r.syncStatus === 'local')
    .toArray();

  if (localRecords.length === 0) return;

  console.log(`[Sync] Pushing ${localRecords.length} pending records to cloud`);

  for (const record of localRecords) {
    await pushRecord(record);
  }
}

async function pushPendingReports(userId: string): Promise<void> {
  const localReports = await db.reports
    .where('userId')
    .equals(userId)
    .toArray();

  if (localReports.length === 0) return;

  console.log(`[Sync] Pushing ${localReports.length} reports to cloud`);

  for (const report of localReports) {
    await pushReport(report);
  }
}

async function pushPendingMeta(userId: string): Promise<void> {
  const [profile, settings, streak] = await Promise.all([
    db.profiles.get(userId),
    db.settings.get(userId),
    db.streaks.get(userId),
  ]);

  if (profile) await pushProfile(profile);
  if (settings) await pushSettings(settings);
  if (streak) await pushStreak(streak);
}

// ─── Full sync (called on login) ───

export async function syncAll(userId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  console.log('[Sync] Starting full sync for user:', userId);

  try {
    // Phase 1: Pull cloud → local (cloud wins)
    await Promise.all([
      pullRecords(userId),
      pullReports(userId),
      pullProfile(userId),
      pullSettings(userId),
      pullStreak(userId),
    ]);

    // Phase 2: Push pending local → cloud
    await Promise.all([
      pushPendingRecords(userId),
      pushPendingReports(userId),
      pushPendingMeta(userId),
    ]);

    console.log('[Sync] Full sync complete');
  } catch (err) {
    console.error('[Sync] Full sync failed:', err);
    // Non-fatal — app continues with local data
  }
}
