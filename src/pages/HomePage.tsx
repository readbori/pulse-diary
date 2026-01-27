import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Sparkles, X, Send, Mic, Heart, Moon, Sun, Cloud, Zap } from 'lucide-react';
import { RecordButton } from '@/components/RecordButton';
import { StreakDisplay } from '@/components/StreakDisplay';
import { TranscriptModal } from '@/components/TranscriptModal';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { saveRecord, updateStreak, getStreak, db } from '@/lib/db';
import type { StreakData } from '@/types';

const DEMO_USER_ID = 'demo-user';
const MAX_FREE_CONSULTS = 5;

interface ConsultUsage {
  count: number;
  weekStart: string;
}

export function HomePage() {
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [consultUsage, setConsultUsage] = useState<ConsultUsage>({ count: 0, weekStart: '' });
  const [showPaywall, setShowPaywall] = useState(false);

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
      const streakData = await getStreak(DEMO_USER_ID);
      if (streakData) {
        setStreak(streakData);
      }
      
      const weekStart = getWeekStart();
      const stored = localStorage.getItem('consultUsage');
      if (stored) {
        const usage = JSON.parse(stored) as ConsultUsage;
        if (usage.weekStart === weekStart) {
          setConsultUsage(usage);
        } else {
          setConsultUsage({ count: 0, weekStart });
        }
      } else {
        setConsultUsage({ count: 0, weekStart });
      }
    };
    loadData();
  }, []);

  const getWeekStart = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek;
    const weekStart = new Date(now.setDate(diff));
    return weekStart.toISOString().split('T')[0];
  };

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
      await saveRecord({
        userId: DEMO_USER_ID,
        createdAt: new Date(),
        audioBlob: audioBlob || undefined,
        transcript,
        duration,
        language: 'ko',
        syncStatus: 'local'
      });

      const updatedStreak = await updateStreak(DEMO_USER_ID);
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

  const handleOpenChat = () => {
    if (consultUsage.count >= MAX_FREE_CONSULTS) {
      setShowPaywall(true);
      return;
    }
    setShowChat(true);
    if (chatMessages.length === 0) {
      setChatMessages([{
        role: 'ai',
        text: '안녕하세요, 오늘 기분이 어떠세요? 편하게 이야기해주세요. 저는 당신의 이야기에 귀 기울이고 있어요.'
      }]);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    
    const newUsage = { 
      count: consultUsage.count + 1, 
      weekStart: consultUsage.weekStart || getWeekStart() 
    };
    setConsultUsage(newUsage);
    localStorage.setItem('consultUsage', JSON.stringify(newUsage));
    
    setTimeout(() => {
      const responses = [
        '그런 마음이 드셨군요. 충분히 이해해요. 조금 더 이야기해주실 수 있을까요?',
        '많이 힘드셨겠어요. 그런 감정을 느끼는 건 자연스러운 거예요.',
        '당신의 감정은 소중해요. 지금 이 순간에도 잘 해내고 계세요.',
        '그 상황에서 그렇게 느끼는 건 당연해요. 스스로를 너무 몰아세우지 마세요.',
        '오늘 하루도 정말 수고했어요. 잠시 깊게 숨을 쉬어볼까요?'
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setChatMessages(prev => [...prev, { role: 'ai', text: randomResponse }]);
    }, 1000);
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '편안한 밤 되고 계신가요?';
    if (hour < 12) return '좋은 아침이에요';
    if (hour < 18) return '오늘 하루 어떠세요?';
    if (hour < 22) return '오늘 하루는 어땠나요?';
    return '편안한 밤 되세요';
  };

  const getTimeIcon = () => {
    const hour = new Date().getHours();
    if (hour < 6 || hour >= 22) return <Moon className="w-5 h-5 text-indigo-400" />;
    if (hour < 12) return <Sun className="w-5 h-5 text-amber-400" />;
    if (hour < 18) return <Cloud className="w-5 h-5 text-sky-400" />;
    return <Heart className="w-5 h-5 text-pink-400" />;
  };

  const remainingConsults = MAX_FREE_CONSULTS - consultUsage.count;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-20 -right-20 w-64 h-64 bg-purple-200/30 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], x: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-20 -left-20 w-64 h-64 bg-pink-200/30 rounded-full blur-3xl"
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
            className="text-3xl font-semibold text-gray-700 mb-3"
          >
            {greeting()}
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-400 font-emotional text-lg"
          >
            당신의 마음을 들려주세요
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
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleOpenChat}
            className="flex items-center gap-3 px-6 py-4 bg-white/60 backdrop-blur-sm rounded-2xl soft-shadow hover:bg-white/80 transition-all"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-700">지금 바로 상담받기</p>
              <p className="text-xs text-gray-400">
                이번 주 {remainingConsults}회 남음
              </p>
            </div>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </motion.button>
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
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="fixed inset-x-4 bottom-24 mx-auto max-w-sm bg-gradient-to-r from-emerald-400 to-teal-400 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 z-50"
            >
              <Sparkles className="w-5 h-5" />
              <span className="font-medium">오늘의 마음을 기록했어요</span>
            </motion.div>
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

      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
            onClick={() => setShowChat(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl h-[80vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">마음 상담</h3>
                    <p className="text-xs text-gray-400">{remainingConsults}회 남음</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowChat(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      <p className="text-sm leading-relaxed font-emotional">{msg.text}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="p-4 border-t border-gray-100">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="마음을 편하게 이야기해주세요..."
                    className="flex-1 px-4 py-3 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim()}
                    className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPaywall && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPaywall(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-sm w-full text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                이번 주 무료 상담을 모두 사용했어요
              </h3>
              
              <p className="text-gray-500 mb-6 font-emotional">
                Advanced로 업그레이드하면<br />
                무제한 상담을 받을 수 있어요
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => setShowPaywall(false)}
                  className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-medium hover:opacity-90 transition-opacity"
                >
                  ₩13,900 평생 이용권 구매
                </button>
                
                <button
                  onClick={() => setShowPaywall(false)}
                  className="w-full py-3 text-gray-400 text-sm"
                >
                  다음 주까지 기다릴게요
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
