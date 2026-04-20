import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserIcon, MapPin, Contact, CreditCard, CheckCircle2, ChevronRight, ChevronLeft, ShieldAlert, Eye, EyeOff, Loader2 } from "lucide-react";
import { createPortal } from "react-dom";
import { useCreateMembershipRequest } from "@/hooks/use-requests";
import { formatMT, cn } from "@/lib/utils";
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
    cidade: "Chimoio",
    nuit: "",
    saldo_base: "1000",
    pin: "",
    confirmPin: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Sanitização para campos numéricos
    if (e.target.name === 'telefone' || e.target.name === 'nuit' || e.target.name === 'pin' || e.target.name === 'confirmPin') {
      value = value.replace(/\D/g, ''); // Mantém apenas números
    }
    
    setFormData({ ...formData, [e.target.name]: value });
  };

  const isStepValid = () => {
    switch(step) {
      case 1: return formData.nome.length > 3 && formData.cidade.length > 2;
      case 2: return formData.telefone.length >= 9 && formData.bairro.length > 2;
      case 3: return formData.nuit.length >= 9 && !isNaN(parseFloat(formData.saldo_base));
      case 4: return formData.pin.length === 6 && formData.pin === formData.confirmPin;
      default: return false;
    }
  };

  const nextStep = () => {
    if (isStepValid()) setStep(s => s + 1);
    else {
      toast({ 
        title: "Campos Incompletos", 
        description: "Por favor, preencha todos os dados corretamente para continuar.", 
        variant: "destructive" 
      });
    }
  };
  
  const prevStep = () => setStep(s => Math.max(1, s - 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 4) {
      nextStep();
      return;
    }

    if (!isStepValid()) return;

    try {
      const val = parseFloat(formData.saldo_base.replace(',', '.'));
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

      // Sucesso na nuvem: Transição Profissional
      setIsSubmitted(true);
      
      // Timer tático para fechar e limpar
      const timerClose = setTimeout(() => {
        onClose();
        const timerReset = setTimeout(() => {
          setStep(1);
          setIsSubmitted(false);
          setFormData({ 
            nome: "", profissao: "", telefone: "", bairro: "", cidade: "Chimoio", 
            nuit: "", saldo_base: "1000", pin: "", confirmPin: "" 
          });
        }, 500);
        return () => clearTimeout(timerReset);
      }, 3000);
      
      return () => clearTimeout(timerClose);
    } catch (err) {
       console.error("[MembershipModal] Erro no fluxo de submissão:", err);
    }
  };

  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto pt-20 pb-10"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            key="modal-content"
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            className="glass-panel w-full max-w-xl rounded-[2.5rem] p-0 relative overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)] border-primary/20"
          >
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent"></div>

            {/* Cabeçalho Profissional */}
            <div className="p-8 pb-6 flex justify-between items-center bg-white/5 border-b border-white/5">
              <div>
                <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Ficha de Adesão</h2>
                <p className="text-[10px] text-primary font-black uppercase tracking-[0.3em] mt-1">Protocolo de Segurança Ativo • Chimoio</p>
              </div>
              <button onClick={onClose} className="text-white/40 hover:text-white bg-white/5 rounded-full p-2.5 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Indicador de Passos Elite */}
            <div className="px-8 pt-8 pb-4">
              <div className="flex items-center justify-between relative px-2">
                <div className="absolute left-0 top-[18px] w-full h-[1px] bg-white/10 -z-10 rounded-full"></div>
                <div className="absolute left-0 top-[18px] h-[1px] bg-primary -z-10 rounded-full transition-all duration-700" style={{ width: `${(step - 1) * 33.3}%` }}></div>

                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs transition-all duration-500 shadow-xl border cursor-default",
                    step >= i ? "bg-primary border-primary text-black scale-110 shadow-primary/20" : "bg-[#050505] border-white/10 text-white/40"
                  )}>
                    {step > i ? <CheckCircle2 className="w-5 h-5" /> : i}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-4 text-[8px] font-black uppercase tracking-[0.2em] text-white/40 px-1">
                <span className={step >= 1 ? "text-primary" : ""}>Dados Pessoais</span>
                <span className={step >= 2 ? "text-primary" : ""}>Localização</span>
                <span className={step >= 3 ? "text-primary" : ""}>Capital Inicial</span>
                <span className={step >= 4 ? "text-primary" : ""}>Segurança PIN</span>
              </div>
            </div>

            {/* Corpo do Formulário */}
            <div className="p-8 relative">
              {isSubmitted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-10 flex flex-col items-center text-center space-y-6"
                >
                  <div className="w-24 h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary border border-primary/20 shadow-[0_0_40px_rgba(0,212,255,0.2)] animate-pulse">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase">Pedido Enviado</h3>
                    <p className="text-xs text-white/40 max-w-xs mx-auto mt-3 leading-relaxed uppercase font-black">
                      O seu registo está na nuvem aguardando aprovação fiduciária do Administrador.
                      <br/><br/>
                      <span className="text-primary tracking-widest">NÃO FAÇA LOGIN AINDA!</span> Aguarde confirmação.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  {step === 1 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
                      <div>
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block px-1">Seu Nome Completo</label>
                        <input required name="nome" value={formData.nome} onChange={handleChange} className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:outline-none focus:border-primary/40 focus:bg-white/10 transition-all" placeholder="Como no seu bilhete..." />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block px-1">Cidade de Residência</label>
                          <input required name="cidade" value={formData.cidade} onChange={handleChange} className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:outline-none focus:border-primary/40" />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block px-1">O que você faz?</label>
                          <input required name="profissao" value={formData.profissao} onChange={handleChange} className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:outline-none focus:border-primary/40" placeholder="Ex: Negociante" />
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
                      <div>
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block px-1">Contacto Principal (M-Pesa)</label>
                        <input required name="telefone" maxLength={9} value={formData.telefone} onChange={handleChange} className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-xl font-black text-white focus:outline-none focus:border-primary/40 text-center tracking-widest" placeholder="843334444" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block px-1">Bairro e Morada</label>
                        <input required name="bairro" value={formData.bairro} onChange={handleChange} className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:outline-none focus:border-primary/40" placeholder="Ex: Bairro 25 de Setembro, Casa nº 10" />
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
                      <div>
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block px-1">Seu NUIT (9 Dígitos)</label>
                        <input required name="nuit" maxLength={9} value={formData.nuit} onChange={handleChange} className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:outline-none focus:border-primary/40 text-center tracking-widest" placeholder="400111222" />
                      </div>
                      <div className="bg-primary/5 border border-primary/20 rounded-[2rem] p-8 text-center">
                        <label className="block text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4">Capital para Iniciar (MT)</label>
                        <div className="relative max-w-[240px] mx-auto">
                          <input required type="number" step="0.01" name="saldo_base" value={formData.saldo_base} onChange={handleChange} className="w-full bg-black/40 border-b-2 border-primary/40 rounded-none px-4 py-3 text-4xl font-black text-white focus:outline-none focus:border-primary text-center" placeholder="1000" />
                        </div>
                        <p className="text-[10px] text-primary/40 mt-6 font-bold leading-relaxed italic">
                          O valor deve estar disponível para depósito imediato após a aprovação da sua conta.
                        </p>
                      </div>
                    </div>
                  )}

                  {step === 4 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                      <div className="bg-secondary/5 border border-secondary/20 p-5 rounded-2xl flex items-start gap-4">
                         <ShieldAlert className="w-6 h-6 text-secondary flex-shrink-0" />
                         <p className="text-[10px] text-white/60 leading-relaxed font-bold uppercase tracking-wider">
                            Defina um PIN de <b>6 dígitos numéricos</b>. Este será o seu código de acesso exclusivo ao Cofre. Não use datas de nascimento.
                         </p>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-5">
                        <div className="relative">
                          <input 
                            required 
                            type={showPin ? "text" : "password"} 
                            inputMode="numeric"
                            maxLength={6}
                            name="pin" 
                            value={formData.pin} 
                            onChange={handleChange} 
                            className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-5 text-center text-3xl tracking-[0.5em] font-black text-white focus:outline-none focus:border-primary/40" 
                            placeholder="******" 
                          />
                          <button type="button" onClick={() => setShowPin(!showPin)} className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors">
                            {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                        <div className="relative">
                          <input 
                            required 
                            type={showConfirmPin ? "text" : "password"} 
                            inputMode="numeric"
                            maxLength={6}
                            name="confirmPin" 
                            value={formData.confirmPin} 
                            onChange={handleChange} 
                            className={cn(
                              "w-full bg-white/5 border rounded-2xl px-6 py-5 text-center text-3xl tracking-[0.5em] font-black text-white focus:outline-none transition-all",
                              formData.confirmPin && formData.pin !== formData.confirmPin ? 'border-secondary/50 bg-secondary/5' : 'border-white/5 focus:border-primary/40'
                            )} 
                            placeholder="******" 
                          />
                          <button type="button" onClick={() => setShowConfirmPin(!showConfirmPin)} className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors">
                            {showConfirmPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                        {formData.confirmPin && formData.pin !== formData.confirmPin && (
                          <p className="text-secondary text-[9px] font-black text-center uppercase tracking-widest animate-pulse">
                            Os códigos não coincidem! Verifique e tente novamente.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Rodapé Dinâmico */}
                  <div className="flex justify-between items-center mt-10 pt-6 border-t border-white/5">
                    {step > 1 ? (
                      <button type="button" onClick={prevStep} className="px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2 group">
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Voltar
                      </button>
                    ) : <div />}

                    <button
                      type="button"
                      onClick={(e) => step < 4 ? nextStep() : handleSubmit(e)}
                      disabled={createMutation.isPending || (step === 4 && (!isStepValid()))}
                      className={cn(
                        "px-10 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 transition-all",
                        isStepValid() 
                          ? "bg-white text-black hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-95" 
                          : "bg-white/5 text-white/20 cursor-not-allowed"
                      )}
                    >
                      {createMutation.isPending ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Processando...</>
                      ) : (
                        <>
                          {step === 4 ? "Finalizar Registo" : "Próximo Passo"}
                          {step < 4 && <ChevronRight className="w-4 h-4" />}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
