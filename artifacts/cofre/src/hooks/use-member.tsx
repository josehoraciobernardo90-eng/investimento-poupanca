import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { dbStore, type User, type UserDetails } from "@/data/firebase-data";
import { useToast } from "@/hooks/use-toast";
import { useMockDataSync } from "@/hooks/use-mock-store";

import { ref, update } from "firebase/database";
import { rtdb } from "@/lib/firebase";

interface MemberContextType {
  isMember: boolean;
  memberUser: User | null;
  memberDetails: UserDetails | null;
  login: (phone: string, pin: string) => boolean;
  logout: () => void;
  setupProfile: (photoUrl: string) => Promise<boolean>;
}

const MemberContext = createContext<MemberContextType | undefined>(undefined);

export function MemberProvider({ children }: { children: ReactNode }) {
  useMockDataSync();
  const { toast } = useToast();
  const [memberId, setMemberId] = useState(() => sessionStorage.getItem("member_id"));
  
  const [tick, setTick] = useState(0);

  useEffect(() => {
    import("@/data/firebase-data").then(({ storeEmitter }) => {
      const handler = () => setTick(t => t + 1);
      storeEmitter.addEventListener("change", handler);
      return () => storeEmitter.removeEventListener("change", handler);
    });
  }, []);

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
        const supportPhone = dbStore.dashboard.support_phone || "pelo painel de suporte";
        toast({ 
          title: "Acesso Restrito", 
          description: `A sua conta foi totalmente congelada. Entre em contacto com o Suporte: ${supportPhone}`, 
          variant: "destructive" 
        });
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

  const setupProfile = async (photoUrl: string) => {
    if (!memberId) return false;
    try {
      const updates: any = {};
      updates[`users/${memberId}/foto`] = photoUrl;
      updates[`users/${memberId}/needsProfileSetup`] = null;
      updates[`userDetails/${memberId}/user/foto`] = photoUrl;
      updates[`userDetails/${memberId}/user/needsProfileSetup`] = null;
      
      await update(ref(rtdb), updates);

      // Force local update before the Firebase listener catches it
      // This prevents the React DOM from crashing during the transition
      const u = dbStore.users.find(u => u.id === memberId);
      if (u) {
        u.foto = photoUrl;
        delete u.needsProfileSetup;
      }
      if (dbStore.userDetails[memberId] && dbStore.userDetails[memberId].user) {
        dbStore.userDetails[memberId].user.foto = photoUrl;
        delete dbStore.userDetails[memberId].user.needsProfileSetup;
      }
      setTick(t => t + 1);

      toast({ title: "Perfil Atualizado", description: "O seu perfil corporativo foi configurado com sucesso." });
      return true;
    } catch (err) {
      console.error("[setupProfile] Erro:", err);
      toast({ title: "Erro na Gravação", description: "Não foi possível salvar a sua foto.", variant: "destructive" });
      return false;
    }
  };

  return (
    <MemberContext.Provider value={{ isMember, memberUser, memberDetails, login, logout, setupProfile }}>
      {children}
    </MemberContext.Provider>
  );
}

export function useMember() {
  const context = useContext(MemberContext);
  if (!context) throw new Error("useMember must be used within a MemberProvider");
  return context;
}
