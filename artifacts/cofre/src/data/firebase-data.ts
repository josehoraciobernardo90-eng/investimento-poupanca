import { ref, onValue } from "firebase/database";
import { rtdb } from "@/lib/firebase";

// --- STORE SYNC ---
export const storeEmitter = new EventTarget();
export const emitMockDataChange = () => setTimeout(() => storeEmitter.dispatchEvent(new Event("change")), 0);

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
  
  onValue(ref(rtdb, 'audit'), snap => { 
    dbStore.audit = snap.val() ? Object.values(snap.val() as Record<string,any>).sort((a,b)=>b.ts - a.ts) : []; 
    emitMockDataChange(); 
  });
}
