import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "./components/MainLayout";
import Documents from "./pages/Documents";
import AuthPage from "./pages/Auth";
import OnboardingPage from "./pages/Onboarding";
import Reader from "./pages/Reader";
import { SidebarProvider } from "./components/ui/sidebar";
import { useEffect, useState } from "react";
import { supabase } from "./integrations/supabase/client";
import { AuthProvider } from "./contexts/AuthContext";
import { AuthGuard } from "./components/AuthGuard";
import { TopicsProvider } from "./contexts/TopicsContext";
import Archive from "./pages/Archive";
import Notes from "./pages/Notes";

const queryClient = new QueryClient();

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <TopicsProvider>
              <SidebarProvider>
                <Routes>
                  <Route
                    path="/auth"
                    element={<AuthGuard type="auth"><AuthPage /></AuthGuard>}
                  />
                  <Route
                    path="/onboarding"
                    element={<AuthGuard type="onboarding"><OnboardingPage /></AuthGuard>}
                  />
                  <Route
                    path="/reader/:documentId"
                    element={<AuthGuard type="authenticated"><Reader /></AuthGuard>}
                  />
                  <Route
                    path="/archive"
                    element={<AuthGuard type="authenticated"><MainLayout><Archive /></MainLayout></AuthGuard>}
                  />
                  <Route
                    path="/notes"
                    element={<AuthGuard type="authenticated"><MainLayout><Notes /></MainLayout></AuthGuard>}
                  />
                  <Route
                    path="/*"
                    element={<AuthGuard type="authenticated"><MainLayout><Documents /></MainLayout></AuthGuard>}
                  />
                </Routes>
                <Toaster />
              </SidebarProvider>
            </TopicsProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
