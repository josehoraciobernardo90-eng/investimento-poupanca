import { useState } from "react";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { factoryReset } from "@/data/firebase-data";
import { useToast } from "@/hooks/use-toast";
import { Trash2, AlertTriangle, ShieldAlert, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export function ResetAppModal() {
  const [step, setStep] = useState(1);
  const [confirmText, setConfirmText] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const { toast } = useToast();

  const handleReset = async () => {
    if (confirmText !== "RESETAR") {
      toast({ title: "Palavra-chave incorrecta", description: "Escreva RESETAR exactamente.", variant: "destructive" });
      return;
    }
    
    // 🛡️ ESTRATÉGIA DE ESTABILIDADE:
    // Informamos o sistema, limpamos e saímos IMEDIATAMENTE.
    // Não usamos estados locais que dependam do componente estar montado.
    console.log("[RESET] Purgação total em curso...");
    
    try {
      await factoryReset();
      
      // Sem delays. O redireccionamento limpa o estado do React e evita o removeChild error.
      window.location.href = "/";
    } catch (error) {
      console.error("[RESET] Erro catastrófico:", error);
      alert("Erro ao limpar dados. Recarregue a página.");
      window.location.reload();
    }
  };

  const resetState = () => {
    setStep(1);
    setConfirmText("");
  };

  return (
    <AlertDialog onOpenChange={(open) => !open && resetState()}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="gap-2 bg-destructive/10 hover:bg-destructive text-destructive hover:text-white border-2 border-destructive/20 transition-all duration-300">
          <Trash2 className="w-4 h-4" />
          Redefinir Total do Sistema
        </Button>
      </AlertDialogTrigger>
      
      <AlertDialogContent className="bg-[#090D14] border border-white/10 rounded-[2rem] max-w-md overflow-hidden p-0 shadow-2xl">
        <div className="p-8">
          <AlertDialogHeader>
            <div className="flex justify-center mb-6">
               <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center relative group">
                  <div className="absolute inset-0 bg-rose-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <ShieldAlert className="w-8 h-8 text-rose-500 relative z-10" />
               </div>
            </div>
            
            <AlertDialogTitle className="text-2xl font-black text-white italic tracking-tighter text-center uppercase">
              Operação de Purgação
            </AlertDialogTitle>
            
            <AlertDialogDescription className="pt-4 text-center">
              {step === 1 ? (
                <div className="space-y-6">
                  <p className="text-sm font-medium text-slate-400 leading-relaxed">
                    Você está prestes a realizar uma <span className="text-white font-bold">Rescisão Global</span> no sistema. Todo o histórico fiscal, membros e capital serão <span className="text-rose-400 font-black">EXTINTOS</span> permanentemente.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 text-[9px] font-black uppercase tracking-widest text-slate-500">
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex items-center gap-2">
                       <div className="w-1 h-1 rounded-full bg-rose-500" /> Saldos Membros
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex items-center gap-2">
                       <div className="w-1 h-1 rounded-full bg-rose-500" /> Contratos Ativos
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex items-center gap-2">
                       <div className="w-1 h-1 rounded-full bg-rose-500" /> Livro Razão
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex items-center gap-2">
                       <div className="w-1 h-1 rounded-full bg-rose-500" /> Auditoria Fiscal
                    </div>
                  </div>

                  <div className="p-4 bg-rose-500/5 rounded-2xl border border-rose-500/20 flex gap-4 items-start text-left">
                    <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                    <p className="text-[10px] text-rose-200/60 font-medium leading-tight uppercase tracking-widest">
                      Aviso: Esta acção é executada a nível de núcleo. Não existe mecanismo de recuperação pós-limpeza.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <p className="text-sm font-medium text-slate-400">Autenticação de Segurança Exigida:</p>
                  <div className="p-6 bg-slate-950 rounded-2xl border border-white/5 text-center font-mono text-xl font-black tracking-[0.3em] text-white select-none shadow-inner">
                    RESETAR
                  </div>
                  <Input 
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                    placeholder="DIGITE A CHAVE PARA EXECUTAR"
                    className="h-14 bg-white/5 border-rose-500/30 focus-visible:ring-rose-500/50 text-white font-black text-center text-xs tracking-wider rounded-xl uppercase shadow-2xl"
                    autoFocus
                  />
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="flex flex-col gap-3 mt-8">
            {step === 1 ? (
              <Button 
                variant="destructive" 
                onClick={() => setStep(2)}
                className="h-14 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-xl shadow-rose-900/20 active:scale-95"
              >
                Autorizar Purgação
              </Button>
            ) : (
              <AlertDialogAction
                onClick={handleReset}
                disabled={confirmText !== "RESETAR" || isResetting}
                asChild
              >
                <Button className="h-14 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-xl shadow-rose-900/40 disabled:opacity-30 active:scale-95">
                  {isResetting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      LIMPANDO NÚCLEO...
                    </>
                  ) : (
                    "EXECUTAR RESET TOTAL"
                  )}
                </Button>
              </AlertDialogAction>
            )}
            <AlertDialogCancel onClick={resetState} className="h-14 border-white/5 bg-transparent hover:bg-white/5 text-slate-500 hover:text-white rounded-2xl transition-all font-bold uppercase tracking-widest text-[10px]">
              Abortar Operação
            </AlertDialogCancel>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
