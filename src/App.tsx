import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ToastProvider } from '@/components/ui/Toast';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navigation } from '@/components/Navigation';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { HomePage } from '@/pages/HomePage';
import { HistoryPage } from '@/pages/HistoryPage';
import { StatsPage } from '@/pages/StatsPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import './index.css';

function AuthCallback() {
  const { loading, user } = useAuth();
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user) return;

    // 빠른 체크: 이미 온보딩 완료한 유저
    if (localStorage.getItem('pulse_onboarded')) {
      setRedirectTo('/home');
      return;
    }

    // 느린 체크: Supabase에서 프로필 확인 (다른 기기에서 온 기존 유저)
    const checkProfile = async () => {
      try {
        const { data } = await supabase.from('user_profiles')
          .select('mbti, occupation')
          .eq('user_id', user.id)
          .single();

        if (data?.mbti || data?.occupation) {
          localStorage.setItem('pulse_onboarded', 'true');
          setRedirectTo('/home');
        } else {
          setRedirectTo('/onboarding');
        }
      } catch {
        setRedirectTo('/onboarding');
      }
    };
    checkProfile();
  }, [loading, user]);

  if (loading || !redirectTo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return <Navigate to={redirectTo} replace />;
}

function AppContent() {
  const location = useLocation();
  const hideNav = ['/', '/onboarding', '/login', '/auth/callback'].includes(location.pathname);

  return (
    <>
      {!hideNav && <Navigation />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
        <Route path="/stats" element={<ProtectedRoute><StatsPage /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
