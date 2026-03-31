import { useState } from "react";
import { useMockDataSync } from "@/hooks/use-mock-store";
import { dbStore } from "@/data/firebase-data";
import { useToast } from "@/hooks/use-toast";
import { ref, update } from "firebase/database";
import { rtdb } from "@/lib/firebase";

export function useUsers() {
  useMockDataSync();
  return {
    data: dbStore.users,
    isLoading: false,
    isError: false,
  };
}

export function useUser(id: string) {
  useMockDataSync();
  return {
    data: dbStore.userDetails[id] || null,
    isLoading: false,
    isError: false,
  };
}

export function useUpdateUser() {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  return {
    isPending,
    mutate: () => {},
    mutateAsync: async ({ userId, data }: { userId: string; data: { status?: string; nome?: string; saldo_base?: number } }) => {
      setIsPending(true);
      try {
        const user = dbStore.users.find(u => u.id === userId);
        if (!user) throw new Error("Membro não encontrado");

        const updates: any = {};
        
        if (data.status) {
          updates[`users/${userId}/status`] = data.status;
          updates[`userDetails/${userId}/user/status`] = data.status;
          const auditId = "a" + Date.now();
          updates[`audit/${auditId}`] = {
            id: auditId,
            ts: Math.floor(Date.now() / 1000),
            tipo: "CONGELAMENTO",
            desc: `Conta de ${user.nome} alterada para ${data.status}.`,
            valor: 0,
            user: "Admin"
          };
        }
        if (data.nome) {
          updates[`users/${userId}/nome`] = data.nome;
          updates[`userDetails/${userId}/user/nome`] = data.nome;
        }

        await update(ref(rtdb), updates);
        toast({ title: "✅ Membro actualizado", description: "As alterações foram guardadas na Cloud." });
      } catch (err) {
        console.error("[useUpdateUser] Erro:", err);
        toast({ title: "Erro", description: "Não foi possível actualizar o membro.", variant: "destructive" });
      } finally {
        setIsPending(false);
      }
    },
  };
}
export function useDeleteUser() {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  return {
    isPending,
    mutateAsync: async ({ userId }: { userId: string }) => {
      setIsPending(true);
      try {
        const user = dbStore.users.find(u => u.id === userId);
        if (!user) throw new Error("Membro não encontrado");

        // Regra de segurança: Bloquear exclusão se houver empréstimo activo
        const activeLoans = dbStore.loans.filter(l => l.user_id === userId && l.status !== "Liquidado");
        if (activeLoans.length > 0) {
          toast({ 
            title: "Operação Bloqueada", 
            description: "Não é possível eliminar um membro com empréstimos activos.", 
            variant: "destructive" 
          });
          return;
        }

        const updates: any = {};
        updates[`users/${userId}`] = null;
        updates[`userDetails/${userId}`] = null;
        
        // Descontar contador de membros activos
        const currentCount = dbStore.dashboard.membros_ativos || 0;
        updates[`dashboard/membros_ativos`] = Math.max(0, currentCount - 1);

        const auditId = "a" + Date.now();
        updates[`audit/${auditId}`] = {
          id: auditId,
          ts: Math.floor(Date.now() / 1000),
          tipo: "REMOCAO_MEMBRO",
          desc: `Membro ${user.nome} foi eliminado do sistema pelo administrador.`,
          valor: user.saldo_base,
          user: "Admin"
        };

        await update(ref(rtdb), updates);
        toast({ title: "🗑️ Membro eliminado", description: "O registo foi removido permanentemente." });
      } catch (err) {
        console.error("[useDeleteUser] Erro:", err);
        toast({ title: "Erro", description: "Falha ao eliminar membro.", variant: "destructive" });
      } finally {
        setIsPending(false);
      }
    },
  };
}
