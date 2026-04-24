import { Switch, Route, Router as WouterRouter } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Component, ReactNode, useState } from "react";
import { AdminProvider } from "@/hooks/use-admin";
import { MemberProvider, useMember } from "@/hooks/use-member";
import MemberDashboard from "@/pages/members/dashboard";
import { ProfileSetupScreen } from "@/components/members/ProfileSetupScreen";

import { AppLayout } from "@/components/layout/AppLayout";
import { SplashScreen } from "@/components/layout/SplashScreen";
import DashboardPage from "@/pages/dashboard";
import MembersPage from "@/pages/members/index";
import MemberDetailPage from "@/pages/members/detail";
import LoansPage from "@/pages/loans/index";
import LoanDetailPage from "@/pages/loans/detail";
import RequestsPage from "@/pages/requests/index";
import AuditPage from "@/pages/audit/index";
import NotFound from "@/pages/not-found";
import { LandingPage } from "@/components/layout/LandingPage";
import { useAdmin } from "@/hooks/use-admin";
import { FrozenAccountScreen } from "@/components/layout/FrozenAccountScreen";
import { GogomaBlinkEngine } from "@/components/GogomaBlinkEngine";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
});

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; message: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message ?? "Erro desconhecido" };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error("[ErrorBoundary] Erro apanhado:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
          <div className="glass-panel rounded-2xl p-8 max-w-md w-full text-center space-y-4 border border-destructive/30">
            <div className="text-4xl">⚠️</div>
            <h2 className="text-xl font-bold text-white">Algo correu mal</h2>
            <p className="text-muted-foreground text-sm">{this.state.message}</p>
            <button
              onClick={() => { this.setState({ hasError: false, message: "" }); window.location.reload(); }}
              className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
            >
              Recarregar Painel
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={DashboardPage} />
        
        <Route path="/membros" component={MembersPage} />
        <Route path="/membros/:id" component={MemberDetailPage} />
        
        <Route path="/emprestimos" component={LoansPage} />
        <Route path="/emprestimos/:id" component={LoanDetailPage} />
        
        <Route path="/solicitacoes" component={RequestsPage} />
        
        <Route path="/auditoria" component={AuditPage} />
        
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function AppContent() {
  const { isAdmin } = useAdmin();
  const { isMember, memberUser } = useMember();
  
  if (isAdmin) {
    return (
      <WouterRouter>
        <Router />
      </WouterRouter>
    );
  }

  if (isMember) {
    if (memberUser?.status === "Congelado") {
      return <FrozenAccountScreen />;
    }

    return (
      <AnimatePresence mode="wait">
        <GogomaBlinkEngine />
        {memberUser?.needsProfileSetup ? (
          <ProfileSetupScreen key="setup-screen" />
        ) : (
          <MemberDashboard key="main-dashboard" />
        )}
      </AnimatePresence>
    );
  }

  return <LandingPage />;
}

function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <ErrorBoundary>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      
      {!showSplash && (
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <AdminProvider>
              <MemberProvider>
                <AppContent />
                <Toaster />
              </MemberProvider>
            </AdminProvider>
          </TooltipProvider>
        </QueryClientProvider>
      )}
    </ErrorBoundary>
  );
}

export default App;

