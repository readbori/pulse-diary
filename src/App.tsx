import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { LandingPage } from '@/pages/LandingPage';
import { HomePage } from '@/pages/HomePage';
import { HistoryPage } from '@/pages/HistoryPage';
import { StatsPage } from '@/pages/StatsPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { SettingsPage } from '@/pages/SettingsPage';
import './index.css';

function AppContent() {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const isOnboarding = location.pathname === '/onboarding';

  return (
    <>
      {!isLanding && !isOnboarding && <Navigation />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
