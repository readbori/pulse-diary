import type { EmotionType, WeeklyReport, EmotionRecord, UserProfile } from '@/types';
import { getUserTier } from '@/lib/user';
import { ALL_EMOTIONS } from '@/lib/emotions';
import { getEmotionLabel } from '@/lib/emotions';
import { COUNSELOR_PERSONA, ANALYSIS_PERSONA } from '@/lib/persona';
import { buildSessionContext } from '@/lib/counseling';
import { getQuoteForEmotions } from '@/lib/quotes';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

export interface EmotionAnalysis {
  primary: EmotionType;
  scores: Record<EmotionType, number>;
}

// ─── 스마트 기록 요약 (토큰 절약) ───

function buildSmartRecordSummary(records: EmotionRecord[]): string {
  const MAX_RAW_RECORDS = 15;

  // 소량이면 전부 전송
  if (records.length <= MAX_RAW_RECORDS) {
    return records.map((r, i) => {
      const date = new Date(r.createdAt).toLocaleDateString('ko-KR');
      const emotion = r.emotions?.primary ? getEmotionLabel(r.emotions.primary) : 'unknown';
      return `${i + 1}. [${date}] 감정: ${emotion} | "${r.transcript}"`;
    }).join('\n');
  }

  // 대량이면 통계 + 대표 샘플
  const dateRange = {
    start: new Date(records[records.length - 1].createdAt).toLocaleDateString('ko-KR'),
    end: new Date(records[0].createdAt).toLocaleDateString('ko-KR'),
  };

  // 감정 빈도 집계
  const emotionCounts: Partial<Record<EmotionType, number>> = {};
  for (const r of records) {
    const e = r.emotions?.primary;
    if (e) emotionCounts[e] = (emotionCounts[e] || 0) + 1;
  }
  const sortedEmotions = Object.entries(emotionCounts)
    .sort(([, a], [, b]) => (b as number) - (a as number));
  const emotionBreakdown = sortedEmotions
    .map(([emotion, count]) => `  - ${getEmotionLabel(emotion)}: ${count}회`)
    .join('\n');

  // 대표 샘플 10개 (최근 5 + 가장 다양한 감정 5개)
  const recent5 = records.slice(0, 5);
  const uniqueEmotionSamples: EmotionRecord[] = [];
  const seenEmotions = new Set(recent5.map(r => r.emotions?.primary));
  for (const r of records) {
    if (uniqueEmotionSamples.length >= 5) break;
    const e = r.emotions?.primary;
    if (e && !seenEmotions.has(e)) {
      uniqueEmotionSamples.push(r);
      seenEmotions.add(e);
    }
  }
  const sampleRecords = [...recent5, ...uniqueEmotionSamples];
  const samplesText = sampleRecords.map((r, i) => {
    const date = new Date(r.createdAt).toLocaleDateString('ko-KR');
    const emotion = r.emotions?.primary ? getEmotionLabel(r.emotions.primary) : 'unknown';
    return `  ${i + 1}. [${date}] ${emotion} | "${r.transcript}"`;
  }).join('\n');

  return `[기간: ${dateRange.start} ~ ${dateRange.end}]
[총 ${records.length}건의 감정 기록]

감정 분포:
${emotionBreakdown}

대표 기록 (${sampleRecords.length}건):
${samplesText}`;
}

// ─── 18감정 프롬프트 ───

const EMOTION_LIST = ALL_EMOTIONS.join(', ');

function buildEmotionPrompt(transcript: string, profile?: UserProfile): string {
  let profileContext = '';
  if (profile?.mbti || profile?.occupation) {
    const parts: string[] = [];
    if (profile.mbti) parts.push(`MBTI 유형: ${profile.mbti}`);
    if (profile.occupation) parts.push(`직업: ${profile.occupation}`);
    profileContext = `\n\n사용자 정보:\n${parts.join('\n')}\n위 정보를 참고하여 해당 성격 유형과 직업 특성에 맞게 감정을 더 정밀하게 분석해주세요.`;
  }

  return `다음 텍스트의 감정을 분석해주세요. 반드시 아래 JSON 형식만 반환하세요. 다른 텍스트는 포함하지 마세요.

텍스트: "${transcript}"${profileContext}

사용 가능한 감정 목록:
${EMOTION_LIST}

JSON 형식:
{
  "primary": "위 목록 중 하나",
  "scores": {
    "happiness": 0.0,
    "gratitude": 0.0,
    "excitement": 0.0,
    "calm": 0.0,
    "hope": 0.0,
    "pride": 0.0,
    "sadness": 0.0,
    "loneliness": 0.0,
    "anger": 0.0,
    "irritation": 0.0,
    "anxiety": 0.0,
    "fear": 0.0,
    "shame": 0.0,
    "disgust": 0.0,
    "surprise": 0.0,
    "confusion": 0.0,
    "boredom": 0.0,
    "nostalgia": 0.0
  }
}

규칙:
- primary는 가장 높은 점수의 감정
- scores의 각 값은 0.0~1.0 사이
- 상위 2~3개 감정에 높은 점수, 나머지는 0.0
- JSON만 반환, 설명 없음`;
}

