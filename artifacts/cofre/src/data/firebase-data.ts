import { ref, onValue, set } from "firebase/database";
import { rtdb } from "@/lib/firebase";

// --- STORE SYNC ---
export const storeEmitter = new EventTarget();
export const emitMockDataChange = () => setTimeout(() => storeEmitter.dispatchEvent(new Event("change")), 0);

export interface User {
  id: string;
  nome: string;
  foto: string;
  status: "Ativo" | "Congelado";
  saldo_base: number;
  lucro_acumulado: number;
  pin?: string;
  telefone?: string;
  email?: string;
  profissao?: string;
  cidade?: string;
  bairro?: string;
  nuit?: string;
  endereco?: string;
  nacionalidade?: string;
}

export interface UserDetails {
  user: User;
  emCaixa: number;
  emCirculacao: any[];
  totalEmCirculacao: number;
  totalJuroEsperado: number;
  patrimonioTotal: number;
}

export const dbStore = {
  users: [] as any[],
  dashboard: {
    caixa: 0, lucros: 0, naRua: 0, total: 0, membros_ativos: 0, emprestimos_ativos: 0, solicitacoes_pendentes: 0
  } as any,
  loans: [] as any[],
  loanDetails: {} as Record<string, any>,
  userDetails: {} as Record<string, any>,
  loanRequests: [] as any[],
  depositRequests: [] as any[],
  membershipRequests: [] as any[],
  deletionRequests: [] as any[],
  audit: [] as any[]
};

let isInitialized = false;

export function initFirebaseSync() {
  if (isInitialized) return;
  isInitialized = true;

  onValue(ref(rtdb, 'users'), snap => { 
    dbStore.users = snap.val() ? Object.values(snap.val()) : []; 
    emitMockDataChange(); 
  });
  
  onValue(ref(rtdb, 'userDetails'), snap => { 
    dbStore.userDetails = snap.val() || {}; 
    emitMockDataChange(); 
  });
  
  onValue(ref(rtdb, 'dashboard'), snap => { 
    if (snap.val()) dbStore.dashboard = { ...dbStore.dashboard, ...snap.val() }; 
    emitMockDataChange(); 
  });
  
  onValue(ref(rtdb, 'loans'), snap => { 
    dbStore.loans = snap.val() ? Object.values(snap.val()) : []; 
    emitMockDataChange(); 
  });
  
  onValue(ref(rtdb, 'loanDetails'), snap => { 
    dbStore.loanDetails = snap.val() || {}; 
    emitMockDataChange(); 
  });
  
  onValue(ref(rtdb, 'loanRequests'), snap => { 
    dbStore.loanRequests = snap.val() ? Object.values(snap.val() as Record<string,any>).sort((a,b)=>b.ts - a.ts) : []; 
    emitMockDataChange(); 
  });
  
  onValue(ref(rtdb, 'depositRequests'), snap => { 
    dbStore.depositRequests = snap.val() ? Object.values(snap.val() as Record<string,any>).sort((a,b)=>b.ts - a.ts) : []; 
    emitMockDataChange(); 
  });
  
  onValue(ref(rtdb, 'membershipRequests'), snap => { 
    console.log("[FIREBASE SYNC] membershipRequests arrived:", snap.val());
    dbStore.membershipRequests = snap.val() ? Object.values(snap.val() as Record<string,any>).sort((a,b)=>b.ts - a.ts) : []; 
    emitMockDataChange(); 
  });
  
  onValue(ref(rtdb, 'deletionRequests'), snap => {
    dbStore.deletionRequests = snap.val() ? Object.values(snap.val() as Record<string,any>).sort((a,b)=>b.ts - a.ts) : [];
    emitMockDataChange();
  });

  onValue(ref(rtdb, 'audit'), snap => { 
    dbStore.audit = snap.val() ? Object.values(snap.val() as Record<string,any>).sort((a,b)=>b.ts - a.ts) : []; 
    emitMockDataChange(); 
  });
}

/**
 * Factory Reset: Clears all operational data from the database.
 * This is a critical action and should only be called after double confirmation.
 */
export async function factoryReset() {
  const resetDashboard = {
    caixa: 0,
    lucros: 0,
    naRua: 0,
    total: 0,
    membros_ativos: 0,
    emprestimos_ativos: 0,
    solicitacoes_pendentes: 0
  };

  try {
    // Perform all resets
    await Promise.all([
      set(ref(rtdb, 'users'), null),
      set(ref(rtdb, 'userDetails'), null),
      set(ref(rtdb, 'loans'), null),
      set(ref(rtdb, 'loanDetails'), null),
      set(ref(rtdb, 'loanRequests'), null),
      set(ref(rtdb, 'depositRequests'), null),
      set(ref(rtdb, 'membershipRequests'), null),
      set(ref(rtdb, 'deletionRequests'), null),
      set(ref(rtdb, 'audit'), null),
      set(ref(rtdb, 'dashboard'), resetDashboard)
    ]);
    
    console.log("[FACTORY RESET] Application data has been cleared successfully.");
    return true;
  } catch (error) {
    console.error("[FACTORY RESET] Error clearing data:", error);
    throw error;
  }
}
