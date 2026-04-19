import { useState } from "react";
import { useRoute } from "wouter";
import { useUser, useUpdateUser } from "@/hooks/use-users";
import { useLoans } from "@/hooks/use-loans";
import { formatMT } from "@/lib/utils";
import { PageLoader } from "@/components/ui/page-loader";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ArrowLeft, Wallet, TrendingUp, Briefcase, Lock, Unlock, ShieldCheck } from "lucide-react";
import { Link } from "wouter";

export default function MemberDetailPage() {
  const [, params] = useRoute("/membros/:id");
  const id = params?.id || "";
  const { data, isLoading } = useUser(id);
  const updateMutation = useUpdateUser();
  const { data: allLoans } = useLoans();
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  if (isLoading) return <PageLoader />;
  if (!data) return <div className="text-destructive p-8 bg-destructive/10 rounded-xl">Membro não encontrado.</div>;

  const toggleStatus = async () => {
    await updateMutation.mutateAsync({
      userId: id,
      data: {
        status: data.user.status === "Ativo" ? "Congelado" : "Ativo"
      }
    });
    setIsConfirmOpen(false);
  };

  // Professional Limit Calculation
  const limiteTotal = data.emCaixa * 1.30;
  const dividaAtiva = allLoans?.filter(l => l.user_id === id && l.status !== "Liquidado")
    .reduce((acc, l) => acc + l.total_devido, 0) || 0;
  const limiteDisponivel = Math.max(0, limiteTotal - dividaAtiva);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/membros" className="p-2 glass-panel rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-display font-bold text-white">{data.user.nome}</h1>
            <StatusBadge status={data.user.status} />
          </div>
          <p className="text-muted-foreground">Mapa de Capital e Investimentos</p>
        </div>
        <button
          onClick={() => setIsConfirmOpen(true)}
          disabled={updateMutation.isPending}
          className="flex items-center gap-2 glass-panel px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-white/5 transition-colors disabled:opacity-50"
        >
          {data.user.status === "Ativo" ? <><Lock className="w-4 h-4 text-warning" /> Congelar Conta</> : <><Unlock className="w-4 h-4 text-success" /> Ativar Conta</>}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Disponível (Caixa)" value={formatMT(data.emCaixa)} icon={<Wallet />} className="border-primary/20 bg-primary/5" />
        <StatCard
          title="Limite Disponível"
          value={formatMT(limiteDisponivel)}
          description={dividaAtiva > 0 ? "Descontando dívidas activas" : "Caixa + 30%"}
          icon={<ShieldCheck className="text-success" />}
          className="bg-success/5 border-success/20"
        />
        <StatCard title="Patrimônio Total" value={formatMT(data.patrimonioTotal)} icon={<Briefcase />} />
        <StatCard title="Juro Esperado" value={formatMT(data.totalJuroEsperado)} icon={<TrendingUp className="text-success" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-10">
        {/* Left Column: Personal Profile */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-2 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" /> Perfil do Investidor
          </h2>
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                 <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Contacto Principal</p>
                 <p className="font-mono text-white tracking-wide">{data.user.telefone || "N/A"}</p>
              </div>
              <div>
                 <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">E-mail</p>
                 <p className="text-white truncate">{data.user.email || "N/A"}</p>
              </div>
            </div>
            
            <div className="pt-4 border-t border-white/5 space-y-4">
              <div>
                 <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Endereço Fiscal</p>
                 <p className="text-white">{data.user.endereco || (data.user.bairro ? `${data.user.bairro}${data.user.zona ? `, ${data.user.zona}` : ''}, ${data.user.cidade || 'Chimoio'}` : "Não fornecido")}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">NUIT</p>
                    <p className="font-mono text-white">{data.user.nuit || "N/A"}</p>
                 </div>
                 <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Profissão</p>
                    <p className="text-white">{data.user.profissao || "N/A"}</p>
                 </div>
              </div>
            </div>

            {/* Nova Secção: Contactos de Emergência */}
            <div className="pt-4 border-t border-blue-500/20 space-y-4 bg-blue-500/5 -mx-6 px-6 pb-2">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-2">Emergência / Parentes</p>
              
              <div className="space-y-3">
                {data.user.conjuge_nome && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 uppercase font-bold text-[9px]">Cônjuge:</span>
                    <span className="text-white font-medium">{data.user.conjuge_nome} ({data.user.conjuge_numero})</span>
                  </div>
                )}
                {data.user.irmao_nome && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 uppercase font-bold text-[9px]">Irmão/ã:</span>
                    <span className="text-white font-medium">{data.user.irmao_nome} ({data.user.irmao_numero})</span>
                  </div>
                )}
                {data.user.parente_nome && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 uppercase font-bold text-[9px]">Parente:</span>
                    <span className="text-white font-medium">{data.user.parente_nome} ({data.user.parente_numero})</span>
                  </div>
                )}
                {!data.user.conjuge_nome && !data.user.irmao_nome && !data.user.parente_nome && (
                  <p className="text-[10px] text-slate-500 italic">Nenhum contacto de emergência registado.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Active Loans / Circulation */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-2 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> Capital em Circulação
          </h2>

          {(data.emCirculacao || []).length === 0 ? (
            <div className="glass-panel rounded-2xl p-10 text-center text-muted-foreground">
               Nenhum capital alocado em empréstimos no momento.
            </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(data.emCirculacao || []).map((item, i) => (
            <Link key={i} href={`/emprestimos/${item.loan_id}`}>
              <div className="glass-panel rounded-2xl p-5 hover:border-primary/30 transition-all group cursor-pointer h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-white">
                    {item.tomador_foto}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Mutuário: {item.tomador_nome}</h4>
                    <StatusBadge status={item.status} className="mt-1" />
                  </div>
                </div>

                <div className="space-y-3 mt-4 pt-4 border-t border-white/5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Valor Contribuído</span>
                    <span className="font-mono text-white font-medium">{formatMT(item.valor_contribuido)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Participação no Empréstimo</span>
                    <span className="text-sm px-2 py-0.5 bg-primary/20 text-primary rounded-md">{item.pctDoEmprestimo.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Juro Atual ({item.taxa_atual}%)</span>
                    <span className="font-mono text-success font-medium">+{formatMT(item.juro_esperado)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-white/5">
                    <span className="text-sm font-medium text-white">Total a Receber</span>
                    <span className="font-mono text-primary font-bold text-lg">{formatMT(item.total_esperado)}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-sm rounded-[2rem] p-8 border border-white/10 relative overflow-hidden text-center">
            <div className="w-16 h-16 rounded-full bg-warning/20 flex items-center justify-center mx-auto mb-4 text-warning">
               <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {data.user.status === "Ativo" ? "Congelar Conta?" : "Ativar Conta?"}
            </h2>
            <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
              {data.user.status === "Ativo" 
                ? "O membro ficará impedido de solicitar novos empréstimos ou realizar aportes até que a conta seja desbloqueada."
                : "O membro voltará a ter acesso total a todas as funcionalidades do cofre."}
            </p>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={toggleStatus}
                disabled={updateMutation.isPending}
                className={`w-full py-3.5 rounded-2xl font-bold transition-all shadow-lg ${
                  data.user.status === "Ativo" ? "bg-warning text-black" : "bg-success text-white"
                }`}
              >
                {updateMutation.isPending ? "Processando..." : "Confirmar Alteração"}
              </button>
              <button
                onClick={() => setIsConfirmOpen(false)}
                className="w-full py-3.5 rounded-2xl font-semibold text-muted-foreground hover:text-white bg-white/5 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
