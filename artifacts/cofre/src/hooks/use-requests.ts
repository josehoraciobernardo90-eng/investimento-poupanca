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
    liquidations: dbStore.liquidationRequests || [],
    profileEdits: dbStore.profileEditRequests,
    deletionRequests: dbStore.deletionRequests,
    membershipRequests: dbStore.membershipRequests,
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

  // Comissão fiduciária fixa: 30 MT por aporte
  // Este valor vai EXCLUSIVAMENTE para a conta do Admin — fora do cofre
  const COMISSAO_ADM = 3000; // unidades do sistema (centavos × 100)

  return {
    isPending,
    mutateAsync: async ({ requestId }: { requestId: string }) => {
      setIsPending(true);
      try {
        const req = dbStore.depositRequests.find(r => r.id === requestId);
        if (!req || req.status !== "Pendente") return;

        // Gàrdia: o aporte deve ser superior à comissão
        if (req.valor <= COMISSAO_ADM) {
          toast({
            title: "Aporte Insuficiente",
            description: `O valor do aporte deve ser superior a 30 MTn (taxa fixa de processamento).`,
            variant: "destructive"
          });
          return;
        }

        // Valor líquido que vai para o membro e para o cofre
        const valorLiquido = req.valor - COMISSAO_ADM;

        const updates: any = {};
        const tsNow = Math.floor(Date.now() / 1000);

        // 1. Marcar pedido como aprovado
        updates[`depositRequests/${requestId}/status`] = "Aprovado";
        updates[`depositRequests/${requestId}/comissao_adm`] = COMISSAO_ADM;
        updates[`depositRequests/${requestId}/valor_liquido`] = valorLiquido;

        // 2. Creditar APENAS o valor líquido ao membro
        const u = dbStore.userDetails[req.user_id];
        if (u) {
          const novaCaixa = u.emCaixa + valorLiquido;
          updates[`userDetails/${req.user_id}/emCaixa`] = novaCaixa;
          updates[`userDetails/${req.user_id}/patrimonioTotal`] = novaCaixa + (u.totalEmCirculacao || 0) + (u.totalJuroEsperado || 0);
          updates[`users/${req.user_id}/saldo_base`] = novaCaixa;
        }

        // 3. Dashboard reflecte só o valor líquido
        updates[`dashboard/caixa`] = dbStore.dashboard.caixa + valorLiquido;
        updates[`dashboard/total`] = dbStore.dashboard.total + valorLiquido;

        // 4. Comissão vai para conta isolada do Admin (FORA do cofre)
        const comissaoId = "com" + Date.now();
        const comissaoAtual = (dbStore as any).adminComissao || { total: 0, registros: [] };
        updates[`adminComissao/total`] = (comissaoAtual.total || 0) + COMISSAO_ADM;
        updates[`adminComissao/registros/${comissaoId}`] = {
          id: comissaoId,
          ts: tsNow,
          origem: `Aporte de ${req.user_nome}`,
          valor: COMISSAO_ADM,
          aporte_original: req.valor,
          deposit_req_id: requestId
        };

        // 5. Notificação automática ao membro sobre o desconto
        const notifId = "ntf" + Date.now();
        updates[`notifications/${notifId}`] = {
          id: notifId,
          user_id: req.user_id,
          ts: tsNow,
          tipo: "COMISSAO",
          titulo: "Aporte Processado com Sucesso ✔️",
          mensagem: `O seu aporte de ${req.valor / 100} MTn foi aprovado. Uma taxa de processamento fixa de 30 MTn foi deduzida automaticamente. Valor creditado na sua conta: ${valorLiquido / 100} MTn.`,
          lida: false
        };

        // 6. Auditoria do sistema (regista apenas o valor líquido)
        const auditId = "a" + Date.now();
        updates[`audit/${auditId}`] = {
          id: auditId,
          ts: tsNow,
          tipo: "DEPOSITO",
          desc: `Aporte de ${req.valor / 100} MTn aprovado de ${req.user_nome}. Net: ${valorLiquido / 100} MTn creditados. Comissão de 30 MTn separada para Admin.`,
          valor: valorLiquido,
          user: "Admin"
        };

        await update(ref(rtdb), updates);
        toast({
          title: "✅ Aporte Aprovado",
          description: `${req.user_nome} receberá ${valorLiquido / 100} MTn. Comissão de 30 MTn registada na sua conta privada.`
        });
      } catch (err) {
        console.error("[useApproveDepositRequest]", err);
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
        
        const auditId = "a" + Date.now();
        updates[`audit/${auditId}`] = {
          id: auditId,
          ts: Math.floor(Date.now() / 1000),
          tipo: "MEMBRO",
          desc: `Nova solicitação de adesão: ${newReq.nome} (Aporte Inicial: ${formatMT(newReq.saldo_base)})`,
          valor: newReq.saldo_base,
          user: newReq.nome
        };

        await update(ref(rtdb), updates);
        console.debug(`[useCreateMembershipRequest] Sucesso ao criar pedido mr=${newReqId}`);
        toast({ title: "Pedido Submetido", description: "O seu pedido de adesão foi enviado para aprovação central." });
      } catch (err) {
        console.error("[useCreateMembershipRequest] Erro:", err);
        toast({ title: "Falha na Conexão", description: "Não foi possível enviar o pedido. O seu Firebase parece estar offline ou mal configurado.", variant: "destructive" });
      } finally {
        setIsPending(false);
      }
    }
  };
}

