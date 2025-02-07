
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "./components/MainLayout";
import Dashboard from "./pages/Dashboard";
import AuthPage from "./pages/Auth";
import OnboardingPage from "./pages/Onboarding";
import { SidebarProvider } from "./components/ui/sidebar";
import { useEffect, useState } from "react";
import { supabase } from "./integrations/supabase/client";

const queryClient = new QueryClient();

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);

        if (session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('has_onboarded')
            .eq('id', session.user.id)
            .single();
          
          setHasOnboarded(profile?.has_onboarded ?? false);
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsAuthenticated(!!session);
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('has_onboarded')
          .eq('id', session.user.id)
          .single();
        
        setHasOnboarded(profile?.has_onboarded ?? false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <SidebarProvider>
            <Routes>
              <Route
                path="/auth"
                element={
                  isAuthenticated ? (
                    <Navigate to="/" replace />
                  ) : (
                    <AuthPage />
                  )
                }
              />
              <Route
                path="/onboarding"
                element={
                  !isAuthenticated ? (
                    <Navigate to="/auth" replace />
                  ) : hasOnboarded ? (
                    <Navigate to="/" replace />
                  ) : (
                    <OnboardingPage />
                  )
                }
              />
              <Route
                path="/*"
                element={
                  !isAuthenticated ? (
                    <Navigate to="/auth" replace />
                  ) : !hasOnboarded ? (
                    <Navigate to="/onboarding" replace />
                  ) : (
                    <MainLayout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                      </Routes>
                      <Toaster />
                      <Sonner />
                    </MainLayout>
                  )
                }
              />
            </Routes>
          </SidebarProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
