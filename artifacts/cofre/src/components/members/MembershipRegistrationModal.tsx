import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserIcon, MapPin, Contact, CreditCard, CheckCircle2, ChevronRight, ChevronLeft, ShieldAlert, Eye, EyeOff } from "lucide-react";
import { createPortal } from "react-dom";
import { useCreateMembershipRequest } from "@/hooks/use-requests";
import { formatMT } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function MembershipRegistrationModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const createMutation = useCreateMembershipRequest();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    profissao: "",
    telefone: "",
    bairro: "",
    cidade: "",
    nuit: "",
    saldo_base: "1000",
    pin: "",
    confirmPin: ""
  });


  const nextStep = () => setStep(s => Math.min(4, s + 1));
  const prevStep = () => setStep(s => Math.max(1, s - 1));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 4) {
      setStep(s => s + 1);
      return;
    }

    if (formData.pin.length !== 6 || !/^\d+$/.test(formData.pin)) {
      toast({ title: "PIN Inválido", description: "O PIN deve ter exatamente 6 dígitos numéricos.", variant: "destructive" });
      return;
    }

    if (formData.pin !== formData.confirmPin) {
      toast({ title: "Erro de Confirmação", description: "Os PINs digitados não coincidem.", variant: "destructive" });
      return;
    }

    const val = parseFloat(formData.saldo_base.replace(',', '.'));
    if (isNaN(val) || val <= 0) return;

    // Foto is just the initials
    const foto = formData.nome.substring(0, 2).toUpperCase();

    await createMutation.mutateAsync({
      data: {
        nome: formData.nome,
        foto,
        saldo_base: Math.round(val * 100),
        profissao: formData.profissao,
        telefone: formData.telefone,
        bairro: formData.bairro,
        cidade: formData.cidade,
        nuit: formData.nuit,
        pin: formData.pin
      }
    });

    setIsSubmitted(true);
    setTimeout(() => {
      onClose();
      setTimeout(() => {
        setStep(1);
        setIsSubmitted(false);
        setFormData({ 
          nome: "", profissao: "", telefone: "", bairro: "", cidade: "", 
          nuit: "", saldo_base: "1000", pin: "", confirmPin: "" 
        });
      }, 500);
    }, 3000);
  };

  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto pt-20 pb-10"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            key="modal-content"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="glass-panel w-full max-w-xl rounded-3xl p-0 relative overflow-hidden flex flex-col"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-primary"></div>

            {/* Header */}
            <div className="p-6 pb-4 flex justify-between items-center border-b border-white/5">
              <div>
                <h2 className="text-2xl font-display font-bold text-white">Nova Adesão</h2>
                <p className="text-muted-foreground text-sm mt-1">Registo completo para análise do cofre.</p>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-white bg-white/5 rounded-full p-2">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Indicator */}
            <div className="px-6 pt-6 pb-2">
              <div className="flex items-center justify-between relative">
                <div className="absolute left-0 top-1/2 w-full h-0.5 bg-white/10 -z-10 -translate-y-1/2 rounded-full"></div>
                {/* Stepper progress bar */}
                <div className={`absolute left-0 top-1/2 h-0.5 bg-primary -z-10 -translate-y-1/2 rounded-full transition-all duration-500`} style={{ width: `${(step - 1) * 33.3}%` }}></div>

                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 shadow-lg ${step >= i ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground border-2 border-white/10'}`}>
                    {step > i ? <CheckCircle2 className="w-5 h-5" /> : i}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-[10px] font-bold uppercase tracking-tighter text-muted-foreground px-1">
                <span className={step >= 1 ? "text-primary" : ""}>Pessoal</span>
                <span className={step >= 2 ? "text-primary" : ""}>Contactos</span>
                <span className={step >= 3 ? "text-primary" : ""}>Aporte</span>
                <span className={step >= 4 ? "text-primary" : ""}>Segurança</span>
              </div>
            </div>

            {/* Form Body */}
            <div className="p-6 relative">
              {isSubmitted ? (
                <motion.div 
                  key="success-view"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-12 flex flex-col items-center text-center space-y-4"
                >
                  <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center text-primary mb-2">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Pedido Enviado!</h3>
                  <p className="text-muted-foreground max-w-xs mx-auto">
                    O seu registo foi submetido com sucesso. Aguarde a validação do administrador para o próximo passo.
                  </p>
                  <div className="pt-4">
                    <button onClick={onClose} className="bg-white/5 hover:bg-white/10 text-white px-8 py-2.5 rounded-xl font-medium transition-colors">
                      Fechar Janela
                    </button>
                  </div>
                </motion.div>
              ) : (
                <form 
                  key={`registration-form-step-${step}`} // Use Step in key to solve DOM reconcile issue
                  onSubmit={handleSubmit}
                >
                  {step === 1 && (
                    <div key="form-step-1" className="space-y-4 animate-in fade-in duration-300">
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1"><UserIcon className="w-4 h-4" /> Nome Completo</label>
                        <input required name="nome" value={formData.nome} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" placeholder="Ex: João da Silva" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">Cidade</label>
                          <input required name="cidade" value={formData.cidade} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" />
                        </div>
                        <div>
                          <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">Profissão</label>
                          <input required name="profissao" value={formData.profissao} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" placeholder="Engenheiro" />
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div key="form-step-2" className="space-y-4 animate-in fade-in duration-300">
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1"><Contact className="w-4 h-4" /> Telefone Principal</label>
                        <input required name="telefone" value={formData.telefone} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary font-mono" placeholder="+258 84 123 4567" />
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1"><MapPin className="w-4 h-4" /> Bairro (Morada)</label>
                        <input required name="bairro" value={formData.bairro} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" placeholder="Bairro 25 de Setembro" />
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div key="form-step-3" className="space-y-4 animate-in fade-in duration-300">
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1"><CreditCard className="w-4 h-4" /> NUIT (Nº Único de Identificação Tributária)</label>
                        <input required name="nuit" value={formData.nuit} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary font-mono" placeholder="400 123 456" />
                      </div>
                      <div className="mt-8 bg-primary/10 border border-primary/20 rounded-2xl p-5">
                        <label className="block text-sm font-bold text-primary mb-2">Aporte Inicial Proposto (MT)</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">MT</span>
                          <input required type="number" step="0.01" name="saldo_base" value={formData.saldo_base} onChange={handleChange} className="w-full bg-black/60 border border-primary/30 rounded-xl pl-12 pr-4 py-4 text-xl font-mono text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50" placeholder="5000.00" />
                        </div>
                        <p className="text-xs text-primary/70 mt-3 flex items-center gap-2">
                          Atenção: A admissão está sujeita a aprovação fiduciária pelo administrador. O valor deve ser transferido após a aprovação para validade.
                        </p>
                      </div>
                    </div>
                  )}
                  {step === 4 && (
                    <div key="form-step-4" className="space-y-6 animate-in fade-in duration-300">
                      <div className="bg-warning/10 border border-warning/20 p-4 rounded-xl flex items-start gap-3">
                         <ShieldAlert className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                         <p className="text-xs text-warning leading-relaxed">
                            Crie um <b>PIN de 6 dígitos</b>. Este código será solicitado sempre que você quiser aceder ao seu cofre pelo aplicativo. Não partilhe com ninguém.
                         </p>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-5">
                        <div>
                          <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">Criar PIN de 6 Dígitos</label>
                          <div className="relative">
                            <input 
                              required 
                              type={showPin ? "text" : "password"} 
                              inputMode="numeric"
                              maxLength={6}
                              name="pin" 
                              value={formData.pin} 
                              onChange={handleChange} 
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-center text-2xl tracking-[1em] text-white focus:outline-none focus:border-primary font-mono" 
                              placeholder="******" 
                            />
                            <button 
                              type="button"
                              onClick={() => setShowPin(!showPin)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                            >
                              {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">Confirmar PIN</label>
                          <div className="relative">
                            <input 
                              required 
                              type={showConfirmPin ? "text" : "password"} 
                              inputMode="numeric"
                              maxLength={6}
                              name="confirmPin" 
                              value={formData.confirmPin} 
                              onChange={handleChange} 
                              className={`w-full bg-black/40 border ${formData.confirmPin && formData.pin !== formData.confirmPin ? 'border-destructive' : 'border-white/10'} rounded-xl px-4 py-4 text-center text-2xl tracking-[1em] text-white focus:outline-none focus:border-primary font-mono`} 
                              placeholder="******" 
                            />
                            <button 
                              type="button"
                              onClick={() => setShowConfirmPin(!showConfirmPin)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                            >
                              {showConfirmPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                          {formData.confirmPin && formData.pin !== formData.confirmPin && (
                            <p className="text-destructive text-[10px] font-bold mt-2 text-center uppercase tracking-wider animate-in fade-in slide-in-from-top-1">
                              Os PINs digitados não coincidem!
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Footer Buttons */}
                  <div className="flex justify-between items-center mt-8 pt-4 border-t border-white/5">
                    {step > 1 ? (
                      <button type="button" onClick={prevStep} className="px-6 py-2.5 rounded-xl font-medium text-muted-foreground hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2">
                        <ChevronLeft className="w-4 h-4" /> Voltar
                      </button>
                    ) : <div></div>}

                    <button
                      type="submit"
                      disabled={createMutation.isPending}
                      className={`px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg ${step === 4 ? 'bg-success text-white hover:bg-success/90 hover:scale-105' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                      {step < 4 ? (
                        <>Próximo <ChevronRight className="w-4 h-4" /></>
                      ) : createMutation.isPending ? (
                        "A Enviar..."
                      ) : (
                        "Finalizar Registo"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
