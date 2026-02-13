import type { EmotionType } from '@/types';
import { LEGACY_EMOTION_MAP } from '@/types';

// ─── 감정 라벨 (한국어) ───
export const emotionLabels: Record<EmotionType, string> = {
  happiness:  '행복',
  gratitude:  '감사',
  excitement: '설렘',
  calm:       '평온',
  hope:       '희망',
  pride:      '자부심',
  sadness:    '슬픔',
  loneliness: '외로움',
  anger:      '분노',
  irritation: '짜증',
  anxiety:    '불안',
  fear:       '공포',
  shame:      '부끄러움',
  disgust:    '혐오',
  surprise:   '놀람',
  confusion:  '혼란',
  boredom:    '지루함',
  nostalgia:  '그리움',
};

// ─── 감정 컬러 (dot 배경색 hex) ───
export const emotionDotColors: Record<EmotionType, string> = {
  // 긍정: 따뜻한 톤
  happiness:  '#FBBF24',
  gratitude:  '#F472B6',
  excitement: '#FB923C',
  calm:       '#34D399',
  hope:       '#60A5FA',
  pride:      '#A78BFA',
  // 부정: 차가운/강한 톤
  sadness:    '#3B82F6',
  loneliness: '#6366F1',
  anger:      '#EF4444',
  irritation: '#F97316',
  anxiety:    '#8B5CF6',
  fear:       '#475569',
  shame:      '#E879F9',
  disgust:    '#84CC16',
  // 중립/복합
  surprise:   '#FACC15',
  confusion:  '#94A3B8',
  boredom:    '#CBD5E1',
  nostalgia:  '#2DD4BF',
};

// ─── 감정 그라데이션 (dot 내부용) ───
export const emotionGradients: Record<EmotionType, string> = {
  happiness:  'from-amber-300 to-amber-500',
  gratitude:  'from-pink-300 to-pink-500',
  excitement: 'from-orange-300 to-orange-500',
  calm:       'from-emerald-300 to-emerald-500',
  hope:       'from-blue-300 to-blue-500',
  pride:      'from-violet-300 to-violet-500',
  sadness:    'from-blue-400 to-blue-600',
  loneliness: 'from-indigo-400 to-indigo-600',
  anger:      'from-red-400 to-red-600',
  irritation: 'from-orange-400 to-orange-600',
  anxiety:    'from-violet-400 to-violet-600',
  fear:       'from-slate-500 to-slate-700',
  shame:      'from-fuchsia-300 to-fuchsia-500',
  disgust:    'from-lime-400 to-lime-600',
  surprise:   'from-yellow-300 to-yellow-500',
  confusion:  'from-slate-300 to-slate-500',
  boredom:    'from-slate-200 to-slate-400',
  nostalgia:  'from-teal-300 to-teal-500',
};

// ─── 감정별 Tailwind 배경/텍스트 클래스 (카드/배지용) ───
export const emotionColors: Record<EmotionType, string> = {
  happiness:  'bg-amber-100 text-amber-700',
  gratitude:  'bg-pink-100 text-pink-700',
  excitement: 'bg-orange-100 text-orange-700',
  calm:       'bg-emerald-100 text-emerald-700',
  hope:       'bg-blue-100 text-blue-700',
  pride:      'bg-violet-100 text-violet-700',
  sadness:    'bg-blue-100 text-blue-700',
  loneliness: 'bg-indigo-100 text-indigo-700',
  anger:      'bg-red-100 text-red-700',
  irritation: 'bg-orange-100 text-orange-700',
  anxiety:    'bg-violet-100 text-violet-700',
  fear:       'bg-slate-200 text-slate-700',
  shame:      'bg-fuchsia-100 text-fuchsia-700',
  disgust:    'bg-lime-100 text-lime-700',
  surprise:   'bg-yellow-100 text-yellow-700',
  confusion:  'bg-slate-100 text-slate-600',
  boredom:    'bg-gray-100 text-gray-500',
  nostalgia:  'bg-teal-100 text-teal-700',
};

// ─── 감정 그룹 (UI 그룹핑용) ───
export const emotionGroups = {
  positive: ['happiness', 'gratitude', 'excitement', 'calm', 'hope', 'pride'] as EmotionType[],
  negative: ['sadness', 'loneliness', 'anger', 'irritation', 'anxiety', 'fear', 'shame', 'disgust'] as EmotionType[],
  neutral:  ['surprise', 'confusion', 'boredom', 'nostalgia'] as EmotionType[],
};

// ─── 모든 감정 키 리스트 ───
export const ALL_EMOTIONS: EmotionType[] = [
  ...emotionGroups.positive,
  ...emotionGroups.negative,
  ...emotionGroups.neutral,
];

// ─── 헬퍼 함수 ───

/** 레거시 감정 키를 신규 키로 변환 */
export function normalizeEmotion(emotion: string | undefined): EmotionType | undefined {
  if (!emotion) return undefined;
  if (emotion in emotionLabels) return emotion as EmotionType;
  if (emotion in LEGACY_EMOTION_MAP) return LEGACY_EMOTION_MAP[emotion];
  return undefined;
}

/** 감정의 dot 배경색(hex)을 반환 */
export function getEmotionDotColor(emotion: EmotionType | string | undefined): string {
  const normalized = normalizeEmotion(emotion as string);
  return normalized ? emotionDotColors[normalized] : '#CBD5E1';
}

/** 감정의 그라데이션 클래스 반환 */
export function getEmotionGradient(emotion: EmotionType | string | undefined): string {
  const normalized = normalizeEmotion(emotion as string);
  return normalized ? emotionGradients[normalized] : 'from-gray-300 to-gray-400';
}

/** 감정의 Tailwind 배경/텍스트 클래스 반환 */
export function getEmotionColor(emotion: EmotionType | string | undefined): string {
  const normalized = normalizeEmotion(emotion as string);
  return normalized ? emotionColors[normalized] : 'bg-gray-100 text-gray-500';
}

/** 감정의 한국어 라벨 반환 */
export function getEmotionLabel(emotion: EmotionType | string | undefined): string {
  const normalized = normalizeEmotion(emotion as string);
  return normalized ? emotionLabels[normalized] : '기록';
}

/**
 * @deprecated 이모지 대신 컬러닷을 사용. 하위호환용으로 유지.
 */
export function getEmotionIcon(emotion: EmotionType | string | undefined): string {
  const normalized = normalizeEmotion(emotion as string);
  return normalized ? emotionLabels[normalized].charAt(0) : '·';
}
