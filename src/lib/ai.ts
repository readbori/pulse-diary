import type { EmotionType, WeeklyReport, EmotionRecord } from '@/types';
import { getUserTier } from '@/lib/user';
import { ALL_EMOTIONS } from '@/lib/emotions';
import { COUNSELOR_PERSONA, ANALYSIS_PERSONA } from '@/lib/persona';
import { buildSessionContext } from '@/lib/counseling';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

export interface EmotionAnalysis {
  primary: EmotionType;
  scores: Record<EmotionType, number>;
}

// ─── 18감정 프롬프트 ───

const EMOTION_LIST = ALL_EMOTIONS.join(', ');

const EMOTION_PROMPT = `다음 텍스트의 감정을 분석해주세요. 반드시 아래 JSON 형식만 반환하세요. 다른 텍스트는 포함하지 마세요.

텍스트: "{transcript}"

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

// ─── 리포트 생성 프롬프트 ───

const REPORT_PROMPT = `다음은 사용자의 감정 기록들입니다. 이를 분석하여 리포트를 작성해주세요.

기록 데이터:
{records}

반드시 아래 JSON 형식만 반환하세요:
{
  "summary": "전체 감정 요약 (2-3문장)",
  "patterns": "감정 패턴 분석 (반복되는 감정, 트리거 등)",
  "empathy": "공감과 위로의 말 (따뜻하고 진심어린 톤)",
  "positives": "긍정적인 부분 발견 (칭찬, 성장 포인트)",
  "suggestions": "실천 가능한 제안 (구체적 행동 1-2가지)"
}

규칙:
- 한국어로 작성
- 따뜻하고 공감하는 톤
- JSON만 반환`;

// ─── 감정 분석 메인 함수 ───

export async function analyzeEmotion(transcript: string): Promise<EmotionAnalysis> {
  if (!transcript.trim()) {
    return mockAnalysis(transcript);
  }

  const tier = getUserTier();

  if ((tier === 'premium' || tier === 'advanced') && OPENAI_API_KEY) {
    try {
      console.log('[AI] Premium - OpenAI GPT-4o-mini');
      return await callLLM(transcript, 'openai');
    } catch (error) {
      console.warn('[AI] OpenAI 실패, fallback:', error);
    }
  }

  if (OPENROUTER_API_KEY) {
    try {
      console.log('[AI] Free - OpenRouter OSS-120b');
      return await callLLM(transcript, 'openrouter');
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
  dateLabel: string
): Promise<Omit<WeeklyReport, 'id'>> {
  const tier = getUserTier();

  const recordSummaries = records.map((r, i) => {
    const date = new Date(r.createdAt).toLocaleDateString('ko-KR');
    const emotion = r.emotions?.primary || 'unknown';
    return `${i + 1}. [${date}] 감정: ${emotion} | "${r.transcript}"`;
  }).join('\n');

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
    const provider = (tier === 'premium' || tier === 'advanced') && OPENAI_API_KEY
      ? 'openai' : 'openrouter';
    content = await callReportLLM(recordSummaries, provider, sessionContext);
  } catch (error) {
    console.warn('[AI] 리포트 생성 실패, 기본 리포트 사용:', error);
    content = {
      summary: `${dateLabel} 동안 총 ${records.length}개의 감정을 기록했습니다.`,
      patterns: '분석 데이터가 충분히 쌓이면 패턴을 발견할 수 있어요.',
      empathy: '꾸준히 감정을 기록하는 것 자체가 대단한 일이에요.',
      positives: '매일 자신의 감정을 돌아보는 습관을 가지고 계시네요!',
      suggestions: '오늘도 잠시 멈추고 나의 마음을 들여다보는 시간을 가져보세요.',
    };
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

async function callLLM(transcript: string, provider: 'openai' | 'openrouter'): Promise<EmotionAnalysis> {
  const prompt = EMOTION_PROMPT.replace('{transcript}', transcript);

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
  sessionContext?: string
): Promise<WeeklyReport['content']> {
  const contextBlock = sessionContext
    ? `\n\n참고할 사용자 히스토리:\n${sessionContext}`
    : '';
  const prompt = REPORT_PROMPT.replace('{records}', recordSummaries) + contextBlock;

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
          max_tokens: 600,
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
          max_tokens: 600,
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
