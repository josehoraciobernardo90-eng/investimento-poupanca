import { useState } from "react";
import { useMockDataSync } from "@/hooks/use-mock-store";
import { formatMT } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ref, update } from "firebase/database";
import { rtdb } from "@/lib/firebase";
import { dbStore } from "@/data/firebase-data";

export function useRequests() {
  useMockDataSync();
  return {
    memberships: dbStore.membershipRequests,
    loans: dbStore.loanRequests,
    deposits: dbStore.depositRequests,
    profileEdits: dbStore.profileEditRequests,
    deletionRequests: dbStore.deletionRequests,
    isLoading: false,
    isError: false,
  };
}

export function useCreateLoanRequest() {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  return {
    isPending,
    mutateAsync: async ({ data }: { data: { user_id: string; valor: number; motivo: string } }) => {
      setIsPending(true);
      try {
        const userDetail = dbStore.userDetails[data.user_id];
        if (!userDetail) throw new Error("Membro não encontrado");

        // Regra: o membro pode pedir até 150% do seu saldo em caixa
        // (ou seja, saldo + 50% do saldo). Exemplo: 10.000 MT → limite 15.000 MT
        const limiteTotal = userDetail.emCaixa * 1.50;
        const emprestimosAtivos = dbStore.loans.filter(l => l.user_id === data.user_id && l.status !== "Liquidado");
        const dividaAtiva = emprestimosAtivos.reduce((acc, l) => acc + l.total_devido, 0);
        const limiteDisponivel = Math.max(0, limiteTotal - dividaAtiva);

        console.debug(`[useCreateLoanRequest] emCaixa=${userDetail.emCaixa} | limiteTotal(150%)=${limiteTotal} | dividaAtiva=${dividaAtiva} | limiteDisponivel=${limiteDisponivel} | valorPedido=${data.valor}`);

        if (data.valor > limiteDisponivel) {
          toast({ title: "Limite Excedido", description: `O valor máximo permitido é o seu saldo + 50% (${formatMT(limiteTotal)}). Limite disponível: ${formatMT(limiteDisponivel)}.`, variant: "destructive" });
          throw new Error("Limite excedido");
        }

        const newReqId = "lr" + Date.now();
        const newReq = {
          id: newReqId,
          user_id: data.user_id,
          user_nome: userDetail.user.nome || "Desconhecido",
          user_foto: userDetail.user.foto || "??",
          valor: data.valor,
          motivo: data.motivo,
          ts: Math.floor(Date.now() / 1000),
          status: "Pendente" as const
        };

        const updates: any = {};
        updates[`loanRequests/${newReqId}`] = newReq;
        
        const auditId = "a" + Date.now();
        updates[`audit/${auditId}`] = {
          id: auditId,
          ts: Math.floor(Date.now() / 1000),
          tipo: "EMPRESTIMO",
          desc: `Novo pedido de empréstimo de ${data.valor / 100} MTn de ${newReq.user_nome}`,
          valor: data.valor,
          user: newReq.user_nome
        };

        await update(ref(rtdb), updates);
        toast({ title: "Solicitação criada", description: "O pedido de empréstimo foi registado e aguarda aprovação." });
      } catch (err: any) {
        if (err?.message !== "Limite excedido") {
          toast({ title: "Erro", description: "Não foi possível criar o pedido.", variant: "destructive" });
        }
        throw err;
      } finally {
        setIsPending(false);
      }
    },
  };
}

