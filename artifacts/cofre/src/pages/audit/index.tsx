import { useAudit } from "@/hooks/use-audit";
import { formatMT, formatDateTime, cn } from "@/lib/utils";
import { PageLoader } from "@/components/ui/page-loader";
import { History, ArrowRightLeft, Landmark, DollarSign, UserPlus, ShieldAlert, Trash2, AlertCircle, Loader2, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useFactoryResetSystem } from "@/hooks/use-requests";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EM = { color: 'hsl(160 84% 44%)' };
const EM_BG = { background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.12)' };

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  EMPRESTIMO:    { label: "Empréstimo",  color: 'rgba(251,191,36,0.8)',  bg: 'rgba(251,191,36,0.07)',  icon: ArrowRightLeft },
  LIQUIDACAO:    { label: "Liquidação",  color: 'rgba(16,185,129,0.8)', bg: 'rgba(16,185,129,0.07)', icon: Landmark },
  DEPOSITO:      { label: "Aporte",      color: 'rgba(99,102,241,0.8)',  bg: 'rgba(99,102,241,0.07)',  icon: DollarSign },
  MEMBRO:        { label: "Membro",      color: 'rgba(16,185,129,0.8)', bg: 'rgba(16,185,129,0.07)', icon: UserPlus },
  CONGELAMENTO:  { label: "Alerta",      color: 'rgba(239,68,68,0.8)',   bg: 'rgba(239,68,68,0.07)',   icon: ShieldAlert },
  AUDITORIA:     { label: "Auditoria",   color: 'rgba(16,185,129,0.8)', bg: 'rgba(16,185,129,0.07)', icon: Shield },
};

export default function AuditPage() {
  const { data, isLoading } = useAudit();
  const resetMut = useFactoryResetSystem();
  const [open, setOpen] = useState(false);
  const [confirmCheck, setConfirmCheck] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  if (isLoading) return <PageLoader />;

  const handleReset = async () => {
    if (!confirmCheck || confirmText !== "RESETAR") return;
    try {
      await resetMut.mutateAsync();
      setOpen(false);
      setConfirmCheck(false);
      setConfirmText("");
    } catch {}
  };

  const getConfig = (tipo: string) => TYPE_CONFIG[tipo] || TYPE_CONFIG.AUDITORIA;

  return (
    <div className="space-y-6 max-w-4xl">

      {/* ── Cabeçalho ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-4 border-b border-white/[0.04]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <History className="w-3.5 h-3.5" style={EM} />
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(16,185,129,0.6)' }}>Livro Razão Imutável</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-white">Auditoria Fiscal</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Registo completo de todas as movimentações do sistema.
          </p>
        </div>

        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all" style={{ background: 'rgba(239,68,68,0.06)', color: 'rgba(239,68,68,0.7)', border: '1px solid rgba(239,68,68,0.12)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.12)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.06)'; }}
            >
              <Trash2 className="w-3.5 h-3.5" /> Redefinição de Fábrica
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-md rounded-xl p-0 overflow-hidden border-0" style={{ background: 'hsl(222 35% 7%)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <div className="p-6">
              <AlertDialogHeader>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                    <AlertCircle className="w-5 h-5" style={{ color: 'rgba(239,68,68,0.8)' }} />
                  </div>
                  <div>
                    <AlertDialogTitle className="text-lg font-bold text-white">Acção Irreversível</AlertDialogTitle>
                    <p className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: 'rgba(239,68,68,0.6)' }}>Reset Total do Sistema</p>
                  </div>
                </div>
                <AlertDialogDescription className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Esta acção apagará <strong className="text-white">permanentemente</strong> todos os membros, saldos, empréstimos e históricos. O sistema voltará ao estado original vazio.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="space-y-4 my-5">
                <div className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <Checkbox
                    id="confirm-reset"
                    checked={confirmCheck}
                    onCheckedChange={(c) => setConfirmCheck(c as boolean)}
                    className="mt-0.5 border-white/20 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                  />
                  <Label htmlFor="confirm-reset" className="text-xs text-white/60 cursor-pointer leading-relaxed">
                    Compreendo que todos os dados serão eliminados permanentemente
                  </Label>
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] font-semibold uppercase tracking-widest px-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    Digite "RESETAR" para confirmar
                  </Label>
                  <Input
                    value={confirmText}
                    onChange={e => setConfirmText(e.target.value)}
                    placeholder="RESETAR"
                    className="rounded-lg uppercase font-mono tracking-widest text-center text-sm border-white/8"
                    style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
                  />
                </div>
              </div>

              <AlertDialogFooter className="gap-2">
                <AlertDialogCancel className="rounded-lg px-4 h-10 text-xs font-medium" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={e => { e.preventDefault(); handleReset(); }}
                  disabled={!confirmCheck || confirmText !== "RESETAR" || resetMut.isPending}
                  className="flex-1 rounded-lg h-10 text-xs font-semibold disabled:opacity-30"
                  style={{ background: 'hsl(0 72% 51%)', color: 'white' }}
                >
                  {resetMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar Reset Total"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* ── Log de Auditoria ── */}
      {(!data || data.length === 0) ? (
        <div className="py-20 text-center">
          <History className="w-8 h-8 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.1)' }} />
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.2)' }}>Nenhum registo de auditoria ainda.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.map((entry, i) => {
            const cfg = getConfig(entry.tipo);
            const Icon = cfg.icon;
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="flex items-start gap-4 p-4 rounded-xl group transition-all"
                style={{ background: 'hsl(222 35% 7%)', border: '1px solid rgba(255,255,255,0.04)' }}
              >
                {/* Ícone */}
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: cfg.bg, border: `1px solid ${cfg.color.replace('0.8', '0.15')}` }}>
                  <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[9px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ background: cfg.bg, color: cfg.color }}>
                      {cfg.label}
                    </span>
                    <div className="flex items-center gap-1 text-[9px] font-semibold" style={{ color: 'rgba(16,185,129,0.6)' }}>
                      <div className="w-1 h-1 rounded-full" style={{ background: 'hsl(160 84% 44%)' }} />
                      Efetuado
                    </div>
                    <time className="text-[9px] font-mono ml-auto" style={{ color: 'rgba(255,255,255,0.2)' }}>
                      {formatDateTime(entry.ts)}
                    </time>
                  </div>
                  <p className="text-sm text-white/80 leading-relaxed">{entry.desc}</p>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/[0.04]">
                    <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      Por: {entry.user}
                    </span>
                    {entry.valor > 0 && (
                      <span className="text-xs font-semibold font-mono" style={EM}>
                        {formatMT(entry.valor)}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
