import { ref, onValue } from "firebase/database";
import { rtdb } from "@/lib/firebase";

// --- STORE SYNC ---
export const storeEmitter = new EventTarget();
export const emitMockDataChange = () => setTimeout(() => storeEmitter.dispatchEvent(new Event("change")), 0);

// --- FIREBASE MIRRORS ---
export let mockUsers: any[] = [];
export let mockDashboard: any = {
  caixa: 0, 
  lucros: 0, 
  naRua: 0, 
  total: 0, 
  membros_ativos: 0, 
  emprestimos_ativos: 0, 
  solicitacoes_pendentes: 0
};
export let mockLoans: any[] = [];
export let mockLoanDetails: Record<string, any> = {};
export let mockUserDetails: Record<string, any> = {};
export let mockLoanRequests: any[] = [];
export let mockDepositRequests: any[] = [];
export let mockMembershipRequests: any[] = [];
export let mockAudit: any[] = [];

let isInitialized = false;

export function initFirebaseSync() {
  if (isInitialized) return;
  isInitialized = true;

  onValue(ref(rtdb, 'users'), snap => { 
    mockUsers = snap.val() ? Object.values(snap.val()) : []; 
    emitMockDataChange(); 
  });
  
  onValue(ref(rtdb, 'userDetails'), snap => { 
    mockUserDetails = snap.val() || {}; 
    emitMockDataChange(); 
  });
  
  onValue(ref(rtdb, 'dashboard'), snap => { 
    if (snap.val()) mockDashboard = { ...mockDashboard, ...snap.val() }; 
    emitMockDataChange(); 
  });
  
  onValue(ref(rtdb, 'loans'), snap => { 
    mockLoans = snap.val() ? Object.values(snap.val()) : []; 
    emitMockDataChange(); 
  });
  
  onValue(ref(rtdb, 'loanDetails'), snap => { 
    mockLoanDetails = snap.val() || {}; 
    emitMockDataChange(); 
  });
  
  onValue(ref(rtdb, 'loanRequests'), snap => { 
    mockLoanRequests = snap.val() ? Object.values(snap.val() as Record<string,any>).sort((a,b)=>b.ts - a.ts) : []; 
    emitMockDataChange(); 
  });
  
  onValue(ref(rtdb, 'depositRequests'), snap => { 
    mockDepositRequests = snap.val() ? Object.values(snap.val() as Record<string,any>).sort((a,b)=>b.ts - a.ts) : []; 
    emitMockDataChange(); 
  });
  
  onValue(ref(rtdb, 'membershipRequests'), snap => { 
    mockMembershipRequests = snap.val() ? Object.values(snap.val() as Record<string,any>).sort((a,b)=>b.ts - a.ts) : []; 
    emitMockDataChange(); 
  });
  
  onValue(ref(rtdb, 'audit'), snap => { 
    mockAudit = snap.val() ? Object.values(snap.val() as Record<string,any>).sort((a,b)=>b.ts - a.ts) : []; 
    emitMockDataChange(); 
  });
}