export function useApproveLoanRequest() {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  return {
    isPending,
    mutateAsync: async ({ requestId }: { requestId: string }) => {
      setIsPending(true);
      try {
        const req = dbStore.loanRequests.find(r => r.id === requestId);
        if (!req || req.status !== "Pendente") {
          toast({ title: "Aviso", description: "Este pedido já foi processado ou não existe.", variant: "destructive" });
          return;
        }

        let valorRestante = req.valor;
        const usersList = Object.values(dbStore.userDetails)
          .filter(u => u.emCaixa > 0)
          .sort((a, b) => b.emCaixa - a.emCaixa);

        const liquidezTotal = usersList.reduce((acc, u) => acc + u.emCaixa, 0);
        if (liquidezTotal < req.valor) {
          toast({ title: "Liquidez Insuficiente", description: `O cofre só dispõe de ${formatMT(liquidezTotal)} em caixa. Faltam fundos para aprovar este empréstimo.`, variant: "destructive" });
          return;
        }

        const updates: Record<string, any> = {};
        updates[`loanRequests/${requestId}/status`] = "Aprovado";
        
        updates[`dashboard/caixa`] = dbStore.dashboard.caixa - req.valor;
        updates[`dashboard/naRua`] = dbStore.dashboard.naRua + req.valor;
        updates[`dashboard/emprestimos_ativos`] = dbStore.dashboard.emprestimos_ativos + 1;

        const tsNow = Math.floor(Date.now() / 1000);
        const traces: any[] = [];
        
        for (const u of usersList) {
          if (valorRestante <= 0) break;
          const contributo = Math.min(u.emCaixa, valorRestante);

          valorRestante -= contributo;

          const pctReal = (contributo / req.valor) * 100;
          const juroEsperado = contributo * 0.1;
          traces.push({
            owner_id: u.user.id,
            owner_nome: u.user.nome,
            owner_foto: u.user.foto,
            valor_contribuido: contributo,
            pctReal,
            juro: 0,
            total: 0
          });

          const newEmCirculacaoEntry = {
            loan_id: "l" + req.id,
            tomador_id: req.user_id,
            tomador_nome: req.user_nome,
            tomador_foto: dbStore.users.find((mu: any) => mu.id === req.user_id)?.foto || "",
            valor_contribuido: contributo,
            pctDoEmprestimo: pctReal,
            status: "Ativo",
            taxa_atual: 10,
            dias: 0,
            data_inicio: tsNow,
            juro_esperado: juroEsperado,
            total_esperado: contributo + juroEsperado
          };

          const uId = u.user.id;
          const currentEmCirculacao = u.emCirculacao || [];
          const newTotalEmCirculacao = (u.totalEmCirculacao || 0) + contributo;
          const newTotalJuro = (u.totalJuroEsperado || 0) + juroEsperado;
          const novaCaixa = u.emCaixa - contributo;

          updates[`userDetails/${uId}/emCaixa`] = novaCaixa;
          updates[`users/${uId}/saldo_base`] = novaCaixa;
          updates[`userDetails/${uId}/emCirculacao`] = [newEmCirculacaoEntry, ...currentEmCirculacao];
          updates[`userDetails/${uId}/totalEmCirculacao`] = newTotalEmCirculacao;
          updates[`userDetails/${uId}/totalJuroEsperado`] = newTotalJuro;
          updates[`userDetails/${uId}/patrimonioTotal`] = novaCaixa + newTotalEmCirculacao + newTotalJuro;
        }

        const novoEmprestimo = {
          id: "l" + req.id,
          user_id: req.user_id,
          tomador_nome: req.user_nome,
          tomador_foto: dbStore.users.find((mu: any) => mu.id === req.user_id)?.foto || "",
          valor_original: req.valor,
          data_inicio: tsNow,
          taxa_atual: 10,
          status: "Ativo",
          valor_pago: 0,
          dias: 0,
          juro_total: req.valor * 0.1,
          total_devido: req.valor * 1.1,
        };

        updates[`loans/${novoEmprestimo.id}`] = novoEmprestimo;
        updates[`loanDetails/${novoEmprestimo.id}`] = {
          loan: novoEmprestimo,
          traces,
          projecoes: [
            { taxa: 10, juroTotal: req.valor * 0.1, totalDevido: req.valor * 1.1, label: "Mês 1 (10%)", cor: "hsl(var(--success))" },
            { taxa: 20, juroTotal: req.valor * 0.2, totalDevido: req.valor * 1.2, label: "Mês 2 (20%)", cor: "hsl(var(--warning))" },
            { taxa: 50, juroTotal: req.valor * 0.5, totalDevido: req.valor * 1.5, label: "Mês 3 (50%)", cor: "hsl(var(--destructive))" },
          ]
        };

        const auditId = "a" + Date.now();
        updates[`audit/${auditId}`] = {
          id: auditId,
          ts: tsNow,
          tipo: "EMPRESTIMO",
          desc: `Empréstimo de ${req.valor / 100} MTn aprovado para ${req.user_nome} — Capital recolhido de ${traces.length} investidores.`,
          valor: req.valor,
          user: "Admin"
        };

        await update(ref(rtdb), updates);
        toast({ title: "✅ Empréstimo aprovado", description: "O capital foi alocado automaticamente na Cloud." });
      } catch (err) {
        console.error("[useApproveLoanRequest] Erro:", err);
        toast({ title: "Erro", description: "Não foi possível processar a aprovação.", variant: "destructive" });
      } finally {
        setIsPending(false);
      }
    },
    mutate: () => {}
  };
}

