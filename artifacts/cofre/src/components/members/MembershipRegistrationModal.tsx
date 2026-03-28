import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserIcon, MapPin, Contact, CreditCard, CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react";
import { useCreateMembershipRequest } from "@/hooks/use-requests";
import { formatMT } from "@/lib/utils";
import { sendEmailVerification } from "firebase/auth";

export function MembershipRegistrationModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const createMutation = useCreateMembershipRequest();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    nome: "",
    nacionalidade: "Moçambicano",
    profissao: "",
    telefone: "+258 ",
    email: "",
    endereco: "",
    nuit: "",
    saldo_base: ""
  });

  if (!isOpen) return null;

  const nextStep = () => setStep(s => Math.min(3, s + 1));
  const prevStep = () => setStep(s => Math.max(1, s - 1));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) return nextStep();

    const val = parseFloat(formData.saldo_base.replace(',', '.'));
    if (isNaN(val) || val <= 0) return;

    // Foto is just the initials
    const foto = formData.nome.substring(0, 2).toUpperCase();

    await createMutation.mutateAsync({
      data: {
        nome: formData.nome,
        foto,
        saldo_base: Math.round(val * 100),
        nacionalidade: formData.nacionalidade,
        profissao: formData.profissao,
        telefone: formData.telefone,
        email: formData.email,
        endereco: formData.endereco,
        nuit: formData.nuit
      }
    });

    onClose();
    setTimeout(() => {
      setStep(1);
      setFormData({ nome: "", nacionalidade: "Moçambicana", profissao: "", telefone: "+258 ", email: "", endereco: "", nuit: "", saldo_base: "" });
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto pt-20 pb-10">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
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
            <div className={`absolute left-0 top-1/2 h-0.5 bg-primary -z-10 -translate-y-1/2 rounded-full transition-all duration-500`} style={{ width: `${(step - 1) * 50}%` }}></div>

            {[1, 2, 3].map(i => (
              <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 shadow-lg ${step >= i ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground border-2 border-white/10'}`}>
                {step > i ? <CheckCircle2 className="w-5 h-5" /> : i}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs font-medium text-muted-foreground px-1">
            <span className={step >= 1 ? "text-primary" : ""}>Pessoal</span>
            <span className={step >= 2 ? "text-primary" : ""}>Contactos</span>
            <span className={step >= 3 ? "text-primary" : ""}>Aporte</span>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 relative">
          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1"><UserIcon className="w-4 h-4" /> Nome Completo</label>
                  <input required name="nome" value={formData.nome} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" placeholder="Ex: João da Silva" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">Nacionalidade</label>
                    <input required name="nacionalidade" value={formData.nacionalidade} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">Profissão</label>
                    <input required name="profissao" value={formData.profissao} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" placeholder="Engenheiro" />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1"><Contact className="w-4 h-4" /> Telefone Principal</label>
                    <input required name="telefone" value={formData.telefone} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary font-mono" placeholder="+258 84 123 4567" />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">E-mail</label>
                    <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" placeholder="joao@email.com" />
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1"><MapPin className="w-4 h-4" /> Endereço (Moçambique)</label>
                  <input required name="endereco" value={formData.endereco} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" placeholder="Bairro 5, Chimoio" />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 animate-in fade-in duration-300">
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
                className={`px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg ${step === 3 ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                {step < 3 ? (
                  <>Próximo <ChevronRight className="w-4 h-4" /></>
                ) : createMutation.isPending ? (
                  "A Enviar..."
                ) : (
                  "Submeter Perfil"
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