// ─── 리포트 생성 프롬프트 ───

// ─── 티어별 리포트 프롬프트 생성 ───

function buildReportPrompt(records: string, isPremium: boolean, profile?: UserProfile): string {
  const profileBlock = (profile?.mbti || profile?.occupation)
    ? `\n\n사용자 프로필:\n${profile.mbti ? `- MBTI: ${profile.mbti} (이 성격 유형의 감정 처리 특성을 반영하세요)` : ''}${profile.occupation ? `\n- 직업: ${profile.occupation} (직업적 스트레스와 감정 맥락을 고려하세요)` : ''}\n`
    : '';

  if (isPremium) {
    return `당신은 10년 경력의 임상심리 전문가입니다. 아래 감정 기록 데이터를 바탕으로, 이 사용자만을 위한 깊이 있는 맞춤형 분석 리포트를 작성하세요.${profileBlock}

기록 데이터:
${records}

반드시 아래 JSON 형식만 반환하세요. 각 필드는 최소 150자 이상, 충분히 길고 구체적으로 작성하세요:
{
  "summary": "이 기간 동안의 감정 여정을 시간 순서로 서술하세요. (1) 어떤 감정이 주를 이루었는지 (2) 감정이 어떻게 변화했는지 (3) 특별히 눈에 띄는 날이나 사건이 있었는지를 사용자의 실제 기록 내용을 인용하며 구체적으로 분석하세요. CBT나 EFT 등 관련 이론을 자연스럽게 포함하되, 학술 용어만 나열하지 말고 사용자의 경험에 연결하세요. 최소 6문장.",
  "patterns": "반복되는 감정 패턴을 발견하고 분석하세요. (1) 특정 요일/시간대에 반복되는 감정이 있는지 (2) 감정 간의 연관 관계 (예: A감정 다음에 B감정이 자주 오는지) (3) 감정의 강도 변화 추이를 Gross의 감정 조절 과정 모델 등을 활용하여 설명하세요. 사용자의 실제 데이터에서 근거를 들어 분석하세요. 최소 6문장.",
  "empathy": "사용자의 구체적 경험을 직접 언급하며 공감하세요. '~하셨군요', '~느끼셨을 때 정말 힘드셨을 거예요'처럼 사용자가 실제로 기록한 내용에 대해 구체적으로 반응하세요. 로저스의 무조건적 긍정적 존중을 바탕으로, 어떤 감정이든 타당하다는 것을 인정하세요. 사용자가 '이 사람이 내 마음을 정말 알아주는구나'라고 느끼도록 작성하세요. 최소 6문장.",
  "positives": "이 기간 동안 발견된 긍정적 신호와 성장 포인트를 구체적으로 찾아 칭찬하세요. (1) 감정을 기록하는 행위 자체의 심리학적 가치 (Pennebaker의 표현적 글쓰기 연구) (2) 어려운 감정을 느끼면서도 기록을 이어간 회복탄력성 (3) 데이터에서 발견되는 구체적인 성장 근거를 제시하세요. 최소 5문장.",
  "suggestions": "위 분석(summary, patterns, empathy, positives)에서 발견한 내용을 근거로, 사용자의 실제 생활을 개선할 수 있는 구체적 실천 제안 3가지를 제시하세요. 감정 이야기를 반복하지 말고, 행동·습관·루틴·관계·환경 변화 등 실질적 생활 조언을 하세요. 각 제안마다: (1) 정확히 무엇을 어떻게 하면 되는지 (예: '퇴근 후 20분 산책', '주 2회 지인과 식사 약속') (2) 위 분석에서 이 제안이 필요한 이유 (사용자의 기록을 인용) (3) 학술적 근거 (행동 활성화, 사회적 지지 이론, 수면 위생 등)를 포함하세요. '감정을 느껴보세요', '마음을 관찰하세요' 같은 추상적 조언 금지. 최소 6문장.",
  "quote": "사용자의 주요 감정에 공감하면서 성장을 격려하는 명언. 저자 포함 (예: '감정을 느끼는 것은 살아있다는 증거입니다. — Carl Rogers')"
}

핵심 규칙:
- 한국어로 작성
- 반드시 사용자의 실제 기록 내용을 인용하여 개인화된 분석을 제공하세요
- "일반적으로~", "보통~" 같은 일반론 금지. 이 사용자의 데이터에서 근거를 제시하세요
- 전문적이면서도 따뜻하고, 읽으면 돈을 낼 가치가 있다고 느끼게 작성하세요
- 각 필드에서 핵심 키워드, 감정명, 중요 조언, 학술 용어 등은 **볼드**(별표 두 개로 감싸기)로 강조하세요 (예: "**회복탄력성**이 높아지고 있습니다")
- JSON만 반환`;
  }

  return `당신은 따뜻한 감정 상담가입니다. 아래 감정 기록을 분석하여 사용자에게 도움이 되는 리포트를 작성하세요.${profileBlock}

기록 데이터:
${records}

반드시 아래 JSON 형식만 반환하세요. 각 필드를 빈약하지 않게, 최소 100자 이상으로 충실하게 작성하세요:
{
  "summary": "이 기간 동안 사용자가 느낀 감정의 전체적인 흐름을 설명하세요. 어떤 감정이 가장 많았고, 감정이 어떻게 변화했는지, 사용자의 실제 기록 내용을 인용하며 구체적으로 서술하세요. 최소 4문장으로 작성하세요.",
  "patterns": "반복되는 감정이나 특정 상황에서 나타나는 감정 경향을 분석하세요. 사용자의 기록에서 발견한 구체적 패턴을 제시하고, 이 패턴이 왜 나타나는지 간단히 설명하세요. 최소 4문장.",
  "empathy": "사용자의 감정 경험에 진심으로 공감하세요. 사용자가 기록한 구체적 내용을 언급하며 '~하셨군요', '~느꼈을 때 힘드셨을 거예요'처럼 개인화된 위로를 전하세요. 최소 4문장.",
  "positives": "이 기간 동안의 긍정적 발견을 찾아 구체적으로 칭찬하세요. 감정을 기록하는 습관 자체의 가치, 어려움 속에서도 보이는 성장 신호를 구체적으로 이야기하세요. 최소 3문장.",
  "suggestions": "위 분석 결과를 바탕으로, 사용자의 일상을 실질적으로 개선할 행동 2가지를 제안하세요. 감정 이야기를 반복하지 말고, 구체적인 생활 변화를 제안하세요 (예: '매일 잠들기 전 10분 스트레칭', '주 1회 새로운 장소에서 점심 먹기', '하루 1번 고마운 사람에게 짧은 메시지 보내기'). 각 제안은 위 분석에서 왜 이것이 필요한지 근거를 들어 설명하세요. '감정을 느껴보세요' 같은 추상적 조언 금지. 최소 4문장.",
  "quote": "사용자의 감정에 공감하는 명언 한 줄. 저자 포함 (예: '오늘 하루도 충분히 잘했어요. — 마음 길잡이')"
}

핵심 규칙:
- 한국어로 작성
- "일반적으로~" 같은 일반론이 아닌, 사용자의 실제 기록을 참고한 구체적 내용
- 따뜻하고 공감하는 톤
- 각 필드에서 핵심 키워드, 감정명, 중요 조언은 **볼드**(별표 두 개로 감싸기)로 강조하세요 (예: "**감사함**을 자주 느끼셨네요")
- JSON만 반환`;
}

