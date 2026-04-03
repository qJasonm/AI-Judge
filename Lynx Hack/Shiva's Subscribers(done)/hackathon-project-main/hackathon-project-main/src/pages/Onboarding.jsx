import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Onboarding() {
  const [method, setMethod] = useState(null); // 'plaid' or 'manual'
  const [step, setStep] = useState(0); 
  const [bank, setBank] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handlePlaidLink = (bankName) => {
    setBank(bankName);
    setLoading(true);
    setTimeout(() => {
       setLoading(false);
       navigate('/scan');
    }, 2000);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
       setLoading(false);
       navigate('/scan');
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 relative overflow-hidden text-white">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#00f2fe]/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>

      <AnimatePresence mode="wait">
        {!method && (
          <motion.div key="intro" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30, scale: 0.95 }}
            className="w-full max-w-lg glass-panel p-10 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-3xl text-center"
          >
            <LucideIcons.ShieldCheck size={56} className="text-[#00f2fe] mx-auto mb-6" />
            <h1 className="text-3xl font-extrabold mb-4 tracking-tight">Connect Your Accounts</h1>
            <p className="text-gray-400 mb-8 leading-relaxed">
              SubSave uses read-only access to analyze your spending. We never sell your data or store your bank credentials.
            </p>

            <div className="flex flex-col gap-4">
               <button onClick={() => setMethod('plaid')} className="w-full py-4 rounded-xl font-bold bg-white text-black hover:bg-gray-100 transition shadow-lg flex justify-center items-center gap-2">
                 Connect via Plaid <LucideIcons.ArrowRight size={18} />
               </button>
               <button onClick={() => setMethod('manual')} className="w-full py-4 rounded-xl font-bold border border-white/20 hover:bg-white/5 transition flex justify-center items-center gap-2 text-gray-300">
                 Enter Manually Instead
               </button>
            </div>
          </motion.div>
        )}

        {method === 'plaid' && (
          <motion.div key="plaid" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}
            className="w-full max-w-md glass-panel p-8 rounded-3xl border border-[#00f2fe]/20 shadow-[0_0_50px_rgba(0,242,254,0.1)] text-center relative overflow-hidden"
          >
             <button onClick={() => setMethod(null)} disabled={loading} className="absolute top-4 left-4 text-gray-400 hover:text-white"><LucideIcons.X size={20} /></button>
             
             {!loading ? (
                <>
                  <h2 className="text-2xl font-bold mb-2">Select your Institution</h2>
                  <p className="text-sm text-gray-500 mb-6">Secured by Plaid</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                     {['Chase', 'Bank of America', 'Wells Fargo', 'Capital One'].map(b => (
                       <button key={b} onClick={() => handlePlaidLink(b)} className="py-6 px-4 rounded-xl border border-white/5 bg-white/5 hover:bg-[#00f2fe]/10 hover:border-[#00f2fe]/30 hover:text-[#00f2fe] font-semibold transition active:scale-95">
                         {b}
                       </button>
                     ))}
                  </div>
                </>
             ) : (
                <div className="py-12 flex flex-col items-center">
                   <div className="w-16 h-16 border-4 border-[#00f2fe]/20 border-t-[#00f2fe] rounded-full animate-spin mb-6"></div>
                   <h3 className="text-xl font-bold text-[#00f2fe]">Authenticating {bank}...</h3>
                   <p className="text-sm text-gray-400 mt-2">Establishing secure 256-bit connection</p>
                </div>
             )}
          </motion.div>
        )}

        {method === 'manual' && (
          <motion.div key="manual" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
            className="w-full max-w-lg glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl text-left"
          >
             <button onClick={() => setMethod(null)} disabled={loading} className="text-gray-400 hover:text-white mb-6 flex items-center gap-1 text-sm"><LucideIcons.ArrowLeft size={16} /> Back</button>
             
             <h2 className="text-2xl font-bold mb-2">Manual Verification</h2>
             <p className="text-sm text-gray-400 mb-6">Please enter your statement data below.</p>
             
             <form onSubmit={handleManualSubmit} className="flex flex-col gap-5">
                <div>
                   <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Bank Name</label>
                   <input required type="text" placeholder="e.g. Citibank" disabled={loading} className="w-full bg-[#161b22] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#4facfe]" />
                </div>
                <div>
                   <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Upload CSV Statement (Optional)</label>
                   <div className="w-full border-2 border-dashed border-white/10 rounded-xl p-6 text-center text-gray-500 hover:border-[#4facfe]/50 hover:text-[#4facfe] transition cursor-pointer">
                      <LucideIcons.Upload size={24} className="mx-auto mb-2" />
                      <span className="text-sm">Drag & drop or click to browse</span>
                   </div>
                </div>
                
                <button type="submit" disabled={loading} className="w-full mt-4 bg-gradient-to-r from-[#00f2fe] to-[#4facfe] hover:opacity-90 py-4 rounded-xl font-bold text-black flex justify-center items-center gap-2 transition disabled:opacity-50">
                   {loading ? <LucideIcons.Loader2 className="animate-spin" size={20} /> : 'Process Mock Statements'}
                </button>
             </form>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