export function useApproveMembershipRequest() {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  
  const COMISSAO_ADM = 3000; // Unidades do sistema (30 MTn)

  return {
    isPending,
    mutateAsync: async ({ requestId }: { requestId: string }) => {
      setIsPending(true);
      try {
        const req = dbStore.membershipRequests.find(r => r.id === requestId);
        if (!req || req.status !== "Pendente") return;
        
        if (req.saldo_base <= COMISSAO_ADM) {
          toast({
            title: "Aporte Inicial Insuficiente",
            description: `O valor do primeiro aporte deve ser superior a 30 MTn para cobrir a taxa de adesão.`,
            variant: "destructive"
          });
          setIsPending(false);
          return;
        }

        const valorLiquido = req.saldo_base - COMISSAO_ADM;
        const tsNow = Math.floor(Date.now() / 1000);
        
        const updates: any = {};
        updates[`membershipRequests/${requestId}/status`] = "Aprovado";
        
        const newUserId = "u" + Date.now();
        const newUser = { 
          id: newUserId, 
          nome: req.nome, 
          foto: req.foto, 
          status: "Ativo" as const, 
          saldo_base: valorLiquido, 
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
          emCaixa: valorLiquido,
          emCirculacao: [],
          totalEmCirculacao: 0,
          totalJuroEsperado: 0,
          patrimonioTotal: valorLiquido
        };
        
        updates[`dashboard/membros_ativos`] = (dbStore.dashboard.membros_ativos || 0) + 1;
        updates[`dashboard/caixa`] = (dbStore.dashboard.caixa || 0) + valorLiquido;
        updates[`dashboard/total`] = (dbStore.dashboard.total || 0) + valorLiquido;

        // Comissão vai para conta isolada do Admin
        const comissaoId = "com" + Date.now();
        const comissaoAtual = (dbStore as any).adminComissao || { total: 0, registros: [] };
        updates[`adminComissao/total`] = (comissaoAtual.total || 0) + COMISSAO_ADM;
        updates[`adminComissao/registros/${comissaoId}`] = {
          id: comissaoId,
          ts: tsNow,
          origem: `Taxa de Adesão de ${req.nome}`,
          valor: COMISSAO_ADM,
          aporte_original: req.saldo_base,
          membership_req_id: requestId
        };

        // Notificação de boas-vindas e dedução de taxa
        const notifId = "ntf" + Date.now();
        updates[`notifications/${notifId}`] = {
          id: notifId,
          user_id: newUserId,
          ts: tsNow,
          tipo: "COMISSAO",
          titulo: "🎉 Bem-vindo ao Cofre Elite!",
          mensagem: `A sua adesão foi concluída. Um aporte inicial de ${req.saldo_base / 100} MTn foi efectuado, com dedução da taxa fiduciária de adesão de 30 MTn. Valor na sua conta: ${valorLiquido / 100} MTn.`,
          lida: false
        };
        
        const auditId = "a" + Date.now();
        updates[`audit/${auditId}`] = {
          id: auditId, 
          ts: tsNow, 
          tipo: "MEMBRO", 
          desc: `Adesão de ${newUser.nome} aprovada (Aporte: ${req.saldo_base / 100} MTn). Net: ${valorLiquido / 100} MTn. Taxa Admin: 30 MTn.`, 
          valor: valorLiquido, 
          user: "Admin"
        };
        
        await update(ref(rtdb), updates);
        toast({ title: "✅ Adesão Aprovada", description: `${newUser.nome} adicionado. Comissão de 30 MTn recolhida.` });
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
           // Apagar o pedido de uma única vez, sem deixar rastros
           updates[`membershipRequests/${requestId}`] = null;
           
           const auditId = "a" + Date.now();
           updates[`audit/${auditId}`] = {
             id: auditId, ts: Math.floor(Date.now() / 1000), 
             tipo: "MEMBRO", 
             desc: `Pedido de adesão de ${req.nome} foi removido pelo Administrador.`, 
             valor: req.saldo_base, user: "Admin"
           };
           await update(ref(rtdb), updates);
           toast({ title: "Pedido Removido", description: "O cadastro foi apagado permanentemente." });
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
        // Dados pessoais principais
        nome?: string; foto?: string; telefone?: string; email?: string;
        profissao?: string; nacionalidade?: string;
        // Endereço
        bairro?: string; zona?: string; cidade?: string; endereco?: string;
        // Contactos de emergência
        conjuge_nome?: string; conjuge_numero?: string;
        irmao_nome?: string; irmao_numero?: string;
        parente_nome?: string; parente_numero?: string;
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
        const tsNow = Math.floor(Date.now() / 1000);
        const uid = req.user_id;

        // 1. Marcar pedido como aprovado
        updates[`profileEditRequests/${requestId}/status`] = "Aprovado";

        // 2. Lista completa de campos editáveis pelo membro
        //    Escreve simultaneamente em users/ (base) e userDetails/user/ (detalhes)
        //    O Firebase propaga em tempo real para admin E membro via onValue listeners
        const CAMPOS_EDITAVEIS = [
          // Dados pessoais principais
          "nome", "foto", "telefone", "email",
          "profissao", "nacionalidade", "bi", "nuit",
          // Endereço
          "bairro", "zona", "cidade", "endereco",
          // Contactos de emergência
          "conjuge_nome", "conjuge_numero",
          "irmao_nome",   "irmao_numero",
          "parente_nome", "parente_numero",
        ];

        const camposActualizados: string[] = [];
        CAMPOS_EDITAVEIS.forEach(campo => {
          if (req[campo] !== undefined && req[campo] !== null && req[campo] !== "") {
            // Escreve nos dois nós para manter consistência total
            updates[`users/${uid}/${campo}`] = req[campo];
            updates[`userDetails/${uid}/user/${campo}`] = req[campo];
            camposActualizados.push(campo);
          }
        });

        console.debug(`[ApproveProfileEdit] uid=${uid} | campos="${camposActualizados.join(", ")}"`);

        // 3. Notificação em tempo real para o membro (aparece no sino do painel do membro)
        const notifId = "ntf" + Date.now();
        updates[`notifications/${notifId}`] = {
          id: notifId,
          user_id: uid,
          ts: tsNow,
          tipo: "PERFIL",
          titulo: "✅ Perfil Actualizado",
          mensagem: `O seu pedido de edição de perfil foi aprovado pelo Administrador. As suas informações já foram actualizadas: ${camposActualizados.join(", ")}.`,
          lida: false
        };

        // 4. Auditoria
        const auditId = "a" + Date.now();
        updates[`audit/${auditId}`] = {
          id: auditId,
          ts: tsNow,
          tipo: "MEMBRO",
          desc: `Edição de Perfil aprovada para ${req.user_nome}. Campos actualizados: ${camposActualizados.join(", ")}.`,
          valor: 0,
          user: "Admin"
        };

        // 5. Escrita atómica única no Firebase → propaga para TODOS os listeners em tempo real
        await update(ref(rtdb), updates);
        toast({
          title: "✅ Perfil Sincronizado",
          description: `${req.user_nome}: ${camposActualizados.length} campo(s) actualizados em tempo real.`
        });
      } catch (err) {
        console.error("[useApproveProfileEditRequest] Erro:", err);
        toast({ title: "Erro", description: "Falha ao aprovar edição de perfil.", variant: "destructive" });
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

export function useCreateLiquidationRequest() {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  return {
    isPending,
    mutateAsync: async ({ data }: { data: { user_id: string; loan_id: string; valor: number } }) => {
      setIsPending(true);
      try {
        const user = dbStore.users.find(u => u.id === data.user_id);
        const userDetail = dbStore.userDetails[data.user_id];
        if (!user || !userDetail) throw new Error("Usuário não encontrado.");

        if (userDetail.emCaixa < data.valor) {
           toast({ title: "Saldo Fiduciário Insuficiente", description: `Tem ${formatMT(userDetail.emCaixa)} em Caixa, mas precisa de ${formatMT(data.valor)}. Efetue um Novo Aporte primeiro.`, variant: "destructive" });
           return false;
        }

        const loanId = data.loan_id;
        const detail = dbStore.loanDetails[loanId];
        if (!detail || detail.loan.status === "Liquidado") {
          toast({ title: "Aviso", description: "O contrato já se encontra liquidado.", variant: "destructive" });
          return false;
        }

        const updates: any = {};
        const reqId = "liq_" + Date.now();
        const tsNow = Math.floor(Date.now() / 1000);
        
        updates[`liquidationRequests/${reqId}`] = {
           id: reqId,
           user_id: data.user_id,
           user_nome: user.nome,
           user_foto: user.foto || "",
           loan_id: loanId,
           valor: data.valor,
           ts: tsNow,
           status: "Pendente"
        };
        
        // Congela virtualmente o saldo do membro adicionando notificação local
        updates[`audit/a${tsNow}`] = {
           id: `a${tsNow}`, ts: tsNow, tipo: "LIQUIDACAO",
           desc: `O membro ${user.nome} solicitou liquidação do empréstimo #${loanId.slice(0,6)} no valor de ${formatMT(data.valor)}. Aguarda aprovação da gestão.`,
           valor: 0, user: user.nome
        };

        await update(ref(rtdb), updates);
        toast({ title: "Pedido de Liquidação Enviado", description: "A solicitação foi encaminhada para aprovação da gestão fiduciária." });
        return true;
      } catch (err: any) {
        console.error(err);
        toast({ title: "Erro na Solicitação", description: "Não foi possível criar o pedido de liquidação.", variant: "destructive" });
      } finally {
        setIsPending(false);
      }
    }
  };
}

export function useApproveLiquidationRequest() {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  return {
    isPending,
    mutateAsync: async ({ requestId }: { requestId: string }) => {
      setIsPending(true);
      try {
        const req = ((dbStore as any).liquidationRequests || []).find((r: any) => r.id === requestId);
        if (!req || req.status !== "Pendente") return;

        const loanId = req.loan_id;
        const detail = dbStore.loanDetails[loanId];
        if (!detail || detail.loan.status === "Liquidado") {
          toast({ title: "Aviso", description: "Este empréstimo já foi liquidado.", variant: "destructive" });
          return;
        }

        const updates: any = {};
        const base = detail.loan.valor_original;
        const totalPago = req.valor;
        const juros = Math.max(0, totalPago - base);

        // Divisão Profissional 20/80
        const juroMutuario = juros * 0.2;
        const juroInvestidores = juros * 0.8;

        // 1. Distribuir para Investidores
        const updatedTraces = [...detail.traces];
        updatedTraces.forEach((trace: any) => {
          const juroGanho = juroInvestidores * (trace.pctReal / 100);
          trace.juro = juroGanho;
          trace.total = trace.valor_contribuido + juroGanho;

          const invUser = dbStore.userDetails[trace.owner_id];
          if (invUser) {
            const novaCaixa = invUser.emCaixa + trace.total;
            updates[`userDetails/${trace.owner_id}/emCaixa`] = novaCaixa;
            updates[`users/${trace.owner_id}/saldo_base`] = novaCaixa;
            
            const baseUser = dbStore.users.find(u => u.id === trace.owner_id);
            if (baseUser) {
              updates[`users/${trace.owner_id}/lucro_acumulado`] = (baseUser.lucro_acumulado || 0) + juroGanho;
            }

            const currentCirc = invUser.emCirculacao || [];
            const circIndex = currentCirc.findIndex((c: any) => c.loan_id === loanId);
            if (circIndex >= 0) {
               updates[`userDetails/${trace.owner_id}/emCirculacao/${circIndex}/status`] = "Liquidado";
               updates[`userDetails/${trace.owner_id}/emCirculacao/${circIndex}/total_esperado`] = trace.total;
            }

            const activeCirc = currentCirc.filter((c: any, i: number) => i !== circIndex && c.status !== "Liquidado");
            const newTotalCirc = activeCirc.reduce((acc: number, c: any) => acc + c.valor_contribuido, 0);
            const newTotalJuro = activeCirc.reduce((acc: number, c: any) => acc + c.juro_esperado, 0);
            
            updates[`userDetails/${trace.owner_id}/totalEmCirculacao`] = newTotalCirc;
            updates[`userDetails/${trace.owner_id}/totalJuroEsperado`] = newTotalJuro;
            updates[`userDetails/${trace.owner_id}/patrimonioTotal`] = novaCaixa + newTotalCirc + newTotalJuro;
          }
        });

        // 2. Atualizar Comissão do Produtor (20%)
        const juroProdutor = juros * 0.2;
        const comissaoId = "com" + Date.now();
        const comissaoAtual = (dbStore as any).adminComissao || { total: 0, registros: [] };
        updates[`adminComissao/total`] = (comissaoAtual.total || 0) + juroProdutor;
        updates[`adminComissao/registros/${comissaoId}`] = {
             id: comissaoId, ts: Math.floor(Date.now() / 1000),
             origem: `Receita Direta Produtor (Aprov. Manual #${loanId.slice(0,6)})`,
             valor: juroProdutor, loan_id: loanId
        };

        // 3. Atualizar Estado do Empréstimo e Dashboard
        updates[`liquidationRequests/${requestId}/status`] = "Aprovado";
        updates[`loans/${loanId}/status`] = "Liquidado";
        updates[`loans/${loanId}/valor_pago`] = totalPago;
        updates[`loanDetails/${loanId}/loan/status`] = "Liquidado";
        updates[`loanDetails/${loanId}/loan/valor_pago`] = totalPago;
        updates[`loanDetails/${loanId}/traces`] = updatedTraces;

        updates[`dashboard/caixa`] = dbStore.dashboard.caixa + totalPago - juroProdutor;
        updates[`dashboard/naRua`] = Math.max(0, dbStore.dashboard.naRua - base);
        updates[`dashboard/lucros`] = dbStore.dashboard.lucros + juros;
        updates[`dashboard/emprestimos_ativos`] = Math.max(0, dbStore.dashboard.emprestimos_ativos - 1);

        const auditId = "a" + Date.now();
        updates[`audit/${auditId}`] = {
          id: auditId,
          ts: Math.floor(Date.now() / 1000),
          tipo: "LIQUIDACAO",
          desc: `Liquidação Confirmada: Empréstimo #${loanId.slice(0, 6)} pago por ${req.user_nome}. Lucros distribuídos 20/80.`,
          valor: totalPago,
          user: "Admin"
        };

        await update(ref(rtdb), updates);
        toast({ title: "✅ Liquidação Confirmada", description: "Dívida encerrada e lucros distribuídos com sucesso." });
      } catch (err) {
        console.error("[useApproveLiquidationRequest] Erro:", err);
        toast({ title: "Erro na Validação", description: "Não foi possível confirmar a liquidação.", variant: "destructive" });
      } finally {
        setIsPending(false);
      }
    }
  };
}

export function useRejectLiquidationRequest() {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  return {
    isPending,
    mutateAsync: async ({ requestId }: { requestId: string }) => {
      setIsPending(true);
      try {
        const updates: any = {};
        updates[`liquidationRequests/${requestId}/status`] = "Rejeitado";
        await update(ref(rtdb), updates);
        toast({ title: "Liquidação Rejeitada", description: "O pedido de pagamento foi recusado pelo Admin." });
      } catch {
        toast({ title: "Erro", description: "Falha ao rejeitar liquidação.", variant: "destructive" });
      } finally {
        setIsPending(false);
      }
    }
  };
}

// ══════════════════════════════════════════════════
// COMISSÃO FIDUCIÁRIA DO ADMIN
// Acesso exclusivo ao saldo privado de comissões
// Este nó é independente do cofre do sistema
// ══════════════════════════════════════════════════
export function useAdminComissao() {
  useMockDataSync();
  const comissao = (dbStore as any).adminComissao || { total: 0, registros: [] };
  return {
    total: comissao.total || 0,
    registros: comissao.registros || [],
    totalMTn: ((comissao.total || 0) / 100).toFixed(2)
  };
}