// ─── 감정 분석 메인 함수 ───

export async function analyzeEmotion(transcript: string, profile?: UserProfile): Promise<EmotionAnalysis> {
  if (!transcript.trim()) {
    return mockAnalysis(transcript);
  }

  const tier = getUserTier();

  if ((tier === 'premium' || tier === 'advanced') && OPENAI_API_KEY) {
    try {
      console.log('[AI] Premium - OpenAI GPT-4o-mini');
      return await callLLM(transcript, 'openai', profile);
    } catch (error) {
      console.warn('[AI] OpenAI 실패, fallback:', error);
    }
  }

  if (OPENROUTER_API_KEY) {
    try {
      console.log('[AI] Free - OpenRouter OSS-120b');
      return await callLLM(transcript, 'openrouter', profile);
    } catch (error) {
      console.warn('[AI] OpenRouter 실패, mock 사용:', error);
    }
  }

  console.log('[AI] Mock 분석 사용');
  return mockAnalysis(transcript);
}

// ─── 리포트 생성 함수 ───

export async function generateReport(
  userId: string,
  records: EmotionRecord[],
  dateLabel: string,
  profile?: UserProfile
): Promise<Omit<WeeklyReport, 'id'>> {
  const tier = getUserTier();

  const recordSummaries = buildSmartRecordSummary(records);

  // 감정 요약 집계
  const emotionSummary = {} as Record<EmotionType, number>;
  for (const e of ALL_EMOTIONS) emotionSummary[e] = 0;
  for (const r of records) {
    const primary = r.emotions?.primary;
    if (primary && primary in emotionSummary) {
      emotionSummary[primary]++;
    }
  }

  let content: WeeklyReport['content'];

  // Build cumulative counseling context
  let sessionContext: string | undefined;
  try {
    sessionContext = await buildSessionContext(userId);
  } catch (e) {
    console.warn('[AI] Session context build failed:', e);
  }

  try {
    const isPremium = tier === 'premium' || tier === 'advanced';
    const provider = isPremium && OPENAI_API_KEY ? 'openai' : 'openrouter';
    content = await callReportLLM(recordSummaries, provider, sessionContext, isPremium, profile);
  } catch (error) {
    console.warn('[AI] 리포트 생성 실패, 기본 리포트 사용:', error);
    content = {
      summary: `${dateLabel} 동안 총 ${records.length}개의 감정을 기록했습니다.`,
      patterns: '분석 데이터가 충분히 쌓이면 패턴을 발견할 수 있어요.',
      empathy: '꾸준히 감정을 기록하는 것 자체가 대단한 일이에요.',
      positives: '매일 자신의 감정을 돌아보는 습관을 가지고 계시네요!',
      suggestions: '오늘도 잠시 멈추고 나의 마음을 들여다보는 시간을 가져보세요.',
      quote: '감정을 기록하는 것은 자기 이해의 첫걸음입니다. — James Pennebaker',
    };
  }

  if (!content.quote?.trim()) {
    const primaryEmotions = records
      .map((record) => record.emotions?.primary)
      .filter((emotion): emotion is EmotionType => Boolean(emotion));
    content.quote = getQuoteForEmotions(primaryEmotions);
  }

  const now = new Date();
  const weekStart = new Date(records[records.length - 1]?.createdAt || now);
  const weekEnd = new Date(records[0]?.createdAt || now);

  return {
    userId,
    weekStart,
    weekEnd,
    recordCount: records.length,
    emotionSummary,
    content,
    aiModel: (tier === 'premium' || tier === 'advanced') ? 'gpt-4o-mini' : 'oss-120b',
    createdAt: now,
  };
}