export function useRejectLoanRequest() {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  return {
    isPending,
    mutateAsync: async ({ requestId }: { requestId: string }) => {
      setIsPending(true);
      const req = dbStore.loanRequests.find(r => r.id === requestId);
      if (req && req.status === "Pendente") {
        const updates: any = {};
        updates[`loanRequests/${requestId}/status`] = "Rejeitado";
        const auditId = "a" + Date.now();
        updates[`audit/${auditId}`] = {
          id: auditId, ts: Math.floor(Date.now() / 1000), tipo: "EMPRESTIMO", desc: `Pedido de empréstimo de ${req.valor / 100} MTn de ${req.user_nome} foi rejeitado.`, valor: req.valor, user: "Admin"
        };
        await update(ref(rtdb), updates);
        toast({ title: "Solicitação rejeitada", description: "O pedido de empréstimo foi rejeitado." });
      }
      setIsPending(false);
    },
  };
}

export function useCreateDepositRequest() {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  return {
    isPending,
    mutateAsync: async ({ data }: { data: { user_id: string; valor: number } }) => {
      setIsPending(true);
      try {
        const user = dbStore.users.find(u => u.id === data.user_id);
        const newReqId = "dr" + Date.now();
        const newReq = {
          id: newReqId,
          user_id: data.user_id,
          user_nome: user?.nome || "Desconhecido",
          user_foto: user?.foto || "??",
          valor: data.valor,
          ts: Math.floor(Date.now() / 1000),
          status: "Pendente" as const
        };

        const updates: any = {};
        updates[`depositRequests/${newReqId}`] = newReq;
        
        const auditId = "a" + Date.now();
        updates[`audit/${auditId}`] = {
          id: auditId, ts: Math.floor(Date.now() / 1000), tipo: "DEPOSITO", desc: `Solicitação de aporte de ${data.valor / 100} MTn de ${newReq.user_nome}`, valor: data.valor, user: newReq.user_nome
        };

        await update(ref(rtdb), updates);
        toast({ title: "Aporte registado", description: "O pedido de aporte foi submetido para aprovação." });
      } catch {
        toast({ title: "Erro", description: "Não foi possível criar o pedido.", variant: "destructive" });
      } finally {
        setIsPending(false);
      }
    },
  };
}

