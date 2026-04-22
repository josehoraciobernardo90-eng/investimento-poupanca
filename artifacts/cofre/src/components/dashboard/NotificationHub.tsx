import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Music, Volume2, Check, Sparkles, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const SOUNDS = [
  { id: "elite", name: "Fintech Elite", url: "https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3" },
  { id: "digital", name: "Pulso Digital", url: "https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3" },
  { id: "success", name: "Ganhos em Alta", url: "https://assets.mixkit.co/active_storage/sfx/2016/2016-preview.mp3" },
];

export function NotificationHub() {
  const [selectedSound, setSelectedSound] = useState(localStorage.getItem("cofre_tone") || "elite");
  const [volume, setVolume] = useState(80);
  const { toast } = useToast();

  const playTone = (url?: string) => {
    const toneUrl = url || SOUNDS.find(s => s.id === selectedSound)?.url;
    if (toneUrl) {
      const audio = new Audio(toneUrl);
      audio.volume = volume / 100;
      audio.play().catch(() => console.log("Áudio bloqueado pelo navegador"));
    }
  };

  const handleSave = (id: string) => {
    setSelectedSound(id);
    localStorage.setItem("cofre_tone", id);
    playTone(SOUNDS.find(s => s.id === id)?.url);
    toast({
      title: "Tom Atualizado",
      description: "A sua experiência sonora foi redefinida com sucesso.",
    });
  };

  return (
    <div className="glass-panel p-8 border-t-4 border-t-blue-500 bg-gradient-to-br from-blue-500/5 to-transparent relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
        <Bell className="w-48 h-48 text-blue-400" />
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
          <Music className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-black text-white uppercase tracking-tighter">Sistema Sonoro de Ponta</h2>
          <p className="text-[10px] text-blue-400 font-bold uppercase tracking-[0.2em] italic">Experiência Sensorial FinTech</p>
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SOUNDS.map((sound) => (
            <button
              key={sound.id}
              onClick={() => handleSave(sound.id)}
              className={cn(
                "relative p-4 rounded-2xl border transition-all duration-300 text-left overflow-hidden flex items-center justify-between",
                selectedSound === sound.id 
                  ? "bg-blue-600 border-blue-400 shadow-[0_10px_30px_rgba(37,99,235,0.3)]" 
                  : "bg-white/5 border-white/10 hover:border-white/20"
              )}
            >
              <div>
                <p className={cn("text-[10px] font-black uppercase tracking-widest", selectedSound === sound.id ? "text-blue-200" : "text-slate-500")}>Perfil</p>
                <p className={cn("text-sm font-bold", selectedSound === sound.id ? "text-white" : "text-slate-300")}>{sound.name}</p>
              </div>
              {selectedSound === sound.id && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <Check className="w-5 h-5 text-white" />
                </motion.div>
              )}
            </button>
          ))}
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/50 border border-white/5 flex items-center gap-6">
          <div className="flex items-center gap-3">
             {volume === 0 ? <VolumeX className="w-5 h-5 text-rose-500"/> : <Volume2 className="w-5 h-5 text-blue-400"/>}
             <span className="text-[10px] font-black text-slate-500 uppercase">Volume</span>
          </div>
          <input 
            type="range" 
            min="0" max="100" 
            value={volume} 
            onChange={(e) => setVolume(Number(e.target.value))}
            className="flex-1 h-1 bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-400"
          />
          <span className="min-w-[3ch] text-xs font-mono font-bold text-blue-400">{volume}%</span>
        </div>

        <button 
          onClick={() => playTone()}
          className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-[11px] font-black text-white hover:bg-white/10 transition-all uppercase tracking-[0.3em] flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-blue-400" /> Testar Alerta Agora
        </button>
      </div>

      <p className="mt-6 text-[9px] text-slate-500 font-bold uppercase tracking-widest text-center opacity-50">
        O tom selecionado será utilizado para todos os depósitos e avisos críticos.
      </p>
    </div>
  );
}
