
import React from 'react';
import { Tier } from '../types';
import { Check, Star, Zap, Shield, Crown } from 'lucide-react';

interface PricingProps {
  onSelectTier: (tier: Tier) => void;
}

const Pricing: React.FC<PricingProps> = ({ onSelectTier }) => {
  return (
    <div className="min-h-screen bg-background py-12 px-6 overflow-y-auto animate-fade-in">
        <div className="text-center max-w-3xl mx-auto mb-16 px-4">
            <h2 className="text-primary font-bold tracking-widest uppercase text-sm mb-4 break-words">Master Your Movement.</h2>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6">Unlock Peak Performance</h1>
            <p className="text-gray-400 text-lg">
                Select the plan that fits your training needs. Upgrade or downgrade at any time.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Basic Tier */}
            <PricingCard 
                title="Basic" 
                price="Free" 
                description="Essential movement analysis for casual athletes."
                features={[
                    "Standard Pose Estimation",
                    "Basic Posture Scoring",
                    "3 Uploads per Day",
                    "Standard Processing Speed"
                ]}
                icon={Shield}
                onSelect={() => onSelectTier('Basic')}
                delay={0}
            />

            {/* Intermediate Tier */}
            <PricingCard 
                title="Intermediate" 
                price="$12" 
                period="/mo"
                description="Advanced metrics for serious improvement."
                features={[
                    "High-Res Analysis",
                    "Injury Risk Detection",
                    "Unlimited Uploads",
                    "Detailed Biomechanics Feedback",
                    "History Tracking (30 Days)"
                ]}
                icon={Zap}
                isPopular
                onSelect={() => onSelectTier('Intermediate')}
                delay={100}
            />

            {/* Pro Tier */}
            <PricingCard 
                title="Pro" 
                price="$29" 
                period="/mo"
                description="Professional grade engine for elite competition."
                features={[
                    "Gemini 3 Pro Reasoning Model",
                    "Real-time Live Coach Voice",
                    "Comparison to Pro Athletes",
                    "Deep Skeleton Overlay",
                    "Export Data to PDF",
                    "Priority Processing"
                ]}
                icon={Crown}
                highlight
                onSelect={() => onSelectTier('Pro')}
                delay={200}
            />
        </div>
    </div>
  );
};

const PricingCard = ({ title, price, period, description, features, icon: Icon, isPopular, highlight, onSelect, delay }: any) => (
    <div 
        className={`relative flex flex-col p-8 rounded-3xl border transition-all duration-300 hover:transform hover:-translate-y-2 ${
            highlight 
            ? 'bg-gradient-to-b from-gray-900 to-black border-accent shadow-[0_0_40px_rgba(139,92,246,0.15)]' 
            : 'bg-surface border-gray-800'
        }`}
        style={{ animationDelay: `${delay}ms` }}
    >
        {isPopular && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-secondary text-black font-bold text-xs px-4 py-1.5 rounded-full shadow-lg uppercase tracking-wider">
                Most Popular
            </div>
        )}
        
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${highlight ? 'bg-accent/10 text-accent' : 'bg-gray-800 text-gray-400'}`}>
            <Icon size={28} />
        </div>

        <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400 text-sm mb-8 min-h-[40px]">{description}</p>
        
        <div className="flex items-end gap-1 mb-8">
            <span className="text-4xl font-black text-white">{price}</span>
            {period && <span className="text-gray-500 mb-1 font-medium">{period}</span>}
        </div>

        <button 
            onClick={onSelect}
            className={`w-full py-4 rounded-xl font-bold mb-8 transition-all ${
                highlight 
                ? 'bg-white text-black hover:bg-gray-200' 
                : 'bg-gray-800 text-white hover:bg-gray-700 hover:text-white'
            }`}
        >
            {price === 'Free' ? 'Get Started' : 'Start Trial'}
        </button>

        <div className="space-y-4 flex-1">
            {features.map((feat: string, i: number) => (
                <div key={i} className="flex items-start gap-3">
                    <Check size={16} className={`mt-0.5 ${highlight ? 'text-accent' : 'text-primary'}`} />
                    <span className="text-sm text-gray-300">{feat}</span>
                </div>
            ))}
        </div>
    </div>
);

export default Pricing;
