import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as LucideIcons from 'lucide-react';

export default function CancelModal({ isOpen, onClose, subscriptionName }) {
  const [stage, setStage] = useState(0); // 0: initial, 1: loading, 2: success

  useEffect(() => {
    if (isOpen) {
      setStage(1);
      // Wait 5 seconds, switch to success
      const timer1 = setTimeout(() => {
        setStage(2);
      }, 5000);

      // Auto close after showing success
      const timer2 = setTimeout(() => {
        onClose();
        setStage(0);
      }, 6500);

      return () => { clearTimeout(timer1); clearTimeout(timer2); };
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
           <motion.div 
             initial={{ scale: 0.9, opacity: 0 }} 
             animate={{ scale: 1, opacity: 1 }} 
             exit={{ scale: 0.9, opacity: 0 }}
             className="w-full max-w-sm glass-panel p-8 rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col items-center text-center relative overflow-hidden text-white"
           >
              {stage === 1 && (
                 <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="flex flex-col items-center">
                    <div className="relative w-20 h-20 flex items-center justify-center mb-6">
                       <div className="absolute inset-0 rounded-full border border-gray-700"></div>
                       <motion.div 
                         className="absolute inset-0 rounded-full border-t border-[#00f2fe]"
                         animate={{ rotate: 360 }}
                         transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                       />
                       <LucideIcons.Cpu size={28} className="text-[#00f2fe] animate-pulse" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Automated Agent Active</h2>
                    <p className="text-gray-400 text-sm mb-4">Unlinking {subscriptionName} billing profile. Do not close...</p>
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                       <motion.div 
                         className="h-full bg-gradient-to-r from-[#00f2fe] to-[#4facfe]"
                         initial={{ width: "0%" }}
                         animate={{ width: "100%" }}
                         transition={{ duration: 5, ease: 'circOut' }}
                       />
                    </div>
                 </motion.div>
              )}

              {stage === 2 && (
                 <motion.div key="success" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
                    <motion.div 
                      initial={{ scale: 0, rotate: -45 }} 
                      animate={{ scale: 1, rotate: 0 }} 
                      transition={{ type: 'spring', damping: 10 }}
                      className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)] border border-emerald-500/50"
                    >
                       <LucideIcons.Check size={40} strokeWidth={3} />
                    </motion.div>
                    <h2 className="text-xl font-bold mb-2 text-white">Cancellation Verified.</h2>
                    <p className="text-emerald-400 font-medium">Subscription removed successfully.</p>
                 </motion.div>
              )}
           </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
