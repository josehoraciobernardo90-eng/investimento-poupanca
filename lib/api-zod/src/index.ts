export * from "./generated/api";
export * from "./generated/types";

// Resolvendo ambiguidades de nomes entre esquemas Zod (api.ts) e Interfaces (types)
export type { 
  CreateDepositRequestBody, 
  CreateLoanRequestBody, 
  CreateUserBody, 
  UpdateLoanBody, 
  UpdateUserBody 
} from "./generated/types";
