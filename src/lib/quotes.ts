import type { EmotionType } from '@/types';

interface EmotionQuote {
  text: string;
  author: string;
}

/** 감정별 명언 데이터베이스 — 심리학 연구 기반 */
const quoteDatabase: Record<EmotionType, EmotionQuote[]> = {
  happiness: [
    { text: '행복은 습관이다. 그것을 몸에 지니라.', author: '허버트 (Hubbard)' },
    { text: '행복한 삶의 비결은 변화를 환영하는 것이다.', author: 'James Hillman' },
  ],
  gratitude: [
    { text: '감사는 기억하는 마음의 가장 좋은 형태입니다.', author: 'Robert Emmons' },
    { text: '감사할 줄 아는 마음이 가장 큰 미덕입니다.', author: 'Marcus Tullius Cicero' },
  ],
  excitement: [
    { text: '열정은 천재성의 시작이다.', author: 'Tony Robbins' },
    { text: '시작이 반이다.', author: '한국 속담' },
  ],
  calm: [
    { text: '고요함 속에서 자신을 만납니다.', author: 'Thich Nhat Hanh' },
    { text: '마음이 고요하면 세상이 평화롭습니다.', author: 'Jon Kabat-Zinn' },
  ],
  hope: [
    { text: '삶이 있는 한 희망은 있다.', author: 'Marcus Tullius Cicero' },
    { text: '고생 끝에 낙이 온다.', author: '한국 속담' },
  ],
  pride: [
    { text: '자신을 믿는 것이 성공의 첫 번째 비밀이다.', author: 'Ralph Waldo Emerson' },
    { text: '실패는 성공의 어머니이다.', author: '한국 속담' },
  ],
  sadness: [
    { text: '눈물을 흘려본 사람만이 진정으로 웃을 수 있다.', author: 'Khalil Gibran' },
    { text: '슬픔은 지나가지만, 그 속에서 배운 것은 남습니다.', author: 'Carl Jung' },
  ],
  loneliness: [
    { text: '외로움은 자신과 깊이 만나는 시간입니다.', author: 'Paul Tillich' },
    { text: '혼자인 시간이 나를 더 강하게 만듭니다.', author: 'Rollo May' },
  ],
  anger: [
    { text: '분노는 자신에게 독을 마시고 상대가 죽기를 바라는 것이다.', author: 'Buddha' },
    { text: '화를 다스리는 사람이 진정한 용자입니다.', author: 'Seneca' },
  ],
  irritation: [
    { text: '인내는 쓰지만 열매는 달다.', author: 'Jean-Jacques Rousseau' },
    { text: '작은 것에 감사하면 큰 것이 온다.', author: 'Martin Seligman' },
  ],
  anxiety: [
    { text: '걱정의 90%는 일어나지 않는다.', author: 'Mark Twain' },
    { text: '지금 이 순간에 집중하면 불안은 사라집니다.', author: 'Jon Kabat-Zinn' },
  ],
  fear: [
    { text: '두려움은 위험 그 자체보다 항상 크다.', author: 'Seneca' },
    { text: '용기는 두려움이 없는 것이 아니라 두려움을 이겨내는 것이다.', author: 'Nelson Mandela' },
  ],
  shame: [
    { text: '자신을 사랑하라. 그래야 남을 사랑할 수 있다.', author: 'Kristin Neff' },
    { text: '취약함을 드러내는 것이 진정한 용기입니다.', author: 'Brené Brown' },
  ],
  disgust: [
    { text: '감정은 메시지입니다. 들어보세요.', author: 'James Gross' },
    { text: '불편한 감정도 나를 보호하는 신호입니다.', author: 'Susan David' },
  ],
  surprise: [
    { text: '인생에서 가장 좋은 것들은 예상치 못할 때 온다.', author: 'Eckhart Tolle' },
    { text: '놀라움은 배움의 시작입니다.', author: 'Aristotle' },
  ],
  confusion: [
    { text: '혼란은 성장의 전조입니다.', author: 'Jean Piaget' },
    { text: '모른다고 인정하는 것이 지혜의 시작이다.', author: 'Socrates' },
  ],
  boredom: [
    { text: '지루함은 창의성의 문 앞에 서 있는 것이다.', author: 'Sandi Mann' },
    { text: '멈춤이 있어야 새로운 시작이 있다.', author: 'Viktor Frankl' },
  ],
  nostalgia: [
    { text: '추억은 마음의 쉼터입니다.', author: 'Constantine Sedikides' },
    { text: '그리운 것이 있다는 것은 사랑한 것이 있다는 뜻입니다.', author: 'Rollo May' },
  ],
};

/** 감정에 맞는 랜덤 명언 반환 */
export function getQuoteForEmotion(emotion: EmotionType): string {
  const quotes = quoteDatabase[emotion];
  if (!quotes || quotes.length === 0) {
    return '감정을 기록하는 것은 자기 이해의 첫걸음입니다. — James Pennebaker';
  }
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  return `${quote.text} — ${quote.author}`;
}

/** 여러 감정 중 primary 기반 명언 반환 */
export function getQuoteForEmotions(emotions: EmotionType[]): string {
  if (emotions.length === 0) {
    return '감정을 기록하는 것은 자기 이해의 첫걸음입니다. — James Pennebaker';
  }
  return getQuoteForEmotion(emotions[0]);
}
