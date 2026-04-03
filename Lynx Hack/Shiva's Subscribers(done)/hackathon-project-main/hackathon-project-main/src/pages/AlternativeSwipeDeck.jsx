import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function AltSwipeCard({ alternative, active, zIndex, onSwipe }) {
  const controls = useAnimation();

  useEffect(() => {
    if (active) controls.start({ scale: 1, y: 0, opacity: 1 });
    else controls.start({ scale: 0.95, y: 20, opacity: 0.8 });
  }, [active, controls]);

  const handleDragEnd = (event, info) => {
    const offset = info.offset.x;
    if (offset > 150) controls.start({ x: 500, opacity: 0 }).then(() => onSwipe('adopt'));
    else if (offset < -150) controls.start({ x: -500, opacity: 0 }).then(() => onSwipe('reject'));
    else controls.start({ x: 0, opacity: 1 });
  };

  return (
    <motion.div
      drag={active ? 'x' : false} dragConstraints={{ left: 0, right: 0 }} dragElastic={0.8}
      onDragEnd={active ? handleDragEnd : undefined} animate={controls}
      initial={{ scale: active ? 1 : 0.95, y: active ? 0 : 20 }} whileDrag={{ scale: 1.05, cursor: "grabbing" }}
      style={{ zIndex, position: 'absolute' }}
      className={`w-full max-w-sm min-h-[440px] bg-[#161b22] border border-[#00f2fe]/30 rounded-3xl p-6 flex flex-col justify-between cursor-grab ${active ? 'shadow-[0_0_40px_rgba(0,242,254,0.15)]' : ''}`}
    >
      <div className="w-full flex justify-between items-start mb-6">
        <img src={alternative.logoUrl} alt="Logo" className="w-16 h-16 rounded-2xl bg-white/10 p-2 object-contain" />
        <div className="text-right">
          <h3 className="text-2xl font-bold tracking-tight text-[#00f2fe]">${Number(alternative.cost).toFixed(2)}</h3>
          <p className="text-gray-400 text-sm">per month</p>
        </div>
      </div>
      <div className="w-full text-center flex-1 flex flex-col justify-center items-center">
        <h2 className="text-3xl font-extrabold mb-2">{alternative.name}</h2>
        <div className="inline-flex flex-col items-center justify-center p-4 rounded-xl bg-white/5 border border-white/10 mb-4 shadow-inner">
           <LucideIcons.PiggyBank size={32} className="text-emerald-400 mb-2" />
           <p className="text-sm font-medium text-gray-300">You Save <span className="text-emerald-400 font-bold">${Number(alternative.savings).toFixed(2)}/mo</span>!</p>
        </div>
        <p className="font-medium text-md leading-relaxed text-gray-300 italic">"{alternative.reason}"</p>
      </div>
      <div className="w-full flex justify-between gap-4 mt-6">
         <div className="flex-1 flex justify-center text-red-400 font-bold text-sm tracking-widest uppercase opacity-70"><LucideIcons.ChevronsLeft /> Reject</div>
         <div className="flex-1 flex justify-center text-emerald-400 font-bold text-sm tracking-widest uppercase opacity-70">Adopt <LucideIcons.ChevronsRight /></div>
      </div>
    </motion.div>
  );
}

export default function AlternativeSwipeDeck() {
  const [alternatives, setAlternatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch alternatives globally using the highest-cost subscription
    fetch('http://localhost:3001/api/sweeps')
      .then(res => res.json())
      .then(data => {
         if (Array.isArray(data)) {
            setAlternatives(data);
         } else {
            console.error('Invalid response format', data);
            setAlternatives([]);
         }
         setLoading(false);
      })
      .catch(console.error);
  }, []);

  const handleSwipe = (id, direction) => {
    setAlternatives(prev => prev.filter(a => a.id !== id));
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><LucideIcons.Loader2 className="animate-spin text-[#00f2fe] w-12 h-12" /></div>;
  }

  if (alternatives.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
        <LucideIcons.CheckCircle size={64} className="text-emerald-400 mb-6" />
        <h2 className="text-3xl font-bold mb-4">No More Alternatives!</h2>
        <p className="text-gray-400 mb-8 max-w-md">You've reached the end of your AI recommendations.</p>
        <button onClick={() => navigate('/dashboard')} className="bg-[#00f2fe] text-black hover:opacity-90 py-3 px-8 rounded-full font-bold transition shadow-[0_0_20px_rgba(0,242,254,0.3)]">Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen overflow-hidden relative">
      <div className="w-full text-center absolute top-12 z-10 px-4">
        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00f2fe] to-[#4facfe] mb-2">AI Optimization Sweeps</h2>
        <p className="text-sm text-gray-400 font-medium tracking-wide">Swipe Right to Swap & Save. Swipe Left to Ignore.</p>
      </div>
      <div className="relative w-full max-w-sm h-[500px] flex items-center justify-center mt-12">
        {alternatives.map((alt, index) => (
          <AltSwipeCard key={alt.id} alternative={alt} active={index === 0} zIndex={alternatives.length - index} onSwipe={(dir) => handleSwipe(alt.id, dir)} />
        ))}
      </div>
    </div>
  );
}
