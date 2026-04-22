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
      
      <AlertDialogContent className="glass-panel border-destructive/50 max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-3 text-destructive">
            <ShieldAlert className="w-6 h-6" />
            Atenção: Ação Irreversível
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground pt-4">
            {step === 1 ? (
              <div className="space-y-4 text-white/70">
                <p>
                  Você está prestes a realizar um <strong className="text-white">Reset Total do Sistema</strong>. 
                  Esta ação apagará permanentemente:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm font-medium">
                  <li>Todos os Membros e Saldos</li>
                  <li>Empréstimos e Históricos</li>
                  <li>Solicitações e Auditorias</li>
                </ul>
                <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20 text-xs text-destructive flex gap-3">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <span>O sistema voltará ao estado original vazio. Esta ação não pode ser desfeita.</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-white/70">Para confirmar a redefinição total, digite a frase abaixo:</p>
                <div className="p-4 bg-secondary/50 rounded-lg text-center font-mono font-bold tracking-widest text-white select-none">
                  RESETAR
                </div>
                <Input 
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                  placeholder="Digite RESETAR para confirmar"
                  className="bg-background/50 border-destructive/30 focus-visible:ring-white text-white font-bold text-center"
                  autoFocus
                />
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="mt-6">
          <AlertDialogCancel onClick={resetState}>Cancelar</AlertDialogCancel>
          {step === 1 ? (
            <Button 
              variant="destructive" 
              onClick={() => setStep(2)}
              className="bg-destructive hover:bg-destructive/90 text-white font-bold"
            >
              Sim, desejo prosseguir
            </Button>
          ) : (
            <AlertDialogAction
              onClick={handleReset}
              disabled={confirmText !== "RESETAR" || isResetting}
              className="bg-destructive text-white hover:bg-destructive/90 disabled:opacity-50 font-bold"
            >
              {isResetting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Limpando...
                </>
              ) : (
                "Confirmar Redefinir Total"
              )}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