// ─── LLM 호출 (공통) ───

async function callLLM(
  transcript: string,
  provider: 'openai' | 'openrouter',
  profile?: UserProfile
): Promise<EmotionAnalysis> {
  const prompt = buildEmotionPrompt(transcript, profile);

  const { url, headers, body } = provider === 'openai'
    ? {
        url: 'https://api.openai.com/v1/chat/completions',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: {
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system' as const, content: ANALYSIS_PERSONA },
            { role: 'user' as const, content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 300,
          response_format: { type: 'json_object' },
        },
      }
    : {
        url: 'https://openrouter.ai/api/v1/chat/completions',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Pulse Diary',
        },
        body: {
          model: 'openai/gpt-oss-120b:free',
          messages: [
            { role: 'system' as const, content: ANALYSIS_PERSONA },
            { role: 'user' as const, content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 300,
        },
      };

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${provider} API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return parseEmotionResponse(data.choices[0].message.content);
}

async function callReportLLM(
  recordSummaries: string,
  provider: 'openai' | 'openrouter',
  sessionContext?: string,
  isPremium: boolean = false,
  profile?: UserProfile
): Promise<WeeklyReport['content']> {
  const contextBlock = sessionContext
    ? `\n\n참고할 사용자 히스토리:\n${sessionContext}`
    : '';
  const prompt = buildReportPrompt(recordSummaries, isPremium, profile) + contextBlock;

  const { url, headers, body } = provider === 'openai'
    ? {
        url: 'https://api.openai.com/v1/chat/completions',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: {
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system' as const, content: COUNSELOR_PERSONA },
            { role: 'user' as const, content: prompt }
          ],
          temperature: 0.5,
          max_tokens: isPremium ? 3000 : 1500,
          response_format: { type: 'json_object' },
        },
      }
    : {
        url: 'https://openrouter.ai/api/v1/chat/completions',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Pulse Diary',
        },
        body: {
          model: 'openai/gpt-oss-120b:free',
          messages: [
            { role: 'system' as const, content: COUNSELOR_PERSONA },
            { role: 'user' as const, content: prompt }
          ],
          temperature: 0.5,
          max_tokens: 1500,
        },
      };

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`${provider} Report API error: ${response.status}`);
  }

  const data = await response.json();
  const raw = data.choices[0].message.content;

  const jsonMatch = raw.match(/```json\s*([\s\S]*?)```/) || raw.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]).trim() : raw.trim();
  const parsed = JSON.parse(jsonStr);

  return {
    summary: parsed.summary || '',
    patterns: parsed.patterns || '',
    empathy: parsed.empathy || '',
    positives: parsed.positives || '',
    suggestions: parsed.suggestions || '',
    quote: parsed.quote || '',
  };
}

