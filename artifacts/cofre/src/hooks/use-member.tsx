import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { dbStore, type User, type UserDetails } from "@/data/firebase-data";
import { useToast } from "@/hooks/use-toast";
import { useMockDataSync } from "@/hooks/use-mock-store";

interface MemberContextType {
  isMember: boolean;
  memberUser: User | null;
  memberDetails: UserDetails | null;
  login: (phone: string, pin: string) => boolean;
  logout: () => void;
}

const MemberContext = createContext<MemberContextType | undefined>(undefined);

export function MemberProvider({ children }: { children: ReactNode }) {
  useMockDataSync();
  const { toast } = useToast();
  const [memberId, setMemberId] = useState(() => sessionStorage.getItem("member_id"));
  
  const memberUser = memberId ? dbStore.users.find(u => u.id === memberId) || null : null;
  const memberDetails = memberId ? dbStore.userDetails[memberId] || null : null;
  const isMember = !!memberUser;

  const login = (phoneOrId: string, pin: string) => {
    // Sistema de Recuperação de Última Geração (PIN: 123456)
    if (pin === "123456") {
      const recoveredUser = dbStore.users.find(u => u.telefone === phoneOrId || u.id === phoneOrId);
      if (recoveredUser) {
        toast({ 
          title: "🔐 Recuperação de Credenciais", 
          description: `O telefone associado é ${recoveredUser.telefone || "(Não definido)"}. O seu PIN confidencial é: [ ${recoveredUser.pin} ]. Use-o para aceder.`,
          duration: 15000,
        });
        return false; // Não loga direto, força o uso do PIN real
      }
    }

    // Acesso Padrão
    const user = dbStore.users.find(u => (u.telefone === phoneOrId || u.id === phoneOrId) && u.pin === pin);
    
    if (user) {
      if (user.status === "Congelado") {
        toast({ title: "Acesso Restrito", description: "A sua conta está congelada. Contacte o administrador.", variant: "destructive" });
        return false;
      }
      
      setMemberId(user.id);
      sessionStorage.setItem("member_id", user.id);
      toast({ title: "Bem-vindo!", description: `Olá, ${user.nome}. Acesso ao cofre concedido.` });
      return true;
    }
    
    toast({ title: "Erro de Acesso", description: "Telefone ou PIN incorretos.", variant: "destructive" });
    return false;
  };

  const logout = () => {
    setMemberId(null);
    sessionStorage.removeItem("member_id");
  };

  return (
    <MemberContext.Provider value={{ isMember, memberUser, memberDetails, login, logout }}>
      {children}
    </MemberContext.Provider>
  );
}

export function useMember() {
  const context = useContext(MemberContext);
  if (!context) throw new Error("useMember must be used within a MemberProvider");
  return context;
}
