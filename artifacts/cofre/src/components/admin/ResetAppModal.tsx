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
    if (confirmText !== "LIMPAR TUDO") return;
    
    setIsResetting(true);
    try {
      await factoryReset();
      toast({
        title: "Sistema Limpo",
        description: "Todos os dados foram apagados com sucesso.",
        variant: "default",
      });
      // Recarregar a página para limpar o estado local
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      toast({
        title: "Erro ao limpar",
        description: "Não foi possível apagar os dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
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
          Limpar Todo o App (Reset)
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
              <div className="space-y-4">
                <p>
                  Você está prestes a realizar um <strong>Reset de Fábrica</strong>. 
                  Isso apagará permanentemente todos os:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm font-medium">
                  <li>Membros e Detalhes de Conta</li>
                  <li>Empréstimos e Histórico de Pagamentos</li>
                  <li>Registros de Auditoria e Logs</li>
                  <li>Solicitações e Notificações</li>
                </ul>
                <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20 text-xs text-destructive flex gap-3">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <span>Esta ação não pode ser desfeita. Todos os valores do dashboard voltarão a zero.</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p>Para confirmar que você deseja apagar <strong>TUDO</strong>, digite a frase abaixo:</p>
                <div className="p-4 bg-secondary/50 rounded-lg text-center font-mono font-bold tracking-widest text-white select-none">
                  LIMPAR TUDO
                </div>
                <Input 
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                  placeholder="Digite a frase de confirmação"
                  className="bg-background/50 border-destructive/30 focus-visible:ring-destructive"
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
              className="bg-destructive hover:bg-destructive/90"
            >
              Sim, Desejo Prosseguir
            </Button>
          ) : (
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleReset();
              }}
              disabled={confirmText !== "LIMPAR TUDO" || isResetting}
              className="bg-destructive text-white hover:bg-destructive/90 disabled:opacity-50"
            >
              {isResetting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Limpando...
                </>
              ) : (
                "APAGAR TUDO AGORA"
              )}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