export function useApproveDepositRequest() {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  return {
    isPending,
    mutateAsync: async ({ requestId }: { requestId: string }) => {
      setIsPending(true);
      try {
        const req = dbStore.depositRequests.find(r => r.id === requestId);
        if (!req || req.status !== "Pendente") return;

        const updates: any = {};
        updates[`depositRequests/${requestId}/status`] = "Aprovado";
        
        const u = dbStore.userDetails[req.user_id];
        if (u) {
          const novaCaixa = u.emCaixa + req.valor;
          updates[`userDetails/${req.user_id}/emCaixa`] = novaCaixa;
          updates[`userDetails/${req.user_id}/patrimonioTotal`] = novaCaixa + u.totalEmCirculacao + u.totalJuroEsperado;
          updates[`users/${req.user_id}/saldo_base`] = novaCaixa;
        }

        updates[`dashboard/caixa`] = dbStore.dashboard.caixa + req.valor;
        updates[`dashboard/total`] = dbStore.dashboard.total + req.valor;

        const auditId = "a" + Date.now();
        updates[`audit/${auditId}`] = {
          id: auditId, ts: Math.floor(Date.now() / 1000), tipo: "DEPOSITO", desc: `Aporte de ${req.valor / 100} MTn aprovado de ${req.user_nome}`, valor: req.valor, user: "Admin"
        };

        await update(ref(rtdb), updates);
        toast({ title: "✅ Aporte aprovado", description: "O saldo do membro foi actualizado no cofre." });
      } catch (err) {
        toast({ title: "Erro inesperado", description: "Não foi possível processar o aporte.", variant: "destructive" });
      } finally {
        setIsPending(false);
      }
    },
    mutate: () => {}
  };
}

export function useRejectDepositRequest() {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  return {
    isPending,
    mutateAsync: async ({ requestId }: { requestId: string }) => {
      setIsPending(true);
      const req = dbStore.depositRequests.find(r => r.id === requestId);
      if (req && req.status === "Pendente") {
        const updates: any = {};
        updates[`depositRequests/${requestId}/status`] = "Rejeitado";
        const auditId = "a" + Date.now();
        updates[`audit/${auditId}`] = {
          id: auditId, ts: Math.floor(Date.now() / 1000), tipo: "DEPOSITO", desc: `Pedido de aporte de ${req.valor / 100} MTn de ${req.user_nome} foi rejeitado.`, valor: req.valor, user: "Admin"
        };
        await update(ref(rtdb), updates);
        toast({ title: "Aporte rejeitado", description: "O pedido de aporte foi rejeitado." });
      }
      setIsPending(false);
    },
  };
}

export function useCreateMembershipRequest() {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  return {
    isPending,
    mutateAsync: async ({ data }: { 
      data: { 
        nome: string; foto: string; saldo_base: number;
        nacionalidade?: string; profissao?: string;
        telefone?: string; email?: string;
        bairro?: string; cidade?: string;
        endereco?: string; nuit?: string;
        pin?: string;
      } 
    }) => {
      setIsPending(true);
      try {
        const newReqId = "mr" + Date.now();
        const newReq = {
          id: newReqId,
          nome: data.nome,
          foto: data.foto,
          saldo_base: data.saldo_base,
          nacionalidade: data.nacionalidade || "",
          profissao: data.profissao || "",
          telefone: data.telefone || "",
          email: data.email || "",
          bairro: data.bairro || "",
          cidade: data.cidade || "",
          endereco: data.endereco || "",
          nuit: data.nuit || "",
          pin: data.pin || "",
          status: "Pendente" as const,
          ts: Math.floor(Date.now() / 1000)
        };
        const updates: any = {};
        updates[`membershipRequests/${newReqId}`] = newReq;
        await update(ref(rtdb), updates);
        toast({ title: "Pedido Submetido", description: "O seu pedido de adesão foi enviado para aprovação central." });
      } catch (err) {
        toast({ title: "Erro", description: "Não foi possível enviar o pedido.", variant: "destructive" });
      } finally {
        setIsPending(false);
      }
    }
  };
}