// ─── 파싱 ───

function parseEmotionResponse(content: string): EmotionAnalysis {
  try {
    const jsonMatch = content.match(/```json\s*([\s\S]*?)```/) ||
                      content.match(/\{[\s\S]*\}/);

    const jsonStr = jsonMatch
      ? (jsonMatch[1] || jsonMatch[0]).trim()
      : content.trim();

    const parsed = JSON.parse(jsonStr);

    // primary 검증
    const primary: EmotionType = ALL_EMOTIONS.includes(parsed.primary)
      ? parsed.primary
      : 'calm';

    // scores 검증
    const scores = {} as Record<EmotionType, number>;
    for (const emotion of ALL_EMOTIONS) {
      const val = Number(parsed.scores?.[emotion]);
      scores[emotion] = isNaN(val) ? 0 : Math.min(1, Math.max(0, val));
    }

    const total = Object.values(scores).reduce((sum, v) => sum + v, 0);
    if (total === 0) {
      scores[primary] = 1.0;
    }

    return { primary, scores };
  } catch (error) {
    console.error('[AI] 파싱 실패:', error, 'Raw:', content);
    throw new Error('감정 분석 응답 파싱 실패');
  }
}

// ─── Mock 분석 ───

function mockAnalysis(transcript: string): EmotionAnalysis {
  const text = transcript.toLowerCase();

  const keywords: Partial<Record<EmotionType, string[]>> = {
    happiness:  ['좋', '행복', '기쁨', '웃', '사랑', '최고', '굿', '짱'],
    gratitude:  ['감사', '고마', '덕분'],
    excitement: ['신나', '즐거', '설레', '두근', '기대'],
    calm:       ['편안', '평화', '그냥', '보통', '평범', '일상'],
    hope:       ['희망', '바라', '꿈', '될거'],
    pride:      ['뿌듯', '자랑', '해냈', '성공'],
    sadness:    ['슬프', '우울', '힘들', '눈물', '아프'],
    loneliness: ['외로', '혼자', '그리'],
    anger:      ['화나', '분노', '빡', '열받'],
    irritation: ['짜증', '싫', '못참', '어이없', '황당'],
    anxiety:    ['불안', '걱정', '초조', '긴장'],
    fear:       ['무서', '두려', '겁나', '떨리'],
    shame:      ['부끄', '창피', '민망'],
    disgust:    ['역겹', '싫', '구역'],
    surprise:   ['놀라', '깜짝', '헐', '세상에', '갑자기'],
    confusion:  ['모르겠', '혼란', '복잡', '어떻게'],
    boredom:    ['지루', '심심', '별로', '재미없'],
    nostalgia:  ['그립', '추억', '옛날', '그때'],
  };

  const scores = {} as Record<EmotionType, number>;
  for (const e of ALL_EMOTIONS) scores[e] = 0;
  scores.calm = 0.05; // 기본 바이어스

  for (const [emotion, words] of Object.entries(keywords)) {
    for (const word of words!) {
      if (text.includes(word)) {
        scores[emotion as EmotionType] += 0.3;
      }
    }
  }

  const total = Object.values(scores).reduce((sum, v) => sum + v, 0);
  for (const key of ALL_EMOTIONS) {
    scores[key] = Math.round((scores[key] / total) * 100) / 100;
  }

  const primary = (Object.entries(scores).sort(([, a], [, b]) => b - a)[0][0]) as EmotionType;
  return { primary, scores };
}
