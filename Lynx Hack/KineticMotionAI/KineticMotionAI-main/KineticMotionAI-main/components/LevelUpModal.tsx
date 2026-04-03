import React, { useEffect, useState } from 'react';
import { Trophy, Star, Crown, Zap, X, Share2, ArrowRight } from 'lucide-react';
import { UserStats } from '../types';

interface LevelUpModalProps {
  oldLevel: number;
  newLevel: number;
  title: string;
  xpGained: number;
  onClose: () => void;
}

const LevelUpModal: React.FC<LevelUpModalProps> = ({ oldLevel, newLevel, title, xpGained, onClose }) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Delay content animation slightly after mount
    const t = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
      if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/90 dark:bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
        {/* Confetti / Particle Effects Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
                <div 
                    key={i}
                    className="absolute w-2 h-2 bg-primary rounded-full animate-pulse"
                    style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 2}s`,
                        opacity: Math.random() * 0.5
                    }}
                />
            ))}
        </div>

        <div className={`relative w-full max-w-md transform transition-all duration-700 ${showContent ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
            
            {/* Glowing Card */}
            <div className="bg-white dark:bg-[#0a0a0b] border-2 border-primary/50 rounded-[40px] p-8 shadow-[0_0_100px_rgba(6,182,212,0.3)] relative overflow-hidden">
                
                {/* Background Rays */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-t from-primary/20 to-transparent rounded-full blur-[80px] animate-pulse"></div>

                <button onClick={handleClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-white transition-colors z-20">
                    <X size={24} />
                </button>

                <div className="relative z-10 flex flex-col items-center text-center">
                    
                    {/* Level Badge */}
                    <div className="mb-6 relative">
                        <div className="absolute inset-0 bg-primary blur-xl opacity-50 rounded-full animate-pulse"></div>
                        <div className="relative w-32 h-32 bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-black border-4 border-primary rounded-full flex items-center justify-center shadow-2xl">
                             <Crown size={48} className="text-primary mb-1" />
                             <div className="absolute -bottom-4 bg-primary text-white dark:text-black font-black px-4 py-1 rounded-full text-lg shadow-lg border-2 border-white">
                                 LVL {newLevel}
                             </div>
                        </div>
                    </div>

                    <h2 className="text-4xl font-black text-gray-900 dark:text-white italic tracking-tighter mb-2 animate-bounce-slow">
                        LEVEL UP!
                    </h2>
                    
                    <div className="flex items-center gap-2 mb-8">
                        <span className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-xs">New Title Unlocked</span>
                        <div className="h-px w-8 bg-gray-300 dark:bg-gray-700"></div>
                        <span className="text-primary font-black text-xl uppercase tracking-widest drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">
                            {title}
                        </span>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 w-full mb-8">
                        <div className="bg-gray-50 dark:bg-surface border border-gray-200 dark:border-gray-800 p-4 rounded-2xl flex flex-col items-center">
                            <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">XP Gained</span>
                            <span className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-1">
                                +{xpGained} <Zap size={16} className="text-accent fill-accent" />
                            </span>
                        </div>
                        <div className="bg-gray-50 dark:bg-surface border border-gray-200 dark:border-gray-800 p-4 rounded-2xl flex flex-col items-center">
                            <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Total Rank</span>
                            <span className="text-2xl font-black text-gray-900 dark:text-white">#{Math.max(1000 - newLevel * 10, 1)}</span>
                        </div>
                    </div>

                    <button 
                        onClick={handleClose}
                        className="w-full bg-primary text-white dark:bg-white dark:text-black font-black py-4 rounded-xl text-lg uppercase tracking-widest hover:bg-orange-600 dark:hover:bg-primary hover:scale-105 transition-all shadow-xl flex items-center justify-center gap-2 group"
                    >
                        Claim Rewards <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
                    </button>

                </div>
            </div>
        </div>
    </div>
  );
};

export default LevelUpModal;