export function useApproveMembershipRequest() {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  return {
    isPending,
    mutateAsync: async ({ requestId }: { requestId: string }) => {
      setIsPending(true);
      try {
        const req = dbStore.membershipRequests.find(r => r.id === requestId);
        if (!req || req.status !== "Pendente") return;
        
        const updates: any = {};
        updates[`membershipRequests/${requestId}/status`] = "Aprovado";
        
        const newUserId = "u" + Date.now();
        const newUser = { 
          id: newUserId, 
          nome: req.nome, 
          foto: req.foto, 
          status: "Ativo" as const, 
          saldo_base: req.saldo_base, 
          lucro_acumulado: 0,
          nacionalidade: req.nacionalidade,
          profissao: req.profissao,
          telefone: req.telefone,
          email: req.email,
          bairro: req.bairro,
          cidade: req.cidade,
          endereco: req.endereco,
          nuit: req.nuit,
          pin: req.pin || ""
        };
        
        updates[`users/${newUserId}`] = newUser;
        updates[`userDetails/${newUserId}`] = {
          user: newUser,
          emCaixa: req.saldo_base,
          emCirculacao: [],
          totalEmCirculacao: 0,
          totalJuroEsperado: 0,
          patrimonioTotal: req.saldo_base
        };
        
        updates[`dashboard/membros_ativos`] = (dbStore.dashboard.membros_ativos || 0) + 1;
        updates[`dashboard/caixa`] = (dbStore.dashboard.caixa || 0) + req.saldo_base;
        updates[`dashboard/total`] = (dbStore.dashboard.total || 0) + req.saldo_base;
        
        const auditId = "a" + Date.now();
        updates[`audit/${auditId}`] = {
          id: auditId, ts: Math.floor(Date.now() / 1000), tipo: "MEMBRO", desc: `Pedido de adesão de ${newUser.nome} aprovado com aporte inicial de ${req.saldo_base / 100} MTn`, valor: req.saldo_base, user: "Admin"
        };
        
        await update(ref(rtdb), updates);
        toast({ title: "Adesão aprovada", description: `${newUser.nome} agora é membro do cofre.` });
      } catch (err) {
        toast({ title: "Erro", description: "Não foi possível aprovar a adesão.", variant: "destructive" });
      } finally {
        setIsPending(false);
      }
    }
  };
}

export function useRejectMembershipRequest() {
   const [isPending, setIsPending] = useState(false);
   const { toast } = useToast();
   return {
     isPending,
     mutateAsync: async ({ requestId }: { requestId: string }) => {
        setIsPending(true);
        const req = dbStore.membershipRequests.find(r => r.id === requestId);
        if (req && req.status === "Pendente") {
           const updates: any = {};
           updates[`membershipRequests/${requestId}/status`] = "Rejeitado";
           const auditId = "a" + Date.now();
           updates[`audit/${auditId}`] = {
             id: auditId, ts: Math.floor(Date.now() / 1000), tipo: "MEMBRO", desc: `Pedido de adesão de ${req.nome} foi rejeitado.`, valor: req.saldo_base, user: "Admin"
           };
           await update(ref(rtdb), updates);
           toast({ title: "Adesão rejeitada", description: "O pedido de adesão foi rejeitado." });
        }
        setIsPending(false);
     }
   }
}

export function useFactoryResetSystem() {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  return {
    isPending,
    mutateAsync: async () => {
      setIsPending(true);
      try {
        const updates: any = {};
        // Nodes to wipe
        const pathsToWipe = [
          "users", "userDetails", "loans", "loanDetails", 
          "loanRequests", "depositRequests", "membershipRequests", 
          "deletionRequests", "audit"
        ];
        pathsToWipe.forEach(p => { updates[p] = null; });
        
        // Reset dashboard
        updates["dashboard"] = { 
          caixa: 0, 
          lucros: 0, 
          naRua: 0, 
          total: 0, 
          membros_ativos: 0, 
          emprestimos_ativos: 0 
        };
        
        await update(ref(rtdb), updates);
        toast({ title: "Redefinição concluída", description: "O sistema foi limpo e está pronto para o uso." });
      } catch (err) {
        console.error("[useFactoryResetSystem] Erro:", err);
        toast({ title: "Erro crítico", description: "Não foi possível resetar o sistema.", variant: "destructive" });
      } finally {
        setIsPending(false);
      }
    }
  };
}

