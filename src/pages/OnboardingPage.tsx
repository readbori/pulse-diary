import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Check, User, Briefcase, Heart, Calendar } from 'lucide-react';
import { saveProfile, saveSettings } from '@/lib/db';
import type { UserProfile, UserSettings } from '@/types';

export function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [occupation, setOccupation] = useState('');
  const [interests, setInterests] = useState<string[]>([]);

  const totalSteps = 4;

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      await completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    const userId = crypto.randomUUID();
    const now = new Date();

    const profile: UserProfile = {
      userId,
      name,
      birthYear: parseInt(ageGroup) || undefined, // Storing age group as rough birth year or just string if changed
      occupation,
      interests,
      createdAt: now,
      updatedAt: now
    };

    // Default settings
    const settings: UserSettings = {
      userId,
      dailyReminderEnabled: false,
      dailyReminderTime: "21:00",
      reminderIntervalDays: 1,
      weeklyReportEnabled: true,
      weeklyReportDay: 0, // Sunday
      weeklyReportTime: "09:00",
      autoDeleteAudio: false,
      audioDeleteDays: 30,
      language: 'ko',
      theme: 'system'
    };

    await saveProfile(profile);
    await saveSettings(settings);
    
    // Store userId in localStorage for simple session management
    localStorage.setItem('pulse_user_id', userId);
    
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
      case 4: return interests.length > 0;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-purple-400 to-pink-400"
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
                  className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4"
                >
                  <User className="w-8 h-8 text-purple-500" />
                </motion.div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">반가워요!</h2>
                <p className="text-gray-500">어떻게 불러드리면 될까요?</p>
              </div>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="닉네임을 입력해주세요"
                className="w-full p-4 text-lg text-center border-b-2 border-purple-100 focus:border-purple-400 outline-none bg-transparent transition-colors placeholder:text-gray-300"
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
                <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-pink-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">연령대가 어떻게 되시나요?</h2>
                <p className="text-gray-500">비슷한 고민을 가진 분들과 연결해드릴게요</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {['10대', '20대', '30대', '40대', '50대 이상'].map((age) => (
                  <button
                    key={age}
                    onClick={() => setAgeGroup(age)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      ageGroup === age
                        ? 'border-pink-400 bg-pink-50 text-pink-600 font-medium'
                        : 'border-gray-100 hover:border-pink-200 text-gray-600'
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
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-8 h-8 text-blue-500" />
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
                        ? 'border-blue-400 bg-blue-50 text-blue-600 font-medium'
                        : 'border-gray-100 hover:border-blue-200 text-gray-600'
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
                <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-rose-500" />
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
                        ? 'border-rose-400 bg-rose-50 text-rose-600 font-medium'
                        : 'border-gray-100 hover:border-rose-200 text-gray-600'
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
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-xl'
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
