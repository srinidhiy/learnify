
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
import { AuthProvider } from "./contexts/AuthContext";
import { AuthGuard } from "./components/AuthGuard";

const queryClient = new QueryClient();

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
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
                  path="/*"
                  element={<AuthGuard type="authenticated"><MainLayout><Dashboard /></MainLayout></AuthGuard>}
                />
            </Routes>
          </SidebarProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
