import { useState } from "react";
import { useMockDataSync } from "@/hooks/use-mock-store";
import { mockLoanRequests, mockDepositRequests, mockMembershipRequests, mockUserDetails, mockUsers, mockDashboard, mockAudit, mockLoans, mockLoanDetails } from "@/data/mock-data";
import { formatMT } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ref, update } from "firebase/database";
import { rtdb } from "@/lib/firebase";

export function useRequests() {
  useMockDataSync();
  return {
    memberships: mockMembershipRequests,
    loans: mockLoanRequests,
    deposits: mockDepositRequests,
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
        const userDetail = mockUserDetails[data.user_id];
        if (!userDetail) throw new Error("Membro não encontrado");

        const limiteTotal = userDetail.emCaixa * 1.30;
        const emprestimosAtivos = mockLoans.filter(l => l.user_id === data.user_id && l.status !== "Liquidado");
        const dividaAtiva = emprestimosAtivos.reduce((acc, l) => acc + l.total_devido, 0);
        const limiteDisponivel = Math.max(0, limiteTotal - dividaAtiva);

        if (data.valor > limiteDisponivel) {
          toast({ title: "Limite Excedido", description: `O valor excede o limite disponível de ${formatMT(limiteDisponivel)}.`, variant: "destructive" });
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
        const req = mockLoanRequests.find(r => r.id === requestId);
        if (!req || req.status !== "Pendente") {
          toast({ title: "Aviso", description: "Este pedido já foi processado ou não existe.", variant: "destructive" });
          return;
        }

        let valorRestante = req.valor;
        const usersList = Object.values(mockUserDetails)
          .filter(u => u.emCaixa > 0)
          .sort((a, b) => b.emCaixa - a.emCaixa);

        const liquidezTotal = usersList.reduce((acc, u) => acc + u.emCaixa, 0);
        if (liquidezTotal < req.valor) {
          toast({ title: "Liquidez Insuficiente", description: `O cofre só dispõe de ${formatMT(liquidezTotal)} em caixa. Faltam fundos para aprovar este empréstimo.`, variant: "destructive" });
          return;
        }

        const updates: Record<string, any> = {};
        updates[`loanRequests/${requestId}/status`] = "Aprovado";
        
        updates[`dashboard/caixa`] = mockDashboard.caixa - req.valor;
        updates[`dashboard/naRua`] = mockDashboard.naRua + req.valor;
        updates[`dashboard/emprestimos_ativos`] = mockDashboard.emprestimos_ativos + 1;

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
            tomador_foto: mockUsers.find(mu => mu.id === req.user_id)?.foto || "",
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
          tomador_foto: mockUsers.find(mu => mu.id === req.user_id)?.foto || "",
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
    mutate: async ({ requestId }: { requestId: string }) => {
      setIsPending(true);
      const req = mockLoanRequests.find(r => r.id === requestId);
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
        const user = mockUsers.find(u => u.id === data.user_id);
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
        const req = mockDepositRequests.find(r => r.id === requestId);
        if (!req || req.status !== "Pendente") return;

        const updates: any = {};
        updates[`depositRequests/${requestId}/status`] = "Aprovado";
        
        const u = mockUserDetails[req.user_id];
        if (u) {
          const novaCaixa = u.emCaixa + req.valor;
          updates[`userDetails/${req.user_id}/emCaixa`] = novaCaixa;
          updates[`userDetails/${req.user_id}/patrimonioTotal`] = novaCaixa + u.totalEmCirculacao + u.totalJuroEsperado;
          updates[`users/${req.user_id}/saldo_base`] = novaCaixa;
        }

        updates[`dashboard/caixa`] = mockDashboard.caixa + req.valor;
        updates[`dashboard/total`] = mockDashboard.total + req.valor;

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
    mutate: async ({ requestId }: { requestId: string }) => {
      setIsPending(true);
      const req = mockDepositRequests.find(r => r.id === requestId);
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
    mutateAsync: async ({ data }: { data: { nome: string; foto: string; saldo_base: number } }) => {
      setIsPending(true);
      try {
        const newReqId = "mr" + Date.now();
        const newReq = {
          id: newReqId,
          nome: data.nome,
          foto: data.foto,
          saldo_base: data.saldo_base,
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
        const req = mockMembershipRequests.find(r => r.id === requestId);
        if (!req || req.status !== "Pendente") return;
        
        const updates: any = {};
        updates[`membershipRequests/${requestId}/status`] = "Aprovado";
        
        const newUserId = "u" + Date.now();
        const newUser = { id: newUserId, nome: req.nome, foto: req.foto, status: "Ativo" as const, saldo_base: req.saldo_base, lucro_acumulado: 0 };
        
        updates[`users/${newUserId}`] = newUser;
        updates[`userDetails/${newUserId}`] = {
          user: newUser,
          emCaixa: req.saldo_base,
          emCirculacao: [],
          totalEmCirculacao: 0,
          totalJuroEsperado: 0,
          patrimonioTotal: req.saldo_base
        };
        
        updates[`dashboard/membros_ativos`] = mockDashboard.membros_ativos + 1;
        updates[`dashboard/caixa`] = mockDashboard.caixa + req.saldo_base;
        updates[`dashboard/total`] = mockDashboard.total + req.saldo_base;
        
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
     mutate: async ({ requestId }: { requestId: string }) => {
        setIsPending(true);
        const req = mockMembershipRequests.find(r => r.id === requestId);
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
