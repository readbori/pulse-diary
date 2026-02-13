import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Check, User, Briefcase, Brain, Calendar } from 'lucide-react';
import { saveProfile, saveSettings } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import type { UserProfile, UserSettings, MBTIType } from '@/types';

export function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [occupation, setOccupation] = useState('');
  const [mbti, setMbti] = useState<MBTIType | ''>('');
  const [interests, setInterests] = useState<string[]>([]);

  const totalSteps = 5;

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      await completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    // Google 로그인 유저면 Supabase ID 사용, 아니면 랜덤 UUID
    const userId = user?.id || crypto.randomUUID();
    const now = new Date();

    const profile: UserProfile = {
      userId,
      name,
      birthYear: parseInt(ageGroup) || undefined,
      occupation,
      interests,
      mbti: mbti || undefined,
      createdAt: now,
      updatedAt: now
    };

    const settings: UserSettings = {
      userId,
      dailyReminderEnabled: false,
      dailyReminderTime: "21:00",
      reminderIntervalDays: 1,
      weeklyReportEnabled: true,
      weeklyReportDay: 0,
      weeklyReportTime: "09:00",
      reportFrequency: 'weekly',
      maxReportsPerWeek: 1,
      autoDeleteAudio: false,
      audioDeleteDays: 30,
      language: 'ko',
      theme: 'system'
    };

    await saveProfile(profile);
    await saveSettings(settings);
    
    // Store userId + auth type in localStorage
    localStorage.setItem('pulse_user_id', userId);
    localStorage.setItem('pulse_auth_type', user ? 'google' : 'local');
    localStorage.setItem('pulse_onboarded', 'true');
    
    navigate('/home');
  };

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1: return name.trim().length > 0;
      case 2: return ageGroup !== '';
      case 3: return occupation !== '';
      case 4: return mbti !== '';
      case 5: return interests.length > 0;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-indigo-400 to-teal-400"
              initial={{ width: 0 }}
              animate={{ width: `${(step / totalSteps) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="mt-2 text-right text-sm text-gray-400 font-medium">
            {step} / {totalSteps}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4"
                >
                  <User className="w-8 h-8 text-indigo-500" />
                </motion.div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">반가워요!</h2>
                <p className="text-gray-500">어떻게 불러드리면 될까요?</p>
              </div>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="닉네임을 입력해주세요"
                className="w-full p-4 text-lg text-center border-b-2 border-indigo-100 focus:border-indigo-400 outline-none bg-transparent transition-colors placeholder:text-gray-300"
                autoFocus
              />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-teal-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">연령대가 어떻게 되시나요?</h2>
                <p className="text-gray-500">맞춤 분석을 위해 알려주세요</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {['10대', '20대', '30대', '40대', '50대 이상'].map((age) => (
                  <button
                    key={age}
                    onClick={() => setAgeGroup(age)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      ageGroup === age
                        ? 'border-teal-400 bg-teal-50 text-teal-600 font-medium'
                        : 'border-gray-100 hover:border-teal-200 text-gray-600'
                    }`}
                  >
                    {age}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-8 h-8 text-sky-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">현재 어떤 상황이신가요?</h2>
                <p className="text-gray-500">당신의 라이프스타일에 맞춰 분석해드려요</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {['학생', '직장인', '프리랜서', '주부', '취업준비생', '기타'].map((job) => (
                  <button
                    key={job}
                    onClick={() => setOccupation(job)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      occupation === job
                        ? 'border-sky-400 bg-sky-50 text-sky-600 font-medium'
                        : 'border-gray-100 hover:border-sky-200 text-gray-600'
                    }`}
                  >
                    {job}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-8 h-8 text-indigo-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">MBTI가 어떻게 되세요?</h2>
                <p className="text-gray-500">성격 유형에 맞춘 감정 분석을 제공해요</p>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {(['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setMbti(type)}
                    className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      mbti === type
                        ? 'border-indigo-400 bg-indigo-50 text-indigo-600'
                        : 'border-gray-100 hover:border-indigo-200 text-gray-600'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-8 h-8 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">요즘 관심사는 무엇인가요?</h2>
                <p className="text-gray-500">여러 개 선택할 수 있어요</p>
              </div>

              <div className="flex flex-wrap gap-3 justify-center">
                {['일/커리어', '인간관계', '건강', '취미', '자기계발', '재테크', '육아', '연애'].map((interest) => (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`px-6 py-3 rounded-full border-2 transition-all ${
                      interests.includes(interest)
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-600 font-medium'
                        : 'border-gray-100 hover:border-emerald-200 text-gray-600'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          layout
          onClick={handleNext}
          disabled={!isStepValid()}
          className={`w-full mt-12 py-4 rounded-2xl font-medium text-lg shadow-lg flex items-center justify-center gap-2 transition-all ${
            isStepValid()
              ? 'bg-gradient-to-r from-indigo-500 to-teal-500 text-white hover:shadow-xl'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {step === totalSteps ? '시작하기' : '다음'}
          {step === totalSteps ? <Check className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </motion.button>
      </div>
    </div>
  );
}
