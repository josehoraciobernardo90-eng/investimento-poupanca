import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AppLayout } from "@/components/layout/AppLayout";
import DashboardPage from "@/pages/dashboard";
import MembersPage from "@/pages/members/index";
import MemberDetailPage from "@/pages/members/detail";
import LoansPage from "@/pages/loans/index";
import LoanDetailPage from "@/pages/loans/detail";
import RequestsPage from "@/pages/requests/index";
import AuditPage from "@/pages/audit/index";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
