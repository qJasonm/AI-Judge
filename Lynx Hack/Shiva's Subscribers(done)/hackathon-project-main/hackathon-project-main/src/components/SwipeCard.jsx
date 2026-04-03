import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import * as LucideIcons from 'lucide-react';

export default function SwipeCard({ subscription, active, zIndex, onSwipe }) {
  const controls = useAnimation();
  const IconComponent = LucideIcons[subscription.icon] || LucideIcons.Circle;

  // React to active state changes
  useEffect(() => {
    if (active) {
      controls.start({ scale: 1, y: 0, opacity: 1 });
    } else {
      controls.start({ scale: 0.95, y: 20, opacity: 0.8 });
    }
  }, [active, controls]);

  const handleDragEnd = (event, info) => {
    const offset = info.offset.x;
    if (offset > 150) {
      // Swiped right (keep)
      controls.start({ x: 500, opacity: 0 }).then(() => onSwipe('right'));
    } else if (offset < -150) {
      // Swiped left (cancel)
      controls.start({ x: -500, opacity: 0 }).then(() => onSwipe('left'));
    } else {
      // Return to center
      controls.start({ x: 0, opacity: 1 });
    }
  };

  return (
    <motion.div
      drag={active ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragEnd={active ? handleDragEnd : undefined}
      animate={controls}
      initial={{ scale: active ? 1 : 0.95, y: active ? 0 : 20 }}
      whileDrag={{ scale: 1.05, cursor: "grabbing" }}
      style={{ zIndex, position: 'absolute' }}
      className={`w-full max-w-sm min-h-[480px] bg-[var(--color-bg-surface)] border border-[rgba(255,255,255,0.08)] rounded-3xl p-6 flex flex-col justify-between cursor-grab ${active ? 'shadow-2xl shadow-black/50' : ''}`}
    >
      <div className="w-full flex justify-between items-start mb-6">
        <div className="w-16 h-16 rounded-2xl bg-[var(--color-brand)]/20 flex items-center justify-center text-[var(--color-brand)] border border-[var(--color-brand)]/30">
          <IconComponent size={32} />
        </div>
        <div className="text-right">
          <h3 className="text-2xl font-bold tracking-tight">${subscription.cost.toFixed(2)}</h3>
          <p className="text-gray-400 text-sm capitalize">/{subscription.billingCycle}</p>
        </div>
      </div>

      <div className="w-full text-center mb-8 flex-1 flex flex-col justify-center items-center">
        <h2 className="text-4xl font-extrabold mb-4">{subscription.name}</h2>
        <div className="inline-flex items-center gap-2 justify-center py-2 px-4 rounded-full bg-white/5 border border-white/10 mb-4 shadow-inner shadow-white/5">
           <LucideIcons.Sparkles size={16} className="text-amber-400" />
           <p className="text-sm font-medium text-gray-300">AI Insight</p>
        </div>
        <p className="font-medium text-lg leading-relaxed text-gray-200">
           "{subscription.aiRecommendation || 'Loading insight...'}"
        </p>
      </div>

      <div className="w-full bg-black/40 rounded-xl p-4 flex justify-between items-center text-sm border border-white/5 shadow-inner">
         <span className="text-gray-400">Next payment:</span>
         <span className="font-semibold text-white">
           {new Date(subscription.nextBillingDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year:'numeric' })}
         </span>
      </div>
    </motion.div>
  );
}
