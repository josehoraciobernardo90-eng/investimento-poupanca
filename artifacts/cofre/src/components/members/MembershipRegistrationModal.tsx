import React, { useState } from "react";

import { X, UserIcon, MapPin, Contact, CreditCard, CheckCircle2, ChevronRight, ChevronLeft, ShieldAlert, Eye, EyeOff, Loader2 } from "lucide-react";
import { createPortal } from "react-dom";
import { useCreateMembershipRequest } from "@/hooks/use-requests";
import { formatMT, cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function MembershipRegistrationModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const createMutation = useCreateMembershipRequest();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      setIsSubmitting(true);
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

      window.alert("Pedido Enviado! A sua solicitação foi registada com sucesso.");
      onClose();
      
      setTimeout(() => {
        setStep(1);
        setIsSubmitting(false);
        setFormData({ 
          nome: "", profissao: "", telefone: "", bairro: "", cidade: "Chimoio", 
          nuit: "", saldo_base: "1000", pin: "", confirmPin: "" 
        });
      }, 500);

    } catch (err) {
       setIsSubmitting(false);
       window.alert("Dica: Verifique a sua internet e tente novamente.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
         onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="glass-panel w-full max-w-xl rounded-[2.5rem] p-0 relative overflow-hidden flex flex-col shadow-2xl border-primary/20">
            <div className="p-8 pb-6 flex justify-between items-center bg-white/5 border-b border-white/5">
              <div>
                <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Criar Minha Conta</h2>
                <p className="text-[10px] text-primary font-black uppercase tracking-[0.3em] mt-1">Portal Seguro</p>
              </div>
              <button onClick={onClose} className="text-white/40 hover:text-white bg-white/5 rounded-full px-3 py-1 transition-colors">
                FECHAR
              </button>
            </div>

            <div className="px-8 pt-8 pb-4">
              <div className="flex items-center justify-between relative px-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs transition-all border",
                    step >= i ? "bg-primary border-primary text-black" : "bg-[#050505] border-white/10 text-white/40"
                  )}>
                    {step > i ? "OK" : i}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 relative">
                <div className="space-y-6">
                  {step === 1 && (
                    <div className="space-y-5">
                      <div>
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block px-1">Seu Nome Completo</label>
                        <input required name="nome" value={formData.nome} onChange={handleChange} className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none" placeholder="Ex: Jose Bernardo" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block px-1">Cidade</label>
                          <input required name="cidade" value={formData.cidade} onChange={handleChange} className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold text-white" />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block px-1">Profissão</label>
                          <input required name="profissao" value={formData.profissao} onChange={handleChange} className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold text-white" />
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-5">
                      <div>
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block px-1">Contacto Principal</label>
                        <input required name="telefone" maxLength={9} value={formData.telefone} onChange={handleChange} className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-xl font-black text-white text-center tracking-widest" placeholder="843334444" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block px-1">Bairro</label>
                        <input required name="bairro" value={formData.bairro} onChange={handleChange} className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold text-white" />
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-5">
                      <div>
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 block px-1">Seu NUIT</label>
                        <input required name="nuit" maxLength={9} value={formData.nuit} onChange={handleChange} className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold text-white text-center" />
                      </div>
                      <div className="bg-primary/5 border border-primary/20 rounded-[2rem] p-8 text-center">
                        <label className="block text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4">Aporte Inicial (MT)</label>
                        <input required type="number" step="0.01" name="saldo_base" value={formData.saldo_base} onChange={handleChange} className="w-full bg-black/40 border-b-2 border-primary/40 px-4 py-2 text-3xl font-black text-white text-center" />
                      </div>
                    </div>
                  )}

                  {step === 4 && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 gap-5 text-left">
                        <div className="relative">
                          <label className="text-[10px] font-black text-white/40 uppercase block mb-2">Crie o seu PIN de 6 Números</label>
                          <input 
                            required 
                            type={showPin ? "text" : "password"} 
                            maxLength={6}
                            name="pin" 
                            value={formData.pin} 
                            onChange={handleChange} 
                            className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-center text-2xl font-black text-white" 
                          />
                        </div>
                        <div className="relative">
                          <label className="text-[10px] font-black text-white/40 uppercase block mb-2">Confirme o PIN</label>
                          <input 
                            required 
                            type={showConfirmPin ? "text" : "password"} 
                            maxLength={6}
                            name="confirmPin" 
                            value={formData.confirmPin} 
                            onChange={handleChange} 
                            className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-center text-2xl font-black text-white" 
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-10">
                    {step > 1 ? (
                      <button type="button" onClick={prevStep} className="px-6 py-3 font-black text-[10px] uppercase text-white/40">
                        VOLTAR
                      </button>
                    ) : <div />}

                    <button
                      type="button"
                      onClick={(e) => step < 4 ? nextStep() : handleSubmit(e)}
                      disabled={isSubmitting || (step === 4 && (!isStepValid()))}
                      className={cn(
                        "px-10 py-4 rounded-xl font-black text-[10px] uppercase transition-all",
                        isStepValid() ? "bg-white text-black" : "bg-white/5 text-white/20"
                      )}
                    >
                      {isSubmitting ? "PROCESSANDO..." : (step === 4 ? "FINALIZAR REGISTO" : "PRÓXIMO")}
                    </button>
                  </div>
                </div>
            </div>
          </div>
    </div>
  );
}