export function useCreateDeletionRequest() {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  return {
    isPending,
    mutateAsync: async ({ targetId, targetType, userId, userNome, details }: { 
      targetId: string; targetType: "membership" | "loan" | "deposit"; 
      userId: string; userNome: string; details: any 
    }) => {
      setIsPending(true);
      try {
        const id = "drq" + Date.now();
        const newReq = {
          id,
          target_id: targetId,
          target_type: targetType,
          user_id: userId,
          user_nome: userNome,
          admin_id: "Admin",
          status: "Pendente",
          ts: Math.floor(Date.now() / 1000),
          details
        };
        const updates: any = {};
        updates[`deletionRequests/${id}`] = newReq;
        
        const auditId = "a" + Date.now();
        updates[`audit/${auditId}`] = {
          id: auditId, ts: Math.floor(Date.now() / 1000), tipo: "EXCLUSAO", 
          desc: `Solicitada exclusão de registro de ${userNome} pelo Administrador. Aguardando aprovação do membro.`, 
          valor: details.valor || 0, user: "Admin"
        };
        
        await update(ref(rtdb), updates);
        toast({ title: "Solicitação enviada", description: "O membro foi notificado para aprovar a exclusão." });
      } catch {
        toast({ title: "Erro", description: "Não foi possível enviar o pedido de exclusão.", variant: "destructive" });
      } finally {
        setIsPending(false);
      }
    }
  };
}

export function useApproveDeletionRequest() {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  return {
    isPending,
    mutateAsync: async ({ requestId }: { requestId: string }) => {
      setIsPending(true);
      try {
        const delReq = dbStore.deletionRequests.find(r => r.id === requestId);
        if (!delReq) return;

        const updates: any = {};
        // Delete original request
        const path = delReq.target_type === "membership" ? "membershipRequests" : 
                     delReq.target_type === "loan" ? "loanRequests" : "depositRequests";
        updates[`${path}/${delReq.target_id}`] = null;
        // Delete deletion request
        updates[`deletionRequests/${requestId}`] = null;

        const auditId = "a" + Date.now();
        updates[`audit/${auditId}`] = {
          id: auditId, ts: Math.floor(Date.now() / 1000), tipo: "EXCLUSAO", 
          desc: `Exclusão confirmada pelo membro ${delReq.user_nome}. Registro removido do histórico.`, 
          valor: delReq.details.valor || 0, user: delReq.user_nome
        };

        await update(ref(rtdb), updates);
        toast({ title: "Exclusão concluída", description: "O registro foi removido permanentemente." });
      } catch {
        toast({ title: "Erro", description: "Não foi possível processar a exclusão.", variant: "destructive" });
      } finally {
        setIsPending(false);
      }
    }
  };
}

export function useRejectDeletionRequest() {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  return {
    isPending,
    mutateAsync: async ({ requestId }: { requestId: string }) => {
      setIsPending(true);
      try {
        const delReq = dbStore.deletionRequests.find(r => r.id === requestId);
        if (!delReq) return;

        const updates: any = {};
        updates[`deletionRequests/${requestId}`] = null;

        const auditId = "a" + Date.now();
        updates[`audit/${auditId}`] = {
          id: auditId, ts: Math.floor(Date.now() / 1000), tipo: "EXCLUSAO", 
          desc: `Exclusão rejeitada pelo membro ${delReq.user_nome}. Registro mantido no histórico.`, 
          valor: delReq.details.valor || 0, user: delReq.user_nome
        };

        await update(ref(rtdb), updates);
        toast({ title: "Exclusão rejeitada", description: "O pedido de exclusão foi cancelado." });
      } catch {
        toast({ title: "Erro", description: "Não foi possível rejeitar o pedido.", variant: "destructive" });
      } finally {
        setIsPending(false);
      }
    }
  };
}

