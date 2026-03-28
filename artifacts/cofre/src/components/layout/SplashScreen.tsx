import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Hide splash screen after 3.2 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 800); // Wait for exit animation to finish before unmounting
    }, 3200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0a0a] overflow-hidden"
        >
          {/* Subtle animated background glow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.5, scale: 1.2 }}
            transition={{ duration: 3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
            className="absolute w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none"
          />

          <div className="relative z-10 flex flex-col items-center">
            {/* 3D Vault / Coin Logo with Framer Motion */}
            <motion.div
              initial={{ rotateY: -90, scale: 0.5, opacity: 0 }}
              animate={{ rotateY: 0, scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 15, stiffness: 100, duration: 1.2 }}
              className="relative w-32 h-32 mb-8 drop-shadow-[0_0_30px_rgba(235,179,32,0.6)]"
            >
              <svg viewBox="0 0 100 100" className="w-full h-full text-primary" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFF1B8" />
                    <stop offset="50%" stopColor="#EBB320" />
                    <stop offset="100%" stopColor="#9E7606" />
                  </linearGradient>
                  <linearGradient id="dark-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#1a1a1a" />
                    <stop offset="100%" stopColor="#333333" />
                  </linearGradient>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                
                {/* Coin/Vault Base */}
                <circle cx="50" cy="50" r="45" fill="url(#gold-grad)" stroke="#FFF1B8" strokeWidth="2" filter="url(#glow)"/>
                <circle cx="50" cy="50" r="38" fill="url(#dark-grad)" />
                
                {/* Inner Lock / Shield */}
                <path d="M50 25 L75 35 L75 55 C75 75 50 85 50 85 C50 85 25 75 25 55 L25 35 L50 25 Z" fill="url(#gold-grad)" />
                <path d="M50 30 L68 38 L68 53 C68 68 50 77 50 77 C50 77 32 68 32 53 L32 38 L50 30 Z" fill="#1a1a1a" />
                
                {/* Keyhole */}
                <circle cx="50" cy="48" r="6" fill="url(#gold-grad)" />
                <path d="M46 50 L54 50 L52 65 L48 65 Z" fill="url(#gold-grad)" />
              </svg>
            </motion.div>

            {/* App Name */}
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="text-4xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FFF1B8] to-primary uppercase tracking-widest mb-3 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]"
            >
              Cofre Capital
            </motion.h1>

            {/* Slogan */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.8 }}
              className="flex items-center gap-3 overflow-hidden"
            >
              <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-primary"></div>
              <p className="text-muted-foreground tracking-[0.2em] text-sm uppercase font-semibold">
                O Futuro Financeiro em Segurança
              </p>
              <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-primary"></div>
            </motion.div>
          </div>
          
          {/* Loading Bar */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.5 }}
            className="absolute bottom-16 w-48 h-1 bg-white/10 rounded-full overflow-hidden"
          >
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="w-1/2 h-full bg-primary rounded-full"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
