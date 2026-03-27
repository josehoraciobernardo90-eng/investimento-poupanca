import { useState } from "react";
import { useMockDataSync } from "@/hooks/use-mock-store";
import { mockUsers, mockUserDetails } from "@/data/mock-data";
import { useToast } from "@/hooks/use-toast";
import { ref, update } from "firebase/database";
import { rtdb } from "@/lib/firebase";

export function useUsers() {
  useMockDataSync();
  return {
    data: mockUsers,
    isLoading: false,
    isError: false,
  };
}

export function useUser(id: string) {
  useMockDataSync();
  return {
    data: mockUserDetails[id] || null,
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
        const user = mockUsers.find(u => u.id === userId);
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
