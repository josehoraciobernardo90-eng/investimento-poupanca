import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, Check, User, Phone, Lock, Loader2, Sparkles, ShieldCheck } from "lucide-react";
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
      // Constraints mais simples para maior compatibilidade
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 640 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Forçar play imediato
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
      
      let msg = "Não foi possível aceder à câmara.";
      if (err.name === 'NotAllowedError') msg = "Permissão negada. Ative a câmara nas definições do navegador.";
      else if (err.name === 'NotFoundError') msg = "Nenhuma câmara encontrada no dispositivo.";
      
      toast({ title: "Aviso da Câmara", description: msg, variant: "destructive" });
      setIsCapturing(false);
    }
  };

  const takePhoto = () => {
    console.log("[ProfileSetup] Capturando frame...");
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      // Resolução otimizada para foto de perfil (600x600)
      canvas.width = 600;
      canvas.height = 600;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Recorte central para manter aspecto meia corpo / rosto
        const vid = videoRef.current;
        const minDim = Math.min(vid.videoWidth, vid.videoHeight);
        const startX = (vid.videoWidth - minDim) / 2;
        const startY = (vid.videoHeight - minDim) / 2;
        
        ctx.drawImage(vid, startX, startY, minDim, minDim, 0, 0, 600, 600);
        
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        console.log("[ProfileSetup] Foto otimizada capturada. Tamanho:", Math.round(dataUrl.length / 1024), "KB");
        setPhoto(dataUrl);
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    console.log("[ProfileSetup] Parando câmera...");
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
      console.log("[ProfileSetup] Arquivo selecionado:", file.name, file.size, file.type);
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
            const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
            console.log("[ProfileSetup] Upload otimizado. Novo tamanho:", Math.round(dataUrl.length / 1024), "KB");
            setPhoto(dataUrl);
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[ProfileSetup] Iniciando submissão de perfil...");
    
    if (!photo) {
      console.warn("[ProfileSetup] Tentativa de submissão sem foto.");
      return;
    }
    
    // Validação extra pedida pelo usuário: telefone e PIN devem coincidir
    if (phoneConfirm !== memberUser?.telefone || pinConfirm !== memberUser?.pin) {
      console.warn("[ProfileSetup] Falha na validação de credenciais:", { 
        matchTelefone: phoneConfirm === memberUser?.telefone,
        matchPin: pinConfirm === memberUser?.pin 
      });
      toast({ 
        title: "Dados Inválidos", 
        description: "O Telefone ou o PIN de confirmação não coincidem com o registo original.", 
        variant: "destructive" 
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await setupProfile(photo);
      if (success) {
        console.log("[ProfileSetup] Perfil configurado com sucesso. Entrando no app...");
      } else {
        console.error("[ProfileSetup] setupProfile retornou falha.");
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error("[ProfileSetup] Erro catastrófico na submissão:", err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#050810] flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-[#0A0F1C]/80 backdrop-blur-2xl border border-white/5 rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(37,99,235,0.15)] flex flex-col"
      >
        {/* Header Decore */}
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
              Carregue uma foto de boa qualidade (meio corpo) para activar permanentemente a sua conta.
            </p>
          </div>

          <div className="relative group">
            <div className="w-56 h-56 mx-auto relative group">
              {/* Photo Area */}
              <div 
                onClick={() => !isCapturing && !photo && startCamera()}
                className={cn(
                  "w-full h-full rounded-[3rem] overflow-hidden border-2 transition-all duration-700 flex items-center justify-center relative bg-white/5 shadow-2xl cursor-pointer",
                  photo ? "border-emerald-500/50 shadow-emerald-500/20" : "border-white/10 hover:border-blue-500/40"
                )}
              >
                {/* O elemento de vídeo deve estar sempre montado para o videoRef.current funcionar sem race conditions com React rendering */}
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted
                  className={cn("w-full h-full object-cover absolute inset-0 z-10", isCapturing ? "block" : "hidden")}
                />

                {isCapturing ? (
                  <>
                    {cameraStatus === "requesting" && (
                       <div className="absolute inset-0 bg-black/60 z-20 flex flex-col items-center justify-center p-6 text-center gap-4">
                          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-white">A Autorizar Câmara...</p>
                       </div>
                    )}

                    {/* Face Guide Overlay */}
                    {cameraStatus === "active" && (
                      <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
                         <div className="w-36 h-48 border-2 border-dashed border-blue-500/40 rounded-full animate-pulse shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                           <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Alinhe seu rosto</div>
                         </div>
                      </div>
                    )}
                  </>
                ) : photo ? (
                  <img src={photo} className="w-full h-full object-cover animate-in fade-in zoom-in duration-500 z-10 relative" alt="Perfil" />
                ) : (
                  <div className="flex flex-col items-center gap-4 p-6 text-center">
                    {cameraStatus === "error" ? (
                       <div className="space-y-3">
                          <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto border border-rose-500/20">
                            <Camera className="w-8 h-8 text-rose-500" strokeWidth={1.5} />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">Falha na Câmara</span>
                          <button 
                            type="button" 
                            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                            className="text-[10px] text-blue-400 font-bold border-b border-blue-400 pb-0.5"
                          >
                            Usar Foto da Galeria
                          </button>
                       </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4 text-white/20 group-hover:text-blue-400 transition-all duration-500">
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-blue-500/20 group-hover:bg-blue-500/5 transition-all">
                          <Camera className="w-10 h-10" strokeWidth={1.5} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-center">Tocar para Abrir Câmara</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Visual Actions - Always visible if a photo exists or camera is off, improved for mobile */}
                {!isCapturing && (
                  <div className={cn(
                    "absolute inset-x-0 bottom-4 flex items-center justify-center gap-3 transition-all duration-500",
                    photo ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100" // No mobile, se não tem foto, a área de clique central já abre a camera
                  )}>
                     <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); startCamera(); }}
                      className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl"
                     >
                       <Camera className="w-5 h-5" />
                     </button>
                     <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                      className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl border border-white/20"
                     >
                       <Upload className="w-5 h-5" />
                     </button>
                  </div>
                )}
              </div>

              {/* Status Ring */}
              <div className="absolute -inset-6 border border-blue-500/10 rounded-[4rem] -z-10 animate-spin-slow opacity-50" />
              <div className="absolute -inset-3 border border-blue-500/5 rounded-[3.5rem] -z-10 animate-reverse-spin-slow opacity-30" />
              
              {isCapturing && (
                 <motion.button
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); takePhoto(); }}
                  className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-10 py-5 rounded-full font-black text-[11px] uppercase tracking-[0.2em] shadow-[0_15px_40px_rgba(16,185,129,0.4)] border-2 border-white/20 active:scale-95 transition-all z-30 group"
                >
                  Capturar Foto Agora <span className="ml-2 group-hover:translate-x-1 transition-transform inline-block">→</span>
                </motion.button>
              )}
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileUpload} 
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 pt-6">
            <div className="space-y-4">
              <div className="relative group/input">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-blue-500 transition-colors">
                  <Phone className="w-4 h-4" />
                </div>
                <input 
                  required
                  type="text"
                  placeholder="Confirme seu Telefone"
                  value={phoneConfirm}
                  onChange={e => setPhoneConfirm(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-xs font-bold text-white focus:outline-none focus:border-blue-500/40 focus:bg-white/10 transition-all placeholder:text-white/10"
                />
              </div>

              <div className="relative group/input">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-blue-500 transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input 
                  required
                  type="password"
                  maxLength={6}
                  placeholder="Seu PIN de 6 dígitos"
                  value={pinConfirm}
                  onChange={e => setPinConfirm(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-xs font-bold text-white focus:outline-none focus:border-blue-500/40 focus:bg-white/10 transition-all placeholder:text-white/10 tracking-[0.3em]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                type="submit"
                disabled={!photo || isSubmitting}
                className={cn(
                  "w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-3",
                  photo ? "bg-white text-black hover:scale-105 active:scale-95" : "bg-white/5 text-white/10 cursor-not-allowed"
                )}
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShieldCheck className="w-5 h-5" /> Confirmar e Entrar</>}
              </button>
              
              <button 
                type="button"
                onClick={logout}
                className="w-full py-3 text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-white/40 transition-colors"
              >
                Cancelar Acesso
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
