import { db } from '@/lib/db';
import type { EmotionRecord, StreakData, UserProfile, UserSettings, WeeklyReport } from '@/types';

interface SerializedRecord extends Omit<EmotionRecord, 'createdAt' | 'audioBlob'> {
  createdAt: string;
  audioBlobBase64?: string;
}

interface SerializedReport extends Omit<WeeklyReport, 'weekStart' | 'weekEnd' | 'createdAt'> {
  weekStart: string;
  weekEnd: string;
  createdAt: string;
}

interface BackupData {
  version: 1;
  exportedAt: string;
  appVersion: string;
  data: {
    records: SerializedRecord[];
    reports: SerializedReport[];
    settings: UserSettings[];
    streaks: StreakData[];
    profiles: UserProfile[];
  };
}

interface ImportResult {
  records: number;
  reports: number;
}

const APP_VERSION = '1.0.0';

export async function blobToBase64(blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('오디오 데이터를 인코딩하지 못했습니다.'));
        return;
      }

      const base64Part = result.split(',')[1];
      if (!base64Part) {
        reject(new Error('오디오 데이터 포맷이 올바르지 않습니다.'));
        return;
      }

      resolve(base64Part);
    };
    reader.onerror = () => reject(new Error('오디오 데이터를 읽는 중 오류가 발생했습니다.'));
    reader.readAsDataURL(blob);
  });
}

export function base64ToBlob(base64: string): Blob {
  const normalizedBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
  const binaryString = atob(normalizedBase64);
  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i += 1) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return new Blob([bytes]);
}

export async function exportBackup(userId: string): Promise<void> {
  const [records, reports, settings, streak, profile] = await Promise.all([
    db.records.where('userId').equals(userId).toArray(),
    db.reports.where('userId').equals(userId).toArray(),
    db.settings.get(userId),
    db.streaks.get(userId),
    db.profiles.get(userId),
  ]);

  const serializedRecords = await Promise.all(
    records.map(async (record) => ({
      ...record,
      createdAt: record.createdAt.toISOString(),
      audioBlobBase64: record.audioBlob ? await blobToBase64(record.audioBlob) : undefined,
      audioBlob: undefined,
    }))
  );

  const serializedReports = reports.map((report) => ({
    ...report,
    weekStart: report.weekStart.toISOString(),
    weekEnd: report.weekEnd.toISOString(),
    createdAt: report.createdAt.toISOString(),
  }));

  const backupData: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    data: {
      records: serializedRecords,
      reports: serializedReports,
      settings: settings ? [settings] : [],
      streaks: streak ? [streak] : [],
      profiles: profile ? [profile] : [],
    },
  };

  const backupBlob = new Blob([JSON.stringify(backupData, null, 2)], {
    type: 'application/json',
  });
  const backupUrl = URL.createObjectURL(backupBlob);
  const dateString = new Date().toISOString().split('T')[0];
  const filename = `pulse-diary-backup-${dateString}.json`;

  const link = document.createElement('a');
  link.href = backupUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(backupUrl);
}

function isValidBackupData(value: unknown): value is BackupData {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<BackupData>;
  const data = candidate.data as BackupData['data'] | undefined;

  return (
    candidate.version === 1
    && typeof candidate.exportedAt === 'string'
    && typeof candidate.appVersion === 'string'
    && !!data
    && Array.isArray(data.records)
    && Array.isArray(data.reports)
    && Array.isArray(data.settings)
    && Array.isArray(data.streaks)
    && Array.isArray(data.profiles)
  );
}

export async function importBackup(file: File): Promise<ImportResult> {
  const fileText = await file.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(fileText);
  } catch {
    throw new Error('백업 파일을 읽을 수 없습니다. JSON 형식인지 확인해주세요.');
  }

  if (!isValidBackupData(parsed)) {
    throw new Error('올바른 Pulse Diary 백업 파일 형식이 아닙니다.');
  }

  const { data } = parsed;

  const recordsToImport: EmotionRecord[] = data.records.map((record) => ({
    ...record,
    createdAt: new Date(record.createdAt),
    audioBlob: record.audioBlobBase64 ? base64ToBlob(record.audioBlobBase64) : undefined,
  }));

  const reportsToImport: WeeklyReport[] = data.reports.map((report) => ({
    ...report,
    weekStart: new Date(report.weekStart),
    weekEnd: new Date(report.weekEnd),
    createdAt: new Date(report.createdAt),
  }));

  if (recordsToImport.some((record) => Number.isNaN(record.createdAt.getTime()))) {
    throw new Error('백업 파일의 기록 날짜 데이터가 올바르지 않습니다.');
  }

  if (
    reportsToImport.some((report) => (
      Number.isNaN(report.weekStart.getTime())
      || Number.isNaN(report.weekEnd.getTime())
      || Number.isNaN(report.createdAt.getTime())
    ))
  ) {
    throw new Error('백업 파일의 리포트 날짜 데이터가 올바르지 않습니다.');
  }

  await db.transaction('rw', [db.records, db.reports, db.settings, db.streaks, db.profiles], async () => {
    if (recordsToImport.length > 0) {
      await db.records.bulkPut(recordsToImport);
    }
    if (reportsToImport.length > 0) {
      await db.reports.bulkPut(reportsToImport);
    }
    if (data.settings.length > 0) {
      await db.settings.bulkPut(data.settings);
    }
    if (data.streaks.length > 0) {
      await db.streaks.bulkPut(data.streaks);
    }
    if (data.profiles.length > 0) {
      await db.profiles.bulkPut(data.profiles);
    }
  });

  return {
    records: recordsToImport.length,
    reports: reportsToImport.length,
  };
}