export function useCreateProfileEditRequest() {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  return {
    isPending,
    mutateAsync: async ({ data }: { 
      data: { 
        user_id: string; user_nome: string; user_foto: string;
        conjuge_nome?: string; conjuge_numero?: string;
        irmao_nome?: string; irmao_numero?: string;
        parente_nome?: string; parente_numero?: string;
        bairro?: string; zona?: string; email?: string;
      } 
    }) => {
      setIsPending(true);
      try {
        const id = "pe" + Date.now();
        const newReq = {
          ...data,
          id,
          status: "Pendente",
          ts: Math.floor(Date.now() / 1000)
        };
        const updates: any = {};
        updates[`profileEditRequests/${id}`] = newReq;
        
        await update(ref(rtdb), updates);
        toast({ title: "Pedido Submetido", description: "O seu pedido de edição de perfil foi enviado para o Administrador." });
      } catch {
        toast({ title: "Erro", description: "Não foi possível enviar o pedido de edição.", variant: "destructive" });
      } finally {
        setIsPending(false);
      }
    }
  };
}

export function useApproveProfileEditRequest() {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  return {
    isPending,
    mutateAsync: async ({ requestId }: { requestId: string }) => {
      setIsPending(true);
      try {
        const req = dbStore.profileEditRequests.find(r => r.id === requestId);
        if (!req || req.status !== "Pendente") return;

        const updates: any = {};
        updates[`profileEditRequests/${requestId}/status`] = "Aprovado";
        
        const uid = req.user_id;
        const userNode = dbStore.userDetails[uid]?.user;
        if(userNode) {
          const fields = ["conjuge_nome", "conjuge_numero", "irmao_nome", "irmao_numero", "parente_nome", "parente_numero", "bairro", "zona", "email"];
          fields.forEach(f => {
            if (req[f] !== undefined) {
               updates[`users/${uid}/${f}`] = req[f];
               updates[`userDetails/${uid}/user/${f}`] = req[f];
            }
          });
        }

        const auditId = "a" + Date.now();
        updates[`audit/${auditId}`] = {
          id: auditId, ts: Math.floor(Date.now() / 1000), tipo: "MEMBRO", 
          desc: `Edição de Perfil aprovada para ${req.user_nome}.`, 
          valor: 0, user: "Admin"
        };

        await update(ref(rtdb), updates);
        toast({ title: "Aprovado", description: `O perfil de ${req.user_nome} foi atualizado com sucesso.` });
      } catch {
        toast({ title: "Erro", description: "Falha ao aprovar edição.", variant: "destructive" });
      } finally {
        setIsPending(false);
      }
    }
  };
}

export function useRejectProfileEditRequest() {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  return {
    isPending,
    mutateAsync: async ({ requestId }: { requestId: string }) => {
      setIsPending(true);
      try {
        const req = dbStore.profileEditRequests.find(r => r.id === requestId);
        if (!req || req.status !== "Pendente") return;

        const updates: any = {};
        updates[`profileEditRequests/${requestId}/status`] = "Rejeitado";

        const auditId = "a" + Date.now();
        updates[`audit/${auditId}`] = {
          id: auditId, ts: Math.floor(Date.now() / 1000), tipo: "MEMBRO", 
          desc: `Pedido de edição de perfil de ${req.user_nome} rejeitado.`, 
          valor: 0, user: "Admin"
        };

        await update(ref(rtdb), updates);
        toast({ title: "Rejeitado", description: "O pedido de edição foi rejeitado." });
      } catch {
        toast({ title: "Erro", description: "Falha ao rejeitar edição.", variant: "destructive" });
      } finally {
        setIsPending(false);
      }
    }
  };
}
