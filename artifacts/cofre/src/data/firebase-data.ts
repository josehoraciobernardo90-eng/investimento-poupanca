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
  bi?: string;
  endereco?: string;
  nacionalidade?: string;
  conjuge_nome?: string;
  conjuge_numero?: string;
  irmao_nome?: string;
  irmao_numero?: string;
  parente_nome?: string;
  parente_numero?: string;
  zona?: string;
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
  profileEditRequests: [] as any[],
  liquidationRequests: [] as any[],
  audit: [] as any[],
  adminComissao: { total: 0, registros: [] as any[] } as any,
  notifications: [] as any[],
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

  onValue(ref(rtdb, 'profileEditRequests'), snap => {
    dbStore.profileEditRequests = snap.val() ? Object.values(snap.val() as Record<string,any>).sort((a,b)=>b.ts - a.ts) : [];
    emitMockDataChange();
  });

  onValue(ref(rtdb, 'liquidationRequests'), snap => {
    dbStore.liquidationRequests = snap.val() ? Object.values(snap.val() as Record<string,any>).sort((a,b)=>b.ts - a.ts) : [];
    emitMockDataChange();
  });

  onValue(ref(rtdb, 'adminComissao'), snap => {
    if (snap.val()) {
      (dbStore as any).adminComissao = {
        total: snap.val().total || 0,
        registros: snap.val().registros
          ? Object.values(snap.val().registros as Record<string,any>).sort((a: any, b: any) => b.ts - a.ts)
          : []
      };
    } else {
      (dbStore as any).adminComissao = { total: 0, registros: [] };
    }
    emitMockDataChange();
  });

  onValue(ref(rtdb, 'audit'), snap => { 
    dbStore.audit = snap.val() ? Object.values(snap.val() as Record<string,any>).sort((a,b)=>b.ts - a.ts) : []; 
    emitMockDataChange(); 
  });

  onValue(ref(rtdb, 'notifications'), snap => {
    dbStore.notifications = snap.val() ? Object.values(snap.val() as Record<string,any>) : [];
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
      set(ref(rtdb, 'profileEditRequests'), null),
      set(ref(rtdb, 'liquidationRequests'), null),
      set(ref(rtdb, 'audit'), null),
      set(ref(rtdb, 'notifications'), null),
      set(ref(rtdb, 'adminComissao'), null),
      set(ref(rtdb, 'dashboard'), resetDashboard)
    ]);
    
    console.log("[FACTORY RESET] Application data has been cleared successfully.");
    return true;
  } catch (error) {
    console.error("[FACTORY RESET] Error clearing data:", error);
    throw error;
  }
}
