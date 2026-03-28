import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, ShieldAlert, X } from "lucide-react";
import { useAdmin } from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";

export function AdminAuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { login } = useAdmin();
  const { toast } = useToast();
  
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(adminId, password)) {
      toast({ title: "Bem-vindo Administrador", description: "O acesso seguro foi concedido." });
      setAdminId("");
      setPassword("");
      setError(false);
      onClose();
    } else {
      setError(true);
      toast({ title: "Acesso Negado", description: "Credenciais inválidas.", variant: "destructive" });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="glass-panel w-full max-w-sm rounded-2xl p-6 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-primary"></div>
        
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4 text-primary">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Acesso Restrito</h2>
          <p className="text-muted-foreground text-sm text-center">Por favor, insira as credenciais de administração.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">ID do Administrador</label>
            <input 
              type="text" 
              required 
              value={adminId} 
              onChange={e => { setAdminId(e.target.value); setError(false); }} 
              className={`w-full bg-black/40 border ${error ? 'border-destructive' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary font-mono`} 
              placeholder="199451" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Senha Mestra</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={e => { setPassword(e.target.value); setError(false); }} 
              className={`w-full bg-black/40 border ${error ? 'border-destructive' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary font-mono`} 
              placeholder="••••••••" 
            />
          </div>
          
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-2 rounded-lg">
              <ShieldAlert className="w-4 h-4" />
              <span>Acesso bloqueado.</span>
            </motion.div>
          )}

          <button 
            type="submit" 
            className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold shadow-lg mt-2 hover:bg-primary/90 transition-all"
          >
            Desbloquear Cofre
          </button>
        </form>
      </motion.div>
    </div>
  );
}
