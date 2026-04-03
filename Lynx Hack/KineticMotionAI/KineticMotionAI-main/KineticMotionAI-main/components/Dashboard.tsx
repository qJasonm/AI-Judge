import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, RadarChart, Radar, PolarGrid, PolarAngleAxis, Legend } from 'recharts';
import { AnalysisResult, UserStats, MicroLesson, DailyLog } from '../types';
import { Activity, Trophy, TrendingUp, Sparkles, AlertOctagon, BookOpen, X, Droplets, Brain } from 'lucide-react';
import { generateWeeklyInsights } from '../services/geminiService';

interface DashboardProps {
  history: AnalysisResult[];
  userStats?: UserStats;
  dailyLog?: DailyLog;
}

const Dashboard: React.FC<DashboardProps> = ({ history, userStats, dailyLog }) => {
  const [coachInsights, setCoachInsights] = useState<string[]>([]);
  const [activeLesson, setActiveLesson] = useState<MicroLesson | null>(null);

  useEffect(() => {
      if (history.length > 0) {
          generateWeeklyInsights(history).then(setCoachInsights);
      } else {
          setCoachInsights(["Log your first session to receive AI coaching insights."]);
      }
  }, [history.length]);

  // Weakness Data for Radar Chart
  const weaknessData = userStats?.weaknesses && Object.keys(userStats.weaknesses).length > 0
    ? Object.entries(userStats.weaknesses).map(([key, value]) => ({ subject: key, A: value, fullMark: 10 }))
    : [];

  const scoreTrendData = history.map((h, i) => ({
    name: `S${i + 1}`,
    score: h.overallScore ?? 0,
    risk: h.injuryRiskScore ?? 0,
  }));

  const MICRO_LESSONS: MicroLesson[] = [
      { id: '1', title: 'Knee Valgus', content: 'Inward collapse of knees during squats/jumps. Causes ACL strain. Fix: Drive knees out.', icon: 'Zap' },
      { id: '2', title: 'Hip Hinge', content: 'Movement originating from hips, not spine. Crucial for deadlifts and jumps.', icon: 'Activity' },
      { id: '3', title: 'Scapular Retraction', content: 'Pulling shoulder blades together. Improves posture and pressing stability.', icon: 'Shield' }
  ];

  // --- REAL DATA MAPPING ---
  const consistencyGrade = userStats?.consistencyGrade || '-';
  
  // Daily Log Data
  const readiness = dailyLog?.readinessScore ?? 0;
  const readinessText = readiness > 0 ? `${readiness}%` : "N/A";
  const hydrationText = dailyLog ? `${dailyLog.hydrationCups} Cups` : "0 Cups";
  const hydrationPercentage = dailyLog ? Math.min(100, (dailyLog.hydrationCups / 12) * 100) : 0;
  
  // Readiness Logic
  let readinessColor = "text-gray-500";
  let readinessLabel = "No Data";
  if (readiness > 0) {
      if (readiness >= 80) { readinessColor = "text-green-500"; readinessLabel = "Prime to Train"; }
      else if (readiness >= 50) { readinessColor = "text-yellow-500"; readinessLabel = "Moderate"; }
      else { readinessColor = "text-red-500"; readinessLabel = "Rest Advised"; }
  }

  return (
    <div className="p-6 md:p-12 space-y-10 animate-fade-in pb-32 relative">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-800">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">PERFORMANCE OS</h1>
          <p className="text-gray-400 text-lg">Daily Snapshot & Long-Term Trends</p>
        </div>
      </header>

      {/* --- UNIFIED DAILY OVERVIEW --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Consistency Grade */}
          <div className="bg-surface border border-gray-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[40px] pointer-events-none"></div>
              <div className="flex justify-between items-start mb-4">
                  <Trophy className="text-primary" size={24} />
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Consistency Grade</span>
              </div>
              <div className="text-6xl font-black text-white mb-2">{consistencyGrade}</div>
              <div className="text-sm text-gray-400 font-bold">{consistencyGrade === '-' ? 'Not graded yet' : 'Based on activity'}</div>
          </div>

          {/* Readiness / Last Session */}
           <div className="bg-surface border border-gray-800 rounded-3xl p-6 shadow-xl">
              <div className="flex justify-between items-start mb-4">
                  <Activity className="text-primary" size={24} />
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Readiness</span>
              </div>
              <div className="text-4xl font-black text-white mb-1">{readinessText}</div>
              <p className={`text-xs font-bold uppercase ${readinessColor}`}>{readinessLabel}</p>
          </div>

          {/* Hydration & Streak */}
          <div className="bg-surface border border-gray-800 rounded-3xl p-6 shadow-xl">
              <div className="flex justify-between items-start mb-4">
                  <Droplets className="text-secondary" size={24} />
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Hydration</span>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-black text-white">{hydrationText}</span>
              </div>
              <div className="w-full h-1 bg-gray-700 mt-2 rounded-full overflow-hidden">
                  <div className="h-full bg-secondary" style={{ width: `${hydrationPercentage}%` }}></div>
              </div>
          </div>

          {/* Micro Learning */}
          <div className="bg-surface border border-gray-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                    <BookOpen className="text-accent" size={24} />
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Learn</span>
                </div>
                <h4 className="text-white font-bold text-sm mb-1">Daily Micro-Lesson</h4>
                <p className="text-xs text-gray-400">Master biomechanics concepts.</p>
              </div>
              <button onClick={() => setActiveLesson(MICRO_LESSONS[0])} className="mt-4 w-full py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-bold uppercase transition-colors">View Lesson</button>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Score & Risk Trend */}
            <div className="lg:col-span-2 bg-surface border border-gray-800 rounded-[40px] p-8 shadow-2xl">
                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-6 flex items-center gap-3">
                  <TrendingUp size={24} className="text-primary" /> Score vs Risk Trend
                </h3>
                <div className="h-[300px] w-full flex items-center justify-center">
                    {scoreTrendData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={scoreTrendData}>
                                <defs>
                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                <XAxis dataKey="name" stroke="#52525b" tick={{fill: '#71717a', fontSize: 10}} />
                                <YAxis stroke="#52525b" tick={{fill: '#71717a', fontSize: 10}} domain={[0, 100]} />
                                <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#3f3f46', borderRadius: '12px' }} />
                                <Area type="monotone" dataKey="score" stroke="#f97316" strokeWidth={3} fill="url(#colorScore)" name="Technique Score" />
                                <Area type="monotone" dataKey="risk" stroke="#ef4444" strokeWidth={2} fill="url(#colorRisk)" name="Injury Risk" />
                                <Legend />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-gray-500 italic">No analysis history yet. Complete a session to see trends.</div>
                    )}
                </div>
            </div>

            {/* Weakness Tracker */}
            <div className="space-y-6">
                <div className="bg-surface border border-gray-800 rounded-[40px] p-8 shadow-xl flex flex-col h-full">
                     <h3 className="text-lg font-black text-white italic uppercase tracking-tighter mb-4 flex items-center gap-2">
                        <AlertOctagon size={20} className="text-orange-500" /> Weakness Radar
                    </h3>
                    <div className="flex-1 min-h-[200px] flex items-center justify-center">
                        {weaknessData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={weaknessData}>
                                    <PolarGrid stroke="#374151" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                                    <Radar name="Frequency" dataKey="A" stroke="#84cc16" fill="#84cc16" fillOpacity={0.5} />
                                </RadarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-center text-gray-500 text-sm italic">Analyze movements to identify weaknesses.</div>
                        )}
                    </div>
                </div>

                {/* AI COACH INSIGHTS */}
                <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-[40px] p-8 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[40px] pointer-events-none"></div>
                    <h3 className="text-lg font-black text-white italic uppercase tracking-tighter mb-4 flex items-center gap-2">
                        <Brain size={20} className="text-primary" /> Coach Insights
                    </h3>
                    <div className="space-y-3">
                        {coachInsights.length > 0 ? coachInsights.map((insight, i) => (
                            <div key={i} className="flex gap-3 items-start">
                                <Sparkles size={16} className="text-primary shrink-0 mt-0.5" />
                                <p className="text-sm text-gray-300 leading-snug">{insight}</p>
                            </div>
                        )) : (
                            <p className="text-gray-500 text-sm italic">Analyze more movements to unlock insights.</p>
                        )}
                    </div>
                </div>
            </div>
      </div>

      {/* Micro Lesson Modal */}
      {activeLesson && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="bg-surface border border-gray-700 p-8 rounded-3xl max-w-md w-full relative">
                  <button onClick={() => setActiveLesson(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20}/></button>
                  <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                      <BookOpen className="text-primary" /> {activeLesson.title}
                  </h3>
                  <div className="h-px w-full bg-gray-800 mb-4"></div>
                  <p className="text-gray-300 text-lg leading-relaxed">{activeLesson.content}</p>
              </div>
          </div>
      )}
    </div>
  );
};

export default Dashboard;