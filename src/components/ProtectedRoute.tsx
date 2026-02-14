import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Check if user has completed setup (either through login or guest onboarding)
  const hasUserId = localStorage.getItem('pulse_user_id');
  const hasOnboarded = localStorage.getItem('pulse_onboarded');
  
  // If user has neither a user ID nor completed onboarding, redirect to landing
  if (!hasUserId && !hasOnboarded) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}
