import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as LucideIcons from 'lucide-react';

export default function TerminalModal({ isOpen, onClose, subscriptionName }) {
  const [logs, setLogs] = useState([]);
  const [step, setStep] = useState(0);

  const mockSteps = [
    `Initializing SubSave AI Agent v2.4.1...`,
    `[FETCH] Resolving endpoint for ${subscriptionName}... OK`,
    `[NAVIGATE] Booting headless chromium instance ➔ ${subscriptionName} Account Settings...`,
    `[AUTH] Bypassing localized friction patterns... INJECTING SECURE TOKEN...`,
    `[ACTION] Locating 'Cancel Subscription' deeply nested DOM element... FOUND`,
    `[EXECUTE] Triggering recursive cancellation click sequence...`,
    `[VERIFY] Intercepting return payload... SUCCESS! Subscription neutralized.`,
    `Agent shutdown initiated... Savings mathematically secured.`
  ];

  useEffect(() => {
    if (!isOpen) { 
       setLogs([]); 
       setStep(0); 
       return; 
    }

    if (step < mockSteps.length) {
      const timer = setTimeout(() => {
        setLogs(prev => [...prev, mockSteps[step]]);
        setStep(step + 1);
      }, Math.random() * 800 + 400); // Random delay between 400-1200ms
      return () => clearTimeout(timer);
    }
  }, [isOpen, step, mockSteps, subscriptionName]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 50 }}
            className="w-full max-w-2xl overflow-hidden glass-panel border border-white/20 shadow-[-10px_-10px_30px_4px_rgba(255,0,0,0.1),_10px_10px_30px_4px_rgba(45,78,255,0.15)] rounded-lg bg-[#0d1117]"
          >
             {/* Terminal Header */}
             <div className="flex items-center px-4 py-2 border-b border-gray-800 bg-[#161b22]">
                 <div className="flex gap-2 mr-4">
                     <div className="w-3 h-3 rounded-full bg-red-500 cursor-pointer" onClick={onClose} />
                     <div className="w-3 h-3 rounded-full bg-yellow-500 cursor-pointer" />
                     <div className="w-3 h-3 rounded-full bg-green-500 cursor-pointer" />
                 </div>
                 <span className="text-gray-400 font-mono text-xs flex-1 text-center">subsave-agent@cancel_bot ~ zsh</span>
                 <LucideIcons.Terminal size={14} className="text-gray-500" />
             </div>

             {/* Terminal Body */}
             <div className="p-6 font-mono text-sm leading-relaxed h-[300px] overflow-y-auto flex flex-col justify-end">
                <div className="flex flex-col gap-2">
                  <div className="text-green-400">$ node cancel-routine.js --target="{subscriptionName}" --fast-mode</div>
                  {logs.map((log, index) => {
                     const isWarning = log.includes('friction') || log.includes('nested');
                     const isSuccess = log.includes('SUCCESS');
                     return (
                        <motion.div 
                          key={index} 
                          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                          className={`
                            ${isWarning ? 'text-yellow-400' : ''}
                            ${isSuccess ? 'text-[#00f2fe] font-bold blur-[0.2px]' : ''}
                            ${!isWarning && !isSuccess ? 'text-gray-300' : ''}
                          `}
                        >
                           <span className="text-gray-600 mr-2">[{new Date().toLocaleTimeString()}]</span>
                           {log}
                        </motion.div>
                     );
                  })}
                  
                  {step < mockSteps.length ? (
                     <div className="text-gray-400 flex items-center mt-2">
                        <span className="mr-2">user@terminal:~$</span>
                        <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-2 h-4 bg-gray-400 inline-block"></motion.span>
                     </div>
                  ) : (
                     <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-6 flex justify-between items-center text-[#00f2fe]">
                        <span>✓ Sequence Completed</span>
                        <button onClick={onClose} className="px-5 py-2 rounded border border-[#00f2fe]/40 hover:bg-[#00f2fe]/10 transition">Close Process</button>
                     </motion.div>
                  )}
                </div>
             </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
