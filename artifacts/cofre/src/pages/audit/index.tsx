import { useAudit } from "@/hooks/use-audit";
import { formatMT, formatDateTime, cn } from "@/lib/utils";
import { PageLoader } from "@/components/ui/page-loader";
import { History, ArrowRightLeft, Landmark, DollarSign, UserPlus, ShieldAlert, Trash2, AlertCircle, Loader2 } from "lucide-react";
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

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case "EMPRESTIMO": return <ArrowRightLeft className="w-4 h-4 text-warning" />;
      case "LIQUIDACAO": return <Landmark className="w-4 h-4 text-success" />;
      case "DEPOSITO": return <DollarSign className="w-4 h-4 text-info" />;
      case "MEMBRO": return <UserPlus className="w-4 h-4 text-primary" />;
      case "CONGELAMENTO": return <ShieldAlert className="w-4 h-4 text-destructive" />;
      default: return <History className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">Auditoria</h1>
          <p className="text-muted-foreground">Log imutável de todas as movimentações financeiras do cofre.</p>
        </div>

        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild>
            <button className="flex items-center gap-2 bg-destructive/10 text-destructive border border-destructive/20 px-4 py-2 rounded-xl text-sm font-bold hover:bg-destructive hover:text-white transition-all">
              <Trash2 className="w-4 h-4" /> Redefinição de Fábrica
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="glass-panel border-white/10 rounded-[2rem] max-w-md p-8 shadow-2xl">
            <AlertDialogHeader>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-destructive/20 flex items-center justify-center text-destructive border border-destructive/20">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <div>
                  <AlertDialogTitle className="text-2xl font-bold text-white">CUIDADO!</AlertDialogTitle>
                  <p className="text-[10px] text-destructive uppercase font-bold tracking-widest">Ação Irreversível</p>
                </div>
              </div>
              <AlertDialogDescription className="text-muted-foreground text-sm space-y-4">
                <p>Esta acção irá **apagar permanentemente** todos os membros, saldos, empréstimos e históricos do sistema.</p>
                <p className="font-bold text-white">O sistema voltará ao estado original vazio.</p>
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-6 my-6">
              <div className="flex items-start space-x-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                <Checkbox 
                  id="confirm-reset" 
                  checked={confirmCheck} 
                  onCheckedChange={(checked) => setConfirmCheck(checked as boolean)}
                  className="mt-1 border-white/20 data-[state=checked]:bg-destructive data-[state=checked]:border-destructive"
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="confirm-reset" className="text-xs font-medium text-white cursor-pointer">
                    Compreendo que todos os usuários e saldos serão removidos
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Digite "RESETAR" para confirmar</Label>
                <Input 
                  value={confirmText} 
                  onChange={e => setConfirmText(e.target.value)} 
                  placeholder="RESETAR" 
                  className="bg-white/5 border-white/10 rounded-xl uppercase font-black tracking-widest text-center"
                />
              </div>
            </div>

            <AlertDialogFooter className="gap-3">
              <AlertDialogCancel className="bg-white/5 text-muted-foreground hover:text-white border-white/10 rounded-2xl px-6 h-12 font-bold transition-all">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleReset();
                }}
                disabled={!confirmCheck || confirmText !== "RESETAR" || resetMut.isPending}
                className="bg-destructive hover:bg-destructive/90 text-white rounded-2xl px-8 h-12 font-bold transition-all shadow-lg shadow-destructive/20 flex-1 disabled:opacity-30"
              >
                {resetMut.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirmar Reset Total"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="relative pl-6 space-y-8 mt-8 before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
        {data?.map((entry, i) => (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            key={entry.id} 
            className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full border-4 border-background bg-card shadow-lg shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 group-hover:border-primary/50 transition-colors">
              {getIcon(entry.tipo)}
            </div>
            
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] glass-panel p-4 rounded-xl shadow-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-white/5 text-muted-foreground">{entry.tipo}</span>
                <time className="text-xs text-muted-foreground font-mono">{formatDateTime(entry.ts)}</time>
              </div>
              <p className="text-sm text-white font-medium my-2">{entry.desc}</p>
              <div className="flex justify-between items-end mt-3 pt-3 border-t border-white/5">
                <span className="text-xs text-muted-foreground">Responsável: {entry.user}</span>
                {entry.valor > 0 && (
                  <span className="font-mono text-primary font-bold">{formatMT(entry.valor)}</span>
                )}
              </div>
            </div>
          </motion.div>
        ))}

        {(!data || data.length === 0) && (
          <div className="text-center py-12 text-muted-foreground">
            Nenhum registro encontrado.
          </div>
        )}
      </div>
    </div>
  );
}
