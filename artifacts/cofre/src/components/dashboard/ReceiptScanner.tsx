import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, Check, Loader2, Sparkles, Scan, Smartphone, Zap, ZapOff } from "lucide-react";
import { cn, formatMT } from "@/lib/utils";

// 📝 REGEX PARA M-PESA / E-MOLA (Adaptado para Moçambique)
const PATTERNS = {
  TRANSACTION: /[A-Z0-9]{8,12}/i, // Códigos como 04C6K8L3
  AMOUNT: /(MT|MTn|MZN)\s?(\d+([.,]\d{2})?)/i, // Valor monetário
  DATE: /\d{2}[/.-]\d{2}[/.-]\d{4}/ // Data da transação
};

interface ScannerProps {
  onScanResult: (data: { valor: number; foto: string }) => void;
  onClose: () => void;
}

export function ReceiptScanner({ onScanResult, onClose }: ScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"starting" | "ready" | "captured">("starting");
  const [photo, setPhoto] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [isTorchOn, setIsTorchOn] = useState(false);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [facingMode]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStatus("ready");
      }
    } catch (err) {
      console.error("Erro câmera:", err);
      setStatus("ready");
    }
  };

  const toggleCamera = () => {
    setIsTorchOn(false);
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  const toggleTorch = async () => {
    try {
      const stream = videoRef.current?.srcObject as MediaStream;
      const track = stream?.getVideoTracks()[0];
      if (track) {
        const nextState = !isTorchOn;
        await track.applyConstraints({
          // @ts-ignore - torch is non-standard but supported in Chrome/Android
          advanced: [{ torch: nextState }]
        });
        setIsTorchOn(nextState);
      }
    } catch (err) {
      console.error("Flash não suportado:", err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsTorchOn(false);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(video, 0, 0);
      const data = canvas.toDataURL("image/webp");
      setPhoto(data);
      setStatus("captured");
      stopCamera();
    }
  };

  const handleGalleryPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
        setStatus("captured");
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center">
      <div className="relative w-full max-w-md aspect-[9/16] bg-slate-900 overflow-hidden shadow-2xl">
        
        {/* Cam Layer */}
        {status !== "captured" ? (
          <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <img src={photo || ""} className="absolute inset-0 w-full h-full object-cover" />
        )}

        {/* Overlay HUD */}
        <div className="absolute inset-0 flex flex-col justify-between p-6">
          <div className="flex justify-between items-start">
             <div>
               <h2 className="text-white font-black text-xl uppercase tracking-tighter italic">Comprovante Digital</h2>
               <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Escolha a Prova de Pagamento</p>
             </div>
             <button onClick={onClose} className="p-3 bg-white/10 rounded-full text-white backdrop-blur-md">
                <X className="w-5 h-5" />
             </button>
          </div>

          <div className="space-y-4">
             {status === "ready" && (
                <div className="grid grid-cols-1 gap-3">
                   <div className="flex gap-2">
                     <button 
                       onClick={takePhoto}
                       className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95"
                     >
                       <Camera className="w-5 h-5" /> Capturar
                     </button>
                     <button 
                       onClick={toggleCamera}
                       className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white border border-white/10 active:bg-white/20 transition-all font-bold"
                     >
                       <Sparkles className={cn("w-5 h-5 transition-transform duration-500", facingMode === "user" ? "rotate-180" : "rotate-0")} />
                     </button>
                   </div>
                   <button 
                     onClick={() => fileInputRef.current?.click()}
                     className="w-full bg-white/10 hover:bg-white/20 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] border border-white/10 flex items-center justify-center gap-3 transition-all"
                   >
                     <Smartphone className="w-5 h-5 text-blue-400" /> Galeria
                   </button>
                   <input 
                     type="file" 
                     ref={fileInputRef} 
                     className="hidden" 
                     accept="image/*" 
                     onChange={handleGalleryPick} 
                   />
                </div>
             )}

             {status === "captured" && (
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full bg-slate-800/90 backdrop-blur-xl p-6 rounded-3xl border border-white/10">
                   <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center"><Check className="w-6 h-6 text-white"/></div>
                      <span className="text-white font-black uppercase tracking-widest text-sm">Imagem Seleccionada!</span>
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                     <button 
                       onClick={() => { setPhoto(null); setStatus("ready"); startCamera(); }}
                       className="bg-white/5 text-white py-4 rounded-xl font-bold text-xs uppercase"
                     >
                       Trocar
                     </button>
                     <button 
                       onClick={() => onScanResult({ valor: 0, foto: photo || "" })}
                       className="bg-blue-600 text-white py-4 rounded-xl font-bold text-xs uppercase shadow-lg"
                     >
                       Confirmar
                     </button>
                   </div>
                </motion.div>
             )}
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
      
      <p className="mt-6 text-slate-500 text-[9px] font-bold uppercase tracking-[0.3em] text-center px-8">
        A foto será enviada ao administrador para conferência manual.
      </p>
    </div>
  );
}
