import { dbStore } from './firebase-data';
export * from './firebase-data'; // keep emitMockDataChange, storeEmitter

const createArrayProxy = (key: keyof typeof dbStore) => 
  new Proxy([] as any[], { 
    get: (t, p) => (dbStore[key] as any)[p], 
    set: (t, p, v) => { (dbStore[key] as any)[p] = v; return true; } 
  });

const createObjectProxy = (key: keyof typeof dbStore) => 
  new Proxy({} as any, { 
    get: (t, p) => (dbStore[key] as any)[p], 
    set: (t, p, v) => { (dbStore[key] as any)[p] = v; return true; },
    ownKeys: () => Reflect.ownKeys(dbStore[key]),
    getOwnPropertyDescriptor: (t, p) => Reflect.getOwnPropertyDescriptor(dbStore[key], p)
  });

export const mockUsers = createArrayProxy('users');
export const mockDashboard = createObjectProxy('dashboard');
export const mockLoans = createArrayProxy('loans');
export const mockLoanDetails = createObjectProxy('loanDetails');
export const mockUserDetails = createObjectProxy('userDetails');
export const mockLoanRequests = createArrayProxy('loanRequests');
export const mockDepositRequests = createArrayProxy('depositRequests');
export const mockMembershipRequests = createArrayProxy('membershipRequests');
export const mockAudit = createArrayProxy('audit');
