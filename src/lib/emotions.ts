import type { EmotionType } from '@/types';

export const emotionIcons: Record<EmotionType, string> = {
  joy: '☀️',
  sadness: '🌧️',
  anger: '🔥',
  fear: '🌊',
  surprise: '⚡',
  neutral: '🍃'
};

export const emotionColors: Record<EmotionType, string> = {
  joy: 'bg-amber-100 text-amber-600',
  sadness: 'bg-blue-100 text-blue-600',
  anger: 'bg-red-100 text-red-600',
  fear: 'bg-purple-100 text-purple-600',
  surprise: 'bg-yellow-100 text-yellow-600',
  neutral: 'bg-green-100 text-green-600'
};

export const emotionLabels: Record<EmotionType, string> = {
  joy: '기쁨',
  sadness: '슬픔',
  anger: '분노',
  fear: '불안',
  surprise: '놀람',
  neutral: '평온'
};

export function getEmotionIcon(emotion: EmotionType | undefined): string {
  return emotion ? emotionIcons[emotion] : '💭';
}

export function getEmotionColor(emotion: EmotionType | undefined): string {
  return emotion ? emotionColors[emotion] : 'bg-gray-100 text-gray-600';
}

export function getEmotionLabel(emotion: EmotionType | undefined): string {
  return emotion ? emotionLabels[emotion] : '기록';
}
