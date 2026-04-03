import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import CancelModal from '../components/CancelModal';
import { useNavigate } from 'react-router-dom';

export default function ScanDashboard() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanState, setScanState] = useState(0); // 0: Idle, 1: Scanning, 2: Done
  const [data, setData] = useState(null);
  
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [activeSubName, setActiveSubName] = useState('');
  const navigate = useNavigate();

  const handleCancelClick = (name) => {
    setActiveSubName(name);
    setIsTerminalOpen(true);
  };

  const handleCancelComplete = () => {
    setIsTerminalOpen(false);
    if (!data) return;
    setData(prev => ({
        ...prev,
        subscriptions: prev.subscriptions.filter(s => s.name !== activeSubName)
    }));
  };

  const startScan = () => {
    setIsScanning(true);
    setScanState(1);

    // Call our backend scan endpoint to initialize Data Engine
    fetch('http://localhost:3001/api/scan')
      .then(res => res.json())
      .then(resData => {
         setTimeout(() => {
           setData(resData);
           setScanState(2);
         }, 3500); // Enforce 3.5s artificial delay for the Hackathon animation
      })
      .catch(console.error);
  };

  const texts = ["Analyzing transactions...", "Identifying recurring billing...", "Extracting hidden fees...", "Finalizing analysis..."];

  const [textIndex, setTextIndex] = useState(0);
  useEffect(() => {
    let interval;
    if (scanState === 1) {
      interval = setInterval(() => {
        setTextIndex(i => (i + 1) % texts.length);
      }, 800);
    }
    return () => clearInterval(interval);
  }, [scanState]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 relative overflow-hidden">
      
      {/* Background Neon Gradients */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-[#00f2fe]/20 rounded-full blur-[100px] pointer-events-none -z-10 animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#4facfe]/20 rounded-full blur-[100px] pointer-events-none -z-10"></div>

      <AnimatePresence mode="wait">
        {scanState === 0 && (
          <motion.div 
            key="idle"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="flex flex-col items-center justify-center text-center glass-panel p-12 rounded-3xl border border-[#4facfe]/20 shadow-2xl shadow-[#00f2fe]/5"
          >
            <LucideIcons.Search size={64} className="text-[#00f2fe] mb-8" />
            <h1 className="text-4xl font-extrabold mb-4 tracking-tight">Stop Subscription Creep.</h1>
            <p className="text-gray-400 mb-8 max-w-sm">
              We securely sweep your exported raw transaction data. We never ask for your bank login.
            </p>
            <button 
              onClick={startScan}
              className="bg-gradient-to-r from-[#00f2fe] to-[#4facfe] hover:opacity-90 active:scale-95 text-black font-extrabold py-4 px-10 rounded-xl transition-all shadow-[0_0_30px_rgba(0,242,254,0.3)]"
            >
              Scan My Accounts
            </button>
          </motion.div>
        )}

        {scanState === 1 && (
          <motion.div 
            key="scanning"
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}
            className="flex flex-col items-center justify-center w-full max-w-md"
          >
            <LucideIcons.Cpu size={64} className="text-[#4facfe] mb-8 animate-pulse" />
            
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-6 relative">
              <motion.div 
                className="h-full bg-gradient-to-r from-[#00f2fe] to-[#4facfe]"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 3.5, ease: "easeInOut" }}
              />
            </div>
            
            <motion.p 
              key={textIndex} 
              initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
              className="text-[#00f2fe] font-mono text-sm tracking-widest uppercase"
            >
              {texts[textIndex]}
            </motion.p>
          </motion.div>
        )}

        {scanState === 2 && data && (
          <motion.div 
            key="results"
            className="flex flex-col items-center w-full max-w-5xl"
            initial="hidden" animate="visible"
            variants={{
               hidden: { opacity: 0 },
               visible: { opacity: 1, transition: { staggerChildren: 0.2 }}
            }}
          >
            <motion.div variants={{ hidden: { y: 30, opacity: 0 }, visible: { y: 0, opacity: 1 } }} 
              className="glass-panel p-10 rounded-3xl w-full flex flex-col items-center justify-center text-center shadow-[0_0_50px_rgba(79,172,254,0.1)] mb-10 border border-[#00f2fe]/20"
            >
               <h2 className="text-xl font-medium text-gray-400 mb-2 uppercase tracking-widest">Total Monthly Waste Identified</h2>
               <div className="text-[5rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00f2fe] to-[#4facfe] leading-none mb-4 tracking-tighter">
                  ${data.metrics.waste.toFixed(2)}
               </div>
               <p className="text-gray-500 font-medium">Across {data.subscriptions.length} recurring subscriptions (from {data.metrics.count} transactions).</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
              {data.subscriptions.map((sub, i) => (
                 <motion.div 
                   key={sub.id}
                   variants={{ hidden: { y: 50, opacity: 0, scale: 0.9 }, visible: { y: 0, opacity: 1, scale: 1 } }}
                   className="glass-panel p-6 rounded-2xl flex flex-col justify-between hover:-translate-y-1 transition duration-300 group"
                 >
                    <div className="flex justify-between items-start mb-6">
                       <img src={sub.logoUrl} alt={sub.name} className="w-12 h-12 rounded-xl bg-white/10 p-1" onError={(e) => { e.target.style.display='none' }} />
                       <div className="text-right">
                         <h3 className="text-xl font-bold">${sub.cost.toFixed(2)}</h3>
                         <span className="text-xs text-gray-400 capitalize">/{sub.billingCycle}</span>
                       </div>
                    </div>
                    <h4 className="text-2xl font-bold mb-1">{sub.name}</h4>
                    <span className="text-xs font-semibold text-[#4facfe] bg-[#4facfe]/10 px-3 py-1 rounded-full self-start mb-6">
                       {sub.category}
                    </span>

                    <div className="flex gap-2">
                      <button 
                         onClick={() => handleCancelClick(sub.name)}
                         className="flex-1 bg-red-500/10 hover:bg-red-500 border border-red-500/20 hover:border-red-500 text-red-500 hover:text-white py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1 group-hover:shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                      >
                         <LucideIcons.Terminal size={14} /> 1-Click Cancel
                      </button>
                      <button
                         onClick={() => navigate('/alternatives')}
                         className="flex-1 bg-[#4facfe]/10 hover:bg-[#4facfe] border border-[#4facfe]/20 hover:border-[#4facfe] text-[#4facfe] hover:text-white py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1"
                      >
                         <LucideIcons.Sparkles size={14} /> Save Money
                      </button>
                    </div>
                 </motion.div>
              ))}
            </div>

            <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} className="mt-12 w-full flex justify-center gap-6">
               <button onClick={() => navigate('/chat')} className="px-8 py-3 rounded-full border border-white/10 hover:bg-white/5 transition font-medium flex items-center gap-2">
                 <LucideIcons.MessageSquare size={18} /> Chat with AI Expert
               </button>
               <button onClick={() => navigate('/dashboard')} className="px-8 py-3 rounded-full bg-gradient-to-r from-[#00f2fe] to-[#4facfe] text-black transition font-bold shadow-[0_0_20px_rgba(79,172,254,0.3)] flex items-center gap-2">
                 Proceed to Sweeps <LucideIcons.ArrowRight size={18}/>
               </button>
            </motion.div>
            
            {isTerminalOpen && (
              <CancelModal 
                 isOpen={isTerminalOpen} 
                 onClose={handleCancelComplete} 
                 subscriptionName={activeSubName} 
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
