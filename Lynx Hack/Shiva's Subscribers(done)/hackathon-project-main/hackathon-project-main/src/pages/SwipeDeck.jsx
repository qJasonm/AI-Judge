import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActiveSubscriptions, cancelSubscription, keepSubscription } from '../services/api';
import SwipeCard from '../components/SwipeCard';
import * as LucideIcons from 'lucide-react';

export default function SwipeDeck() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getActiveSubscriptions()
      .then(data => setSubscriptions(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSwipe = async (id, direction) => {
    // direction is 'left' for cancel, 'right' for keep
    if (direction === 'left') {
      await cancelSubscription(id);
    } else {
      await keepSubscription(id);
    }
    
    // Remove from local array
    setSubscriptions(prev => prev.filter(s => s.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin mb-4 text-[var(--color-brand)]">
          <LucideIcons.Loader2 size={48} />
        </div>
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
        <LucideIcons.CheckCircle size={64} className="text-[var(--color-success)] mb-6" />
        <h2 className="text-3xl font-bold mb-4">All Caught Up!</h2>
        <p className="text-gray-400 mb-8 max-w-md">
          We've reviewed all your known subscriptions. You can now view your savings dashboard.
        </p>
        <button 
          onClick={() => navigate('/dashboard')}
          className="bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] py-3 px-8 rounded-full font-semibold transition"
        >
          View Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen overflow-hidden relative">
      <div className="w-full text-center absolute top-12 z-10 px-4">
        <h2 className="text-xl font-semibold mb-2">Review Subscriptions</h2>
        <p className="text-sm text-gray-400">Swipe Left to Cancel. Swipe Right to Keep.</p>
      </div>
      
      <div className="relative w-full max-w-sm h-[500px] flex items-center justify-center mt-10">
        {/* Render cards so last in array is on top */}
        {subscriptions.map((sub, index) => {
          // Calculate Z-index so last element (bottom of array) is top visually visually
          return (
            <SwipeCard 
              key={sub.id} 
              subscription={sub} 
              active={index === 0} 
              zIndex={subscriptions.length - index} 
              onSwipe={(dir) => handleSwipe(sub.id, dir)}
            />
          );
        })}
      </div>
      
      <div className="absolute bottom-12 flex gap-8 z-10">
        <button 
          onClick={() => handleSwipe(subscriptions[0].id, 'left')}
          className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 hover:bg-red-500/20 active:scale-95 transition"
        >
          <LucideIcons.X size={32} />
        </button>
        <button 
          onClick={() => handleSwipe(subscriptions[0].id, 'right')}
          className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 hover:bg-emerald-500/20 active:scale-95 transition"
        >
          <LucideIcons.Check size={32} />
        </button>
      </div>
    </div>
  );
}
