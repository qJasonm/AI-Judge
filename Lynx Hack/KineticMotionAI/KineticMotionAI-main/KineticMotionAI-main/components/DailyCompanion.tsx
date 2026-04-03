import React, { useState, useEffect } from 'react';
import { UserSettings, DailyLog, AgendaItem, Goal } from '../types';
import { Moon, Droplets, Battery, Activity, CheckCircle2, Zap, AlertCircle, Plus, Minus, Target, ChefHat, Trash2, Clock, Dumbbell } from 'lucide-react';

interface DailyCompanionProps {
    settings: UserSettings;
    onUpdateLog: (log: DailyLog) => void;
    currentLog?: DailyLog;
}

const DailyCompanion: React.FC<DailyCompanionProps> = ({ settings, onUpdateLog, currentLog }) => {
    // If no currentLog (e.g. bypassed modal), use defaults, otherwise use props
    const [log, setLog] = useState<DailyLog>(currentLog || {
        date: new Date().toISOString().split('T')[0],
        readinessScore: 0, // Zero init
        sleepHours: 7,
        hydrationCups: 0,
        soreness: 1,
        energy: 5,
        mobilityChecked: false,
        warmupChecked: false,
        macros: { protein: 0, water: 0, calories: 0 },
        agenda: []
    });

    const [newTask, setNewTask] = useState('');
    const [goals, setGoals] = useState<Goal[]>([]); // Empty goals initially
    const [newGoalTitle, setNewGoalTitle] = useState('');

    // Sync with parent log changes
    useEffect(() => {
        if (currentLog) {
            setLog(currentLog);
        }
    }, [currentLog]);

    // Calculate Readiness Score Automatically
    useEffect(() => {
        // Formula: (Sleep/9 * 30) + (Energy/10 * 30) + (Hydration/10 * 10) + ((10-Soreness)/10 * 30)
        // Weighted for maximum impact of Sleep and Soreness
        const sleepComp = Math.min(log.sleepHours / 9, 1) * 35;
        const energyComp = (log.energy / 10) * 25;
        const soreComp = ((10 - log.soreness) / 10) * 30;
        const hydroComp = Math.min(log.hydrationCups / 8, 1) * 10;
        
        let score = Math.round(sleepComp + energyComp + soreComp + hydroComp);
        
        // Only update if changed to avoid infinite loop with parent
        if (score !== log.readinessScore) {
             setLog(prev => ({ ...prev, readinessScore: score }));
             onUpdateLog({ ...log, readinessScore: score });
        }
    }, [log.sleepHours, log.energy, log.soreness, log.hydrationCups]);

    const handleAddTask = () => {
        if (!newTask.trim()) return;
        const task: AgendaItem = {
            id: Date.now().toString(),
            text: newTask,
            completed: false,
            category: 'focus'
        };
        const updatedAgenda = [...log.agenda, task];
        setLog({ ...log, agenda: updatedAgenda });
        onUpdateLog({ ...log, agenda: updatedAgenda });
        setNewTask('');
    };

    const toggleTask = (id: string) => {
        const updatedAgenda = log.agenda.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
        setLog({ ...log, agenda: updatedAgenda });
        onUpdateLog({ ...log, agenda: updatedAgenda });
    };

    const deleteTask = (id: string) => {
        const updatedAgenda = log.agenda.filter(t => t.id !== id);
        setLog({ ...log, agenda: updatedAgenda });
        onUpdateLog({ ...log, agenda: updatedAgenda });
    };

    const handleAddGoal = () => {
        if (!newGoalTitle.trim()) return;
        const newGoal: Goal = {
            id: Date.now().toString(),
            title: newGoalTitle,
            category: 'Technique',
            metric: 'Score',
            targetValue: 100,
            currentValue: 0,
            unit: '%',
            completed: false
        };
        setGoals([...goals, newGoal]);
        setNewGoalTitle('');
    };

    const deleteGoal = (id: string) => {
        setGoals(goals.filter(g => g.id !== id));
    };

    // Derived State for UI
    const getIntensityRec = () => {
        if (log.readinessScore === 0) return "Complete daily check-in";
        if (log.readinessScore >= 85) return "High Intensity / PR Attempt";
        if (log.readinessScore >= 60) return "Moderate / Hypertrophy Focus";
        if (log.readinessScore >= 40) return "Technical Drills / Low Impact";
        return "Rest Day / Active Recovery";
    };

    const getScoreColor = (score: number) => {
        if (score === 0) return 'text-gray-500 border-gray-500';
        if (score >= 80) return 'text-primary border-primary';
        if (score >= 50) return 'text-accent border-accent';
        return 'text-red-500 border-red-500';
    };

    const handleProtein = (amount: number) => {
        const newAmount = Math.max(0, log.macros.protein + amount);
        setLog(prev => ({ ...prev, macros: { ...prev.macros, protein: newAmount } }));
        onUpdateLog({ ...log, macros: { ...log.macros, protein: newAmount } });
    };

    const handleHydration = (amount: number) => {
        const newAmount = Math.max(0, log.hydrationCups + amount);
        setLog(prev => ({ ...prev, hydrationCups: newAmount }));
        onUpdateLog({ ...log, hydrationCups: newAmount });
    };

    const handleLogUpdate = (key: keyof DailyLog, value: any) => {
        const newLog = { ...log, [key]: value };
        setLog(newLog);
        onUpdateLog(newLog);
    };

    return (
        <div className="p-6 md:p-8 pb-24 max-w-6xl mx-auto animate-fade-in space-y-8">
            
            <div className="flex flex-col md:flex-row gap-6">
                {/* READINESS CARD */}
                <div className="flex-1 bg-white dark:bg-surface border border-gray-200 dark:border-gray-800 rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-[60px] pointer-events-none"></div>
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white italic tracking-tighter">DAILY <span className="text-primary">READINESS</span></h2>
                            <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Calculated Live</p>
                        </div>
                        <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center bg-gray-100 dark:bg-black/50 backdrop-blur-sm ${getScoreColor(log.readinessScore)}`}>
                            <span className="text-2xl font-black">{log.readinessScore}</span>
                        </div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-black/30 rounded-xl p-4 border border-gray-200 dark:border-gray-700 mb-6">
                        <div className="flex items-center gap-3 mb-2">
                             <Activity size={18} className="text-primary" />
                             <span className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Recommended Intensity</span>
                        </div>
                        <p className="text-gray-700 dark:text-white text-lg font-medium">{getIntensityRec()}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <InputSlider label="Sleep (h)" val={log.sleepHours} set={(v) => handleLogUpdate('sleepHours', v)} min={3} max={12} step={0.5} icon={Moon} color="primary" />
                        <InputSlider label="Energy" val={log.energy} set={(v) => handleLogUpdate('energy', v)} min={1} max={10} step={1} icon={Zap} color="accent" />
                    </div>
                </div>

                {/* RECOVERY TRACKER */}
                <div className="flex-1 bg-white dark:bg-surface border border-gray-200 dark:border-gray-800 rounded-[32px] p-8 shadow-2xl flex flex-col justify-between">
                     <div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white italic tracking-tighter mb-1 flex items-center gap-2">
                            <Battery size={24} className={log.soreness > 7 ? "text-red-500" : "text-green-500"} /> 
                            RECOVERY <span className="text-gray-500 dark:text-gray-600">TRACKER</span>
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest mb-6">Soreness & Habits</p>
                        
                        <div className="mb-6">
                            <InputSlider label="Soreness Level" val={log.soreness} set={(v) => handleLogUpdate('soreness', v)} min={1} max={10} step={1} icon={AlertCircle} color={log.soreness > 5 ? "red-500" : "green-500"} />
                        </div>
                     </div>

                     <div className="space-y-3">
                         <div 
                            onClick={() => handleLogUpdate('mobilityChecked', !log.mobilityChecked)}
                            className={`p-4 rounded-xl border flex items-center gap-4 cursor-pointer transition-all ${log.mobilityChecked ? 'bg-green-500/10 border-green-500' : 'bg-gray-100 dark:bg-black/20 border-gray-200 dark:border-gray-800 hover:bg-gray-200 dark:hover:bg-gray-800'}`}
                         >
                             <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${log.mobilityChecked ? 'bg-green-500 border-green-500 text-black' : 'border-gray-400 dark:border-gray-500'}`}>
                                 {log.mobilityChecked && <CheckCircle2 size={14} />}
                             </div>
                             <div>
                                 <h4 className={`font-bold ${log.mobilityChecked ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>Mobility Session</h4>
                                 <p className="text-[10px] text-gray-500 uppercase tracking-wide">Stretching / Foam Rolling</p>
                             </div>
                         </div>

                         <div 
                            onClick={() => handleLogUpdate('warmupChecked', !log.warmupChecked)}
                            className={`p-4 rounded-xl border flex items-center gap-4 cursor-pointer transition-all ${log.warmupChecked ? 'bg-green-500/10 border-green-500' : 'bg-gray-100 dark:bg-black/20 border-gray-200 dark:border-gray-800 hover:bg-gray-200 dark:hover:bg-gray-800'}`}
                         >
                             <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${log.warmupChecked ? 'bg-green-500 border-green-500 text-black' : 'border-gray-400 dark:border-gray-500'}`}>
                                 {log.warmupChecked && <CheckCircle2 size={14} />}
                             </div>
                             <div>
                                 <h4 className={`font-bold ${log.warmupChecked ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>Warm-Up Completed</h4>
                                 <p className="text-[10px] text-gray-500 uppercase tracking-wide">Activation Drills</p>
                             </div>
                         </div>
                     </div>
                </div>
            </div>

            {/* TASK LIST & AGENDA */}
             <div className="bg-white dark:bg-surface border border-gray-200 dark:border-gray-800 rounded-[32px] p-8">
                 <div className="flex justify-between items-center mb-6">
                     <h2 className="text-xl font-black text-gray-900 dark:text-white italic tracking-tighter flex items-center gap-2"><Clock size={20} className="text-purple-500"/> DAILY AGENDA</h2>
                     <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">Focus & Tasks</span>
                 </div>
                 
                 <div className="flex gap-2 mb-6">
                    <input 
                        type="text" 
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                        placeholder="Add a new task (e.g. 50 pushups)..."
                        className="flex-1 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:border-primary focus:outline-none"
                    />
                    <button onClick={handleAddTask} className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-xl transition-colors">
                        <Plus size={20} />
                    </button>
                 </div>

                 <div className="space-y-3">
                    {log.agenda.length > 0 ? log.agenda.map((task) => (
                        <div key={task.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all group ${task.completed ? 'bg-green-500/10 border-green-500/30' : 'bg-gray-50 dark:bg-black/20 border-gray-200 dark:border-gray-800'}`}>
                            <button onClick={() => toggleTask(task.id)} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${task.completed ? 'bg-green-500 border-green-500 text-black' : 'border-gray-400 dark:border-gray-600 hover:border-gray-500 dark:hover:border-gray-400'}`}>
                                {task.completed && <CheckCircle2 size={14} />}
                            </button>
                            <span className={`flex-1 text-sm font-bold ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}>{task.text}</span>
                            <button onClick={() => deleteTask(task.id)} className="text-gray-400 dark:text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    )) : (
                        <div className="text-center py-6 text-gray-500 italic text-sm border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                            Your agenda is empty. Add a task to start your day.
                        </div>
                    )}
                 </div>
             </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* MEAL & HYDRATION ASSISTANT */}
                 <div className="md:col-span-2 bg-white dark:bg-surface border border-gray-200 dark:border-gray-800 rounded-[32px] p-8">
                     <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-black text-gray-900 dark:text-white italic tracking-tighter flex items-center gap-2"><ChefHat size={20} className="text-accent"/> QUICK LOG</h2>
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">No Database Required</span>
                     </div>
                     
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                         {/* Hydration */}
                         <div>
                             <div className="flex justify-between items-center mb-2">
                                 <span className="text-sm font-bold text-blue-500 dark:text-blue-400 flex items-center gap-2"><Droplets size={16}/> Water</span>
                                 <span className="text-2xl font-black text-gray-900 dark:text-white">{log.hydrationCups} <span className="text-xs text-gray-500 font-bold">Cups</span></span>
                             </div>
                             <div className="flex gap-2">
                                 <button onClick={() => handleHydration(-1)} className="h-10 w-10 bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-white"><Minus size={16}/></button>
                                 <div className="flex-1 h-10 bg-gray-100 dark:bg-black/40 rounded-lg overflow-hidden relative">
                                     <div className="absolute inset-0 bg-blue-500/30" style={{ width: `${Math.min(100, (log.hydrationCups/12)*100)}%` }}></div>
                                 </div>
                                 <button onClick={() => handleHydration(1)} className="h-10 w-10 bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/50 rounded-lg flex items-center justify-center hover:bg-blue-500 hover:text-white transition-colors"><Plus size={16}/></button>
                             </div>
                         </div>

                         {/* Protein */}
                         <div>
                             <div className="flex justify-between items-center mb-2">
                                 <span className="text-sm font-bold text-accent flex items-center gap-2"><Dumbbell size={16}/> Protein</span>
                                 <span className="text-2xl font-black text-gray-900 dark:text-white">{log.macros.protein} <span className="text-xs text-gray-500 font-bold">g</span></span>
                             </div>
                             <div className="flex gap-2">
                                 <button onClick={() => handleProtein(-5)} className="h-10 w-10 bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-white"><Minus size={16}/></button>
                                 <div className="flex-1 h-10 bg-gray-100 dark:bg-black/40 rounded-lg overflow-hidden relative">
                                     <div className="absolute inset-0 bg-accent/30" style={{ width: `${Math.min(100, (log.macros.protein/200)*100)}%` }}></div>
                                 </div>
                                 <button onClick={() => handleProtein(5)} className="h-10 w-10 bg-accent/20 text-accent border border-accent/50 rounded-lg flex items-center justify-center hover:bg-accent hover:text-white transition-colors"><Plus size={16}/></button>
                             </div>
                         </div>
                     </div>
                 </div>

                 {/* GOAL TRACKER */}
                 <div className="bg-white dark:bg-surface border border-gray-200 dark:border-gray-800 rounded-[32px] p-8">
                     <h2 className="text-xl font-black text-gray-900 dark:text-white italic tracking-tighter mb-6 flex items-center gap-2"><Target size={20} className="text-primary"/> ACTIVE GOALS</h2>
                     
                     <div className="space-y-4 mb-6">
                         {goals.length > 0 ? goals.map(goal => (
                             <div key={goal.id} className="group relative">
                                 <div className="flex justify-between text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                                     <span className="text-gray-900 dark:text-white group-hover:text-primary transition-colors">{goal.title}</span>
                                     <button onClick={() => deleteGoal(goal.id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12}/></button>
                                 </div>
                                 <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                                     <div 
                                        className={`h-full rounded-full transition-all duration-1000 ${goal.category === 'Safety' ? 'bg-green-500' : 'bg-primary'}`}
                                        style={{ width: `${Math.min(100, (goal.currentValue / goal.targetValue) * 100)}%` }}
                                     ></div>
                                 </div>
                             </div>
                         )) : (
                             <div className="text-center text-xs text-gray-500 italic py-4">No active goals. Set a target!</div>
                         )}
                     </div>

                     <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={newGoalTitle}
                            onChange={(e) => setNewGoalTitle(e.target.value)}
                            placeholder="New Goal..."
                            className="flex-1 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-xs focus:border-primary focus:outline-none"
                        />
                        <button onClick={handleAddGoal} className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-xl">
                            <Plus size={16} />
                        </button>
                     </div>
                 </div>
            </div>
        </div>
    );
};

const InputSlider = ({ label, val, set, min, max, step, icon: Icon, color }: any) => (
    <div>
        <div className="flex justify-between text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">
            <span>{label} ({val})</span>
            <Icon size={14} className={`text-${color}`} />
        </div>
        <input type="range" min={min} max={max} step={step} value={val} onChange={(e) => set(parseFloat(e.target.value))} className={`w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-${color}`} />
    </div>
);

export default DailyCompanion;