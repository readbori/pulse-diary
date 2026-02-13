import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Sparkles, X, Send, Mic, Activity, Moon, Sun, Cloud, Zap, Crown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { RecordButton } from '@/components/RecordButton';
import { StreakDisplay } from '@/components/StreakDisplay';
import { TranscriptModal } from '@/components/TranscriptModal';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { saveRecord, updateStreak, getStreak, getProfile, getRecordsByDateRange } from '@/lib/db';
import { analyzeEmotion } from '@/lib/ai';
import { getEmotionLabel } from '@/lib/emotions';
import { getUserTier } from '@/lib/user';
import type { StreakData, UserProfile, EmotionRecord } from '@/types';

const DEMO_USER_ID = 'demo-user';

export function HomePage() {
  const navigate = useNavigate();
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [recentEmotion, setRecentEmotion] = useState<string | null>(null);

  const {
    isRecording,
    audioBlob,
    duration,
    startRecording,
    stopRecording,
    resetRecording,
    error: recordError
  } = useVoiceRecorder();

  const {
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    error: sttError
  } = useSpeechToText('ko-KR');

  useEffect(() => {
    const loadData = async () => {
      const userId = localStorage.getItem('pulse_user_id') || DEMO_USER_ID;
      const streakData = await getStreak(userId);
      if (streakData) {
        setStreak(streakData);
      }
      
      const profileData = await getProfile(userId);
      if (profileData) {
        setProfile(profileData);
      }

      // Fetch recent records for personalized greeting
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      threeDaysAgo.setHours(0, 0, 0, 0);

      const recentRecords: EmotionRecord[] = await getRecordsByDateRange(userId, threeDaysAgo, new Date());
      if (recentRecords.length > 0) {
        // Find dominant emotion from recent records
        const emotionCounts: Record<string, number> = {};
        for (const r of recentRecords) {
          const emotion = r.emotions?.primary;
          if (emotion) {
            emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
          }
        }
        const dominant = Object.entries(emotionCounts).sort(([, a], [, b]) => b - a)[0];
        if (dominant) {
          setRecentEmotion(dominant[0]);
        }
      }
    };
    loadData();
  }, []);

  const handleStartRecording = useCallback(async () => {
    resetTranscript();
    setSaveSuccess(false);
    await startRecording();
    startListening();
  }, [startRecording, startListening, resetTranscript]);

  const handleStopRecording = useCallback(() => {
    stopRecording();
    stopListening();
    setShowModal(true);
  }, [stopRecording, stopListening]);

  const handleResetRecording = useCallback(() => {
    resetRecording();
    resetTranscript();
    setShowModal(false);
    setSaveSuccess(false);
  }, [resetRecording, resetTranscript]);

  const handleSaveRecord = useCallback(async () => {
    if (!transcript) return;
    
    setIsProcessing(true);
    
    try {
      const userId = localStorage.getItem('pulse_user_id') || DEMO_USER_ID;
      const emotions = await analyzeEmotion(transcript);
      
      await saveRecord({
        userId,
        createdAt: new Date(),
        audioBlob: audioBlob || undefined,
        transcript,
        duration,
        language: 'ko',
        emotions,
        syncStatus: 'local'
      });

      const updatedStreak = await updateStreak(userId);
      setStreak(updatedStreak);
      
      setSaveSuccess(true);
      setShowModal(false);
      
      setTimeout(() => {
        handleResetRecording();
      }, 2000);
      
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [transcript, audioBlob, duration, handleResetRecording]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = profile?.name || '';
    const namePrefix = name ? `${name}님, ` : '';

    const timeGreeting =
      hour < 6
        ? '편안한 밤이에요'
        : hour < 12
          ? '좋은 아침이에요'
          : hour < 18
            ? '오늘 하루 어떠세요?'
            : hour < 22
              ? '오늘 하루 어땠나요?'
              : '편안한 밤 되세요';

    return `${namePrefix}${timeGreeting}`;
  };

  /** 감정 기반 서브 메시지 (1줄) */
  const getEmotionSubtext = (): string | null => {
    if (!recentEmotion) return null;

    const emotionSubtexts: Record<string, string[]> = {
      happiness: ['좋은 기운이 계속되고 있네요!', '행복한 흐름이에요'],
      gratitude: ['감사한 마음이 빛나요', '따뜻한 하루네요'],
      excitement: ['설레는 일이 가득하군요!', '두근거리는 하루에요'],
      calm: ['평온한 시간이네요', '마음이 차분하시군요'],
      hope: ['희망찬 마음이 느껴져요', '기대되는 날들이에요'],
      pride: ['자랑스러운 하루에요', '대단하세요!'],
      sadness: ['오늘도 함께할게요', '기대어도 괜찮아요'],
      loneliness: ['혼자가 아니에요', '함께 있을게요'],
      anger: ['천천히 풀어가요', '마음이 힘드셨군요'],
      irritation: ['잠시 숨을 고르세요', '알아줄게요'],
      anxiety: ['괜찮아질 거예요', '함께 정리해봐요'],
      fear: ['한 걸음씩이면 돼요', '함께 할게요'],
      shame: ['충분히 잘 하고 있어요', '괜찮아요'],
      disgust: ['마음을 달래봐요', '기분 전환해봐요'],
      surprise: ['놀라운 일이 있었군요!', '예상 밖이었죠'],
      confusion: ['천천히 정리해봐요', '함께 풀어봐요'],
      boredom: ['기분 전환이 필요할 때에요', '새로운 걸 시도해봐요'],
      nostalgia: ['그리운 것들이 있군요', '추억의 시간이네요'],
    };

    const texts = emotionSubtexts[recentEmotion];
    if (texts && texts.length > 0) {
      return texts[new Date().getDate() % texts.length];
    }
    return `요즘 ${getEmotionLabel(recentEmotion)} 감정이 자주 느껴지셨군요`;
  };

  const getTimeIcon = () => {
    const hour = new Date().getHours();
    if (hour < 6 || hour >= 22) return <Moon className="w-5 h-5 text-indigo-400" />;
    if (hour < 12) return <Sun className="w-5 h-5 text-amber-400" />;
    if (hour < 18) return <Cloud className="w-5 h-5 text-sky-400" />;
    return <Activity className="w-5 h-5 text-teal-400" />;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-200/30 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], x: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-20 -left-20 w-64 h-64 bg-teal-200/30 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], y: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex justify-center mb-8">
          {streak && (
            <StreakDisplay
              currentStreak={streak.currentStreak}
              longestStreak={streak.longestStreak}
            />
          )}
        </div>

        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 mb-3"
          >
            {getTimeIcon()}
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-semibold text-gray-700 mb-2 text-center"
          >
            {getGreeting()}
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-400 text-base text-center"
          >
            {getEmotionSubtext() || '당신의 마음을 들려주세요'}
          </motion.p>
        </div>

        <div className="flex justify-center mb-8">
          <RecordButton
            isRecording={isRecording}
            duration={duration}
            onStart={handleStartRecording}
            onStop={handleStopRecording}
            onReset={handleResetRecording}
            hasRecording={!!audioBlob}
            onSave={() => setShowModal(true)}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col items-center gap-4"
        >
          <Link to="/history">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3 px-6 py-4 bg-white/60 backdrop-blur-sm rounded-2xl soft-shadow hover:bg-white/80 transition-all cursor-pointer"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-teal-400 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-700">내 기록 보기</p>
                <p className="text-xs text-gray-400">
                  지난 기록과 감정 흐름 확인
                </p>
              </div>
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </motion.div>
          </Link>
        </motion.div>

        {(recordError || sttError) && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-red-400 mt-4 text-sm"
          >
            {recordError || sttError}
          </motion.p>
        )}

        <AnimatePresence>
          {saveSuccess && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              onClick={() => getUserTier() === 'free' && navigate('/settings')}
              className={`fixed inset-x-4 bottom-24 mx-auto max-w-sm px-6 py-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 z-50 transition-all ${
                getUserTier() === 'free' 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white cursor-pointer hover:scale-105' 
                  : 'bg-gradient-to-r from-teal-400 to-emerald-500 text-white'
              }`}
            >
              {getUserTier() === 'free' ? (
                <>
                  <Crown className="w-5 h-5 text-yellow-300 fill-yellow-300 animate-pulse" />
                  <div className="text-left">
                    <p className="font-bold text-sm">기록이 저장되었어요</p>
                    <p className="text-xs text-indigo-100">프리미엄으로 더 깊이 분석해보세요</p>
                  </div>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span className="font-medium">오늘의 마음을 기록했어요</span>
                </>
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      <TranscriptModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        transcript={transcript}
        onConfirm={handleSaveRecord}
        isProcessing={isProcessing}
      />
    </div>
  );
}
