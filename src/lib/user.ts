import type { User } from '@/types';

const TIER_STORAGE_KEY = 'pulse_user_tier';
const USER_ID_KEY = 'pulse_user_id';

export type UserTier = User['tier'];

/**
 * 현재 사용자의 tier를 가져옵니다.
 * localStorage 기반. 기본값: 'free'
 */
export function getUserTier(): UserTier {
  const tier = localStorage.getItem(TIER_STORAGE_KEY);
  if (tier === 'free' || tier === 'advanced' || tier === 'premium') {
    return tier;
  }
  return 'free';
}

/**
 * 사용자 tier를 변경합니다.
 * (개발/테스트용 - 나중에 실제 결제 시스템으로 교체)
 */
export function setUserTier(tier: UserTier): void {
  localStorage.setItem(TIER_STORAGE_KEY, tier);
}

/**
 * 효과적 사용자 ID를 반환합니다.
 * Supabase 로그인 시 → auth user id (localStorage에 저장됨)
 * 비로그인 시 → localStorage의 기존 pulse_user_id 또는 'demo-user'
 */
export function getEffectiveUserId(): string {
  return localStorage.getItem(USER_ID_KEY) || 'demo-user';
}

/**
 * 현재 사용자 ID를 가져옵니다. (getEffectiveUserId alias)
 */
export function getUserId(): string {
  return getEffectiveUserId();
}

/**
 * tier별 사용 가능한 AI 모델 정보
 */
export function getAIModelInfo(tier: UserTier): { name: string; provider: string; description: string } {
  switch (tier) {
    case 'premium':
    case 'advanced':
      return {
        name: 'GPT-4o-mini',
        provider: 'OpenAI',
        description: '빠르고 정확한 감정 분석',
      };
    case 'free':
    default:
      return {
        name: 'OSS-120B',
        provider: 'OpenRouter',
        description: '무료 오픈소스 AI 감정 분석',
      };
  }
}
