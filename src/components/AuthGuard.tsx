import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

type AuthGuardProps = {
  children: React.ReactNode;
  type: 'auth' | 'onboarding' | 'authenticated';
};

export function AuthGuard({ children, type }: AuthGuardProps) {
  const { isAuthenticated, hasOnboarded, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (type === 'auth' && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (type === 'onboarding' && (!isAuthenticated || hasOnboarded)) {
    return <Navigate to={isAuthenticated ? '/' : '/auth'} replace />;
  }

  if (type === 'authenticated') {
    if (!isAuthenticated) return <Navigate to="/auth" replace />;
    if (!hasOnboarded) return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}