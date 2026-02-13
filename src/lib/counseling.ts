import { getAllRecords, getReports } from '@/lib/db';
import { getEmotionLabel } from '@/lib/emotions';
import type { EmotionRecord, WeeklyReport, EmotionType } from '@/types';

/**
 * 사용자의 감정 히스토리를 기반으로 누적 상담 컨텍스트를 생성합니다.
 * AI 리포트 생성 시 system prompt에 포함하여 누적 성장 상담이 가능하게 합니다.
 */
export async function buildSessionContext(userId: string): Promise<string> {
  const [allRecords, allReports] = await Promise.all([
    getAllRecords(userId),
    getReports(userId),
  ]);

  // 토큰 절약: 최근 30건 기록 + 최근 3개 리포트만 사용
  const records = allRecords.slice(0, 30);
  const reports = allReports.slice(0, 3);

  if (records.length === 0) {
    return '이 사용자는 첫 상담입니다. 따뜻하게 환영해주세요.';
  }

  const sections: string[] = [];

  // 1. 기본 통계
  const totalDays = new Set(
    records.map(r => new Date(r.createdAt).toISOString().split('T')[0])
  ).size;
  sections.push(`## 상담 이력 요약\n- 총 기록: ${records.length}건\n- 기록 일수: ${totalDays}일`);

  // 2. 감정 분포
  const emotionCounts: Partial<Record<EmotionType, number>> = {};
  for (const r of records) {
    const emotion = r.emotions?.primary;
    if (emotion) {
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    }
  }
  const sorted = Object.entries(emotionCounts)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5);

  if (sorted.length > 0) {
    const distribution = sorted
      .map(([emotion, count]) => `  - ${getEmotionLabel(emotion)}: ${count}회`)
      .join('\n');
    sections.push(`## 주요 감정 분포 (상위 5개)\n${distribution}`);
  }

  // 3. 최근 2주 감정 추이
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const recentRecords = records.filter(r => new Date(r.createdAt) >= twoWeeksAgo);

  if (recentRecords.length > 0) {
    const recentEmotions = recentRecords
      .slice(0, 10)
      .map(r => {
        const date = new Date(r.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
        const emotion = getEmotionLabel(r.emotions?.primary);
        const snippet = r.transcript.slice(0, 30) + (r.transcript.length > 30 ? '...' : '');
        return `  - ${date}: ${emotion} — "${snippet}"`;
      })
      .join('\n');
    sections.push(`## 최근 2주 감정 흐름 (최근 10건)\n${recentEmotions}`);
  }

  // 4. 이전 리포트 요약 (최근 3개, 요약 100자 제한)
  if (reports.length > 0) {
    const reportSummaries = reports
      .map(r => {
        const dateRange = `${new Date(r.weekStart).toLocaleDateString('ko-KR')} ~ ${new Date(r.weekEnd).toLocaleDateString('ko-KR')}`;
        const summary = r.content.summary?.slice(0, 100) + (r.content.summary?.length > 100 ? '...' : '');
        return `  - [${dateRange}] ${summary}`;
      })
      .join('\n');
    sections.push(`## 이전 상담 리포트 요약\n${reportSummaries}`);
  }

  // 5. 성장 포인트 감지
  if (records.length >= 5) {
    const firstHalf = records.slice(Math.floor(records.length / 2));
    const secondHalf = records.slice(0, Math.floor(records.length / 2));

    const countPositive = (recs: EmotionRecord[]) =>
      recs.filter(r => ['happiness', 'gratitude', 'excitement', 'calm', 'hope', 'pride'].includes(r.emotions?.primary || '')).length;

    const earlyPositive = countPositive(firstHalf) / (firstHalf.length || 1);
    const recentPositive = countPositive(secondHalf) / (secondHalf.length || 1);

    if (recentPositive > earlyPositive + 0.1) {
      sections.push('## 성장 관찰\n긍정적 감정의 비율이 초기 대비 증가하고 있습니다. 이 성장을 인정해주세요.');
    } else if (earlyPositive > recentPositive + 0.1) {
      sections.push('## 주의 관찰\n최근 부정적 감정이 증가하는 추세입니다. 부드럽게 이 변화를 탐색해주세요.');
    }
  }

  return sections.join('\n\n');
}
