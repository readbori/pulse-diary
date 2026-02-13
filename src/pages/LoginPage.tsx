import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export function LoginPage() {
  const { signInWithGoogle, loading } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Login failed:', error);
      alert('로그인에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleSkip = () => {
    navigate('/onboarding');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-gradient-to-br from-indigo-100/50 via-white to-teal-100/50 -z-10 animate-pulse-soft" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm text-center"
      >
        <div className="mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-teal-400 rounded-3xl mx-auto mb-6 shadow-xl flex items-center justify-center transform rotate-3">
             <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Pulse Diary</h1>
          <p className="text-gray-500">당신의 감정, 당신의 이야기</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-4 bg-white rounded-2xl shadow-md border border-gray-100 flex items-center justify-center gap-3 hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed group"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span className="font-semibold text-gray-700 group-hover:text-gray-900">구글로 시작하기</span>
              </>
            )}
          </button>

          <button
            onClick={handleSkip}
            className="w-full py-3 text-sm text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1 transition-colors"
          >
            먼저 둘러보기
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      <div className="absolute bottom-8 text-center">
        <p className="text-xs text-gray-300">
          로그인 시 개인정보처리방침 및 이용약관에 동의하게 됩니다.
        </p>
      </div>
    </div>
  );
}
