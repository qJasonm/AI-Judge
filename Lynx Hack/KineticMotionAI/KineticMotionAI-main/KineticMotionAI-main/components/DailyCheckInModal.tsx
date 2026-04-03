import React, { useState } from 'react';
import { Moon, Zap, AlertCircle, ArrowRight, Battery } from 'lucide-react';
import { DailyLog } from '../types';

interface DailyCheckInModalProps {
    onComplete: (logData: Partial<DailyLog>) => void;
    username: string;
}

const DailyCheckInModal: React.FC<DailyCheckInModalProps> = ({ onComplete, username }) => {
    const [step, setStep] = useState(1);
    const [sleep, setSleep] = useState(7.0);
    const [energy, setEnergy] = useState(5);
    const [soreness, setSoreness] = useState(1);
    const [mood, setMood] = useState<'Great' | 'Good' | 'Okay' | 'Tired' | 'Stressed'>('Good');

    const handleNext = () => {
        if (step < 3) {
            setStep(step + 1);
        } else {
            handleSubmit();
        }
    };

    const handleSubmit = () => {
        // Calculate initial readiness based on input
        const sleepComp = Math.min(sleep / 9, 1) * 35;
        const energyComp = (energy / 10) * 35;
        const soreComp = ((10 - soreness) / 10) * 30;
        const score = Math.round(sleepComp + energyComp + soreComp);

        const logData: Partial<DailyLog> = {
            date: new Date().toISOString().split('T')[0],
            sleepHours: sleep,
            energy: energy,
            soreness: soreness,
            readinessScore: score,
            hydrationCups: 0,
            mobilityChecked: false,
            warmupChecked: false,
            macros: { protein: 0, water: 0, calories: 0 },
            agenda: []
        };
        onComplete(logData);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/95 dark:bg-black/95 backdrop-blur-xl animate-in fade-in duration-500">
            <div className="w-full max-w-lg bg-white dark:bg-[#0a0a0b] border border-gray-200 dark:border-gray-800 rounded-[32px] overflow-hidden shadow-2xl relative">
                
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gray-200 dark:bg-gray-800">
                    <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }}></div>
                </div>

                <div className="p-8 md:p-12 flex flex-col items-center text-center">
                    
                    {step === 1 && (
                        <div className="space-y-8 w-full animate-in slide-in-from-right fade-in duration-300">
                            <div>
                                <h2 className="text-3xl font-black text-gray-900 dark:text-white italic tracking-tighter mb-2">GOOD MORNING, {username.toUpperCase()}</h2>
                                <p className="text-gray-500 dark:text-gray-400">Let's calibrate your system for today.</p>
                            </div>

                            <div className="bg-gray-50 dark:bg-surface border border-gray-200 dark:border-gray-800 p-6 rounded-2xl w-full">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Moon className="text-primary" size={20}/> Hours Slept</span>
                                    <span className="text-2xl font-black text-primary">{sleep}h</span>
                                </div>
                                <input 
                                    type="range" min="3" max="12" step="0.5" 
                                    value={sleep} 
                                    onChange={(e) => setSleep(parseFloat(e.target.value))} 
                                    className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary" 
                                />
                            </div>

                            <div className="bg-gray-50 dark:bg-surface border border-gray-200 dark:border-gray-800 p-6 rounded-2xl w-full">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Battery className="text-accent" size={20}/> Energy Level</span>
                                    <span className="text-2xl font-black text-accent">{energy}/10</span>
                                </div>
                                <input 
                                    type="range" min="1" max="10" step="1" 
                                    value={energy} 
                                    onChange={(e) => setEnergy(parseInt(e.target.value))} 
                                    className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent" 
                                />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-8 w-full animate-in slide-in-from-right fade-in duration-300">
                            <div>
                                <h2 className="text-3xl font-black text-gray-900 dark:text-white italic tracking-tighter mb-2">BODY STATUS</h2>
                                <p className="text-gray-500 dark:text-gray-400">Any pain or stiffness preventing peak performance?</p>
                            </div>

                            <div className="bg-gray-50 dark:bg-surface border border-gray-200 dark:border-gray-800 p-6 rounded-2xl w-full">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><AlertCircle className="text-red-500" size={20}/> Soreness Level</span>
                                    <span className={`text-2xl font-black ${soreness > 5 ? 'text-red-500' : 'text-green-500'}`}>{soreness}/10</span>
                                </div>
                                <input 
                                    type="range" min="1" max="10" step="1" 
                                    value={soreness} 
                                    onChange={(e) => setSoreness(parseInt(e.target.value))} 
                                    className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500" 
                                />
                                <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase mt-2">
                                    <span>Fresh</span>
                                    <span>Can't Walk</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-8 w-full animate-in slide-in-from-right fade-in duration-300">
                            <div>
                                <h2 className="text-3xl font-black text-gray-900 dark:text-white italic tracking-tighter mb-2">MINDSET</h2>
                                <p className="text-gray-500 dark:text-gray-400">How are you feeling mentally today?</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {['Great', 'Good', 'Okay', 'Tired', 'Stressed'].map((m) => (
                                    <button 
                                        key={m}
                                        onClick={() => setMood(m as any)}
                                        className={`p-4 rounded-xl border font-bold transition-all ${mood === m ? 'bg-primary text-white dark:text-black border-primary' : 'bg-gray-50 dark:bg-surface border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500'}`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <button 
                        onClick={handleNext}
                        className="mt-8 w-full py-4 bg-primary text-white dark:bg-white dark:text-black font-black rounded-xl text-lg uppercase tracking-widest hover:bg-orange-600 dark:hover:bg-gray-200 transition-all flex items-center justify-center gap-2 group"
                    >
                        {step === 3 ? 'Initialize Daily OS' : 'Next'} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DailyCheckInModal;