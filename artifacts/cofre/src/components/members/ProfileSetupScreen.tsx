import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, Check, User, Phone, Lock, Loader2, Sparkles, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useMember } from "@/hooks/use-member";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function ProfileSetupScreen() {
  const { memberUser, setupProfile, logout } = useMember();
  const { toast } = useToast();
  
  const [photo, setPhoto] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [phoneConfirm, setPhoneConfirm] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  if (!memberUser) {
    return (
      <div className="fixed inset-0 bg-[#050810] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [cameraStatus, setCameraStatus] = useState<"idle" | "requesting" | "active" | "error">("idle");
  const [cameraError, setCameraError] = useState<string>("");

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      console.log("[ProfileSetup] Unmounting... Garantindo câmara desligada.");
      if (videoRef.current && videoRef.current.srcObject) {
         const stream = videoRef.current.srcObject as MediaStream;
         stream.getTracks().forEach(t => t.stop());
         videoRef.current.srcObject = null;
      }
    };
  }, []);

  const startCamera = async () => {
    console.log("[ProfileSetup] Abrindo câmera...");
    setCameraStatus("requesting");
    setCameraError("");

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraStatus("error");
      setCameraError("Navegador sem suporte para câmera.");
      toast({ 
        title: "Câmera Indisponível", 
        description: "Use um navegador moderno (Chrome/Safari) e verifique se o site usa HTTPS.", 
        variant: "destructive" 
      });
      return;
    }

    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 640 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.error("Erro no play:", e));
          setCameraStatus("active");
        };
        console.log("[ProfileSetup] Stream da câmera iniciado.");
      }
    } catch (err: any) {
      console.error("[ProfileSetup] Erro ao iniciar câmera:", err);
      setCameraStatus("error");
      setCameraError(err.message || "Erro desconhecido.");
      setIsCapturing(false);
    }
  };

  const takePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 600;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const vid = videoRef.current;
        const minDim = Math.min(vid.videoWidth, vid.videoHeight);
        const startX = (vid.videoWidth - minDim) / 2;
        const startY = (vid.videoHeight - minDim) / 2;
        ctx.drawImage(vid, startX, startY, minDim, minDim, 0, 0, 600, 600);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        setPhoto(dataUrl);
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = 600;
          canvas.height = 600;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            const minDim = Math.min(img.width, img.height);
            const startX = (img.width - minDim) / 2;
            const startY = (img.height - minDim) / 2;
            ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, 600, 600);
            setPhoto(canvas.toDataURL("image/jpeg", 0.7));
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photo) return;
    
    if (phoneConfirm !== memberUser?.telefone || pinConfirm !== memberUser?.pin) {
      toast({ 
        title: "Dados Inválidos", 
        description: "Telefone ou PIN não coincidem.", 
        variant: "destructive" 
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await setupProfile(photo);
      if (success) {
        setIsSuccess(true);
        console.log("[ProfileSetup] Sucesso em setupProfile.");
      } else {
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#050810] flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
      
      <AnimatePresence mode="wait">
        {isSuccess ? (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-[#0A0F1C] border border-emerald-500/30 rounded-[3rem] p-12 text-center space-y-6 shadow-[0_0_50px_rgba(16,185,129,0.1)]"
          >
            <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.4)]">
              <Check className="w-12 h-12 text-white" strokeWidth={3} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Identidade Ativada</h2>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Bem-vindo à Elite, {memberUser.nome.split(' ')[0]}.</p>
            </div>
            <div className="pt-4">
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mx-auto opacity-50" />
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg bg-[#0A0F1C]/80 backdrop-blur-2xl border border-white/5 rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(37,99,235,0.15)] flex flex-col"
          >
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600" />
            
            <div className="p-8 sm:p-12 space-y-8">
              <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-2">
                  <Sparkles className="w-3 h-3" /> Configuração Biométrica
                </div>
                <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">
                  Identidade do <span className="text-blue-500">Membro</span>
                </h1>
                <p className="text-xs text-white/40 font-medium uppercase tracking-wider max-w-[280px] mx-auto leading-relaxed">
                  Carregue uma foto de boa qualidade para activar permanentemente a sua conta.
                </p>
              </div>

              <div className="relative group">
                <div className="w-56 h-56 mx-auto relative group">
                  <div 
                    onClick={() => !isCapturing && !photo && startCamera()}
                    className={cn(
                      "w-full h-full rounded-[3rem] overflow-hidden border-2 transition-all duration-700 flex items-center justify-center relative bg-white/5 shadow-2xl cursor-pointer",
                      photo ? "border-emerald-500/50 shadow-emerald-500/20" : "border-white/10 hover:border-blue-500/40"
                    )}
                  >
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted
                      className={cn("w-full h-full object-cover absolute inset-0 z-10", isCapturing ? "block" : "hidden")}
                    />

                    {isCapturing ? (
                      cameraStatus === "active" && (
                        <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
                           <div className="w-36 h-48 border-2 border-dashed border-blue-500/40 rounded-full animate-pulse" />
                        </div>
                      )
                    ) : photo ? (
                      <img src={photo} className="w-full h-full object-cover z-10 relative" alt="Perfil" />
                    ) : (
                      <div className="flex flex-col items-center gap-4 text-white/20">
                        <Camera className="w-10 h-10" strokeWidth={1.5} />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-center">Abrir Câmara</span>
                      </div>
                    )}
                    
                    {!isCapturing && (
                      <div className={cn(
                        "absolute inset-x-0 bottom-4 flex items-center justify-center gap-3 transition-opacity",
                        photo ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      )}>
                         {photo && (
                           <button 
                             type="button" 
                             onClick={(e) => { e.stopPropagation(); setPhoto(null); }} 
                             className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all"
                           >
                              <div className="relative">
                                <Camera className="w-5 h-5 opacity-20" />
                                <div className="absolute inset-0 flex items-center justify-center font-bold text-lg">×</div>
                              </div>
                           </button>
                         )}
                         <button type="button" onClick={(e) => { e.stopPropagation(); startCamera(); }} className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg active:scale-95 transition-all">
                           <Camera className="w-5 h-5" />
                         </button>
                         <button type="button" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all">
                           <Upload className="w-5 h-5" />
                         </button>
                      </div>
                    )}
                  </div>
                  
                  {isCapturing && (
                     <div className="absolute -bottom-10 left-0 right-0 flex justify-center gap-3 z-30">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); stopCamera(); }}
                          className="bg-rose-500/20 backdrop-blur-md text-rose-500 px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest border border-rose-500/30 active:scale-95 transition-all"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); takePhoto(); }}
                          className="bg-emerald-500 text-white px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                        >
                          Capturar
                        </button>
                     </div>
                  )}
                </div>
                
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 pt-6">
                <div className="space-y-4">
                  <div className="relative">
                    <input 
                      required 
                      placeholder="Confirme seu Telefone" 
                      value={phoneConfirm} 
                      maxLength={9}
                      onChange={e => setPhoneConfirm(e.target.value.replace(/\D/g, "").slice(0, 9))} 
                      className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-xs font-bold text-white focus:outline-none focus:border-blue-500/40" 
                    />
                    {phoneConfirm.length === 9 && (
                       <div className="absolute right-4 top-1/2 -translate-y-1/2 scale-75">
                          <CheckCircle2 className={cn("w-6 h-6", phoneConfirm === memberUser.telefone ? "text-emerald-500" : "text-rose-500")} />
                       </div>
                    )}
                  </div>
                  <input 
                    required 
                    type="password" 
                    maxLength={6} 
                    placeholder="PIN de 6 dígitos" 
                    value={pinConfirm} 
                    onChange={e => setPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-xs font-bold text-white focus:outline-none focus:border-blue-500/40 tracking-[0.3em]" 
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <button type="submit" disabled={!photo || isSubmitting} className={cn("w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-3", photo ? "bg-white text-black" : "bg-white/5 text-white/10")}>
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirmar e Entrar"}
                  </button>
                  <button type="button" onClick={logout} className="w-full py-2 text-[9px] font-black uppercase text-white/20">Cancelar Acesso</button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
