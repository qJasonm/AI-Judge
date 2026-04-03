import React from 'react';
import { ViewState, UserStats } from '../types';
import { Trophy, Activity, Dumbbell, Zap, Target, Move, ArrowRight, PlayCircle, Disc, Flag, Heart, Crosshair, ShieldCheck, Cpu, Layers, Flame, Award, TrendingUp, Lock, Star, Shield, Users, Crown, CheckCircle2 } from 'lucide-react';
import { t } from '../utils/translations';

interface HomeProps {
  setView: (view: ViewState) => void;
  setSport: (sport: string) => void;
  userStats: UserStats;
  lang: string;
  showLeaderboard?: boolean;
}

// Custom Sport Icons for strict visual matching
const SportIcons: Record<string, React.FC<any>> = {
    Basketball: ({size, className}) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
             <circle cx="12" cy="12" r="10" />
             <path d="M5.65 17.65a6 6 0 0 0 12.7 0" />
             <path d="M12 2v20" />
             <path d="M2 12h20" />
        </svg>
    ),
    Soccer: ({size, className}) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 7l-4.5 2.5v5L12 17l4.5-2.5v-5L12 7z" />
            <path d="M12 7V2" />
            <path d="M7.5 9.5L4 5" />
            <path d="M16.5 9.5L20 5" />
            <path d="M16.5 14.5L20 19" />
            <path d="M7.5 14.5L4 19" />
        </svg>
    ),
    Football: ({size, className}) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
             <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" transform="scale(0.8, 1) translate(3, 0)" />
             <path d="M12 2c5.5 0 10 4.5 10 10s-4.5 10-10 10S2 17.5 2 12 6.5 2 12 2" style={{display: 'none'}}/> 
             <ellipse cx="12" cy="12" rx="10" ry="12" transform="rotate(45 12 12)" />
             <path d="M8 12h8" transform="rotate(45 12 12)" />
             <path d="M12 8v8" transform="rotate(45 12 12)" />
        </svg>
    ),
    Tennis: ({size, className}) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
             <circle cx="12" cy="12" r="10" />
             <path d="M2 12a10 10 0 0 0 20 0" style={{display:'none'}}/>
             <path d="M4 12c0 4.4 3.6 8 8 8" />
             <path d="M20 12c0-4.4-3.6-8-8-8" />
        </svg>
    ),
    Baseball: ({size, className}) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
             <circle cx="12" cy="12" r="10" />
             <path d="M9 19c-3-3-3-11 0-14" />
             <path d="M15 19c3-3 3-11 0-14" />
             <path d="M7 6l1 1" />
             <path d="M16 6l1 1" />
             <path d="M7 18l1-1" />
             <path d="M16 18l1-1" />
        </svg>
    ),
    Volleyball: ({size, className}) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" style={{display:'none'}} />
            <path d="M12 2c0 5 4 9 9 9" />
            <path d="M12 22c0-5-4-9-9-9" />
            <path d="M2 12c5 0 9-4 9-9" style={{display: 'none'}} />
            <path d="M22 12c-5 0-9 4-9 9" style={{display: 'none'}} />
             <path d="M8.5 2.5c2.5 3 2.5 7 0 10" transform="rotate(-45 12 12)" />
        </svg>
    )
};

const Home: React.FC<HomeProps> = ({ setView, setSport, userStats, lang }) => {
  const sports = [
    { id: 'Basketball', icon: SportIcons.Basketball, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20', desc: 'Jump shots, layups, dribbling.', slogan: '"Talent wins games, but teamwork wins championships." — M. Jordan' },
    { id: 'American Football', icon: SportIcons.Football, color: 'text-amber-600', bg: 'bg-amber-600/10', border: 'border-amber-600/20', desc: 'QB mechanics, route running.', slogan: '"It’s not whether you get knocked down, it’s whether you get up." — V. Lombardi' },
    { id: 'Gymnastics', icon: Star, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20', desc: 'Vault, floor routines, balance beam.', slogan: '"Perfection is not attainable, but if we chase perfection we can catch excellence."' },
    { id: 'Soccer', icon: SportIcons.Soccer, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', desc: 'Strikes, passing, control.', slogan: '"You have to fight to reach your dream." — L. Messi' },
    { id: 'Fitness', icon: Dumbbell, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', desc: 'Squats, deadlifts, pushups.', slogan: '"The only bad workout is the one that didn\'t happen."' },
    { id: 'Tennis', icon: SportIcons.Tennis, color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20', desc: 'Serves, forehand, volley.', slogan: '"I play for myself." — Serena Williams' },
    { id: 'Golf', icon: Flag, color: 'text-green-600', bg: 'bg-green-600/10', border: 'border-green-600/20', desc: 'Swing mechanics & stance.', slogan: '"The most important shot is the next one." — Ben Hogan' },
    { id: 'Yoga', icon: Heart, color: 'text-pink-500', bg: 'bg-pink-500/10', border: 'border-pink-500/20', desc: 'Poses, balance, flow.', slogan: '"Yoga is the journey of the self." — Bhagavad Gita' },
    { id: 'Running', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20', desc: 'Sprint & stride analysis.', slogan: '"Run when you can, walk if you must, crawl if you have to."' },
    { id: 'Baseball', icon: SportIcons.Baseball, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', desc: 'Pitching & batting form.', slogan: '"Every strike brings me closer to the next home run." — Babe Ruth' },
    { id: 'Volleyball', icon: SportIcons.Volleyball, color: 'text-violet-500', bg: 'bg-violet-500/10', border: 'border-violet-500/20', desc: 'Serving, spiking, setting.', slogan: '"It’s not how big you are, it’s how big you play."' },
    { id: 'Boxing', icon: Crosshair, color: 'text-red-600', bg: 'bg-red-600/10', border: 'border-red-600/20', desc: 'Stance, jabs, footwork.', slogan: '"Float like a butterfly, sting like a bee." — M. Ali' },
    { id: 'Cricket', icon: Disc, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20', desc: 'Batting & bowling technique.', slogan: '"You don\'t play for the crowd, you play for the country." — MS Dhoni' },
    { id: 'Badminton', icon: Move, color: 'text-teal-400', bg: 'bg-teal-400/10', border: 'border-teal-400/20', desc: 'Smashes & rapid footwork.', slogan: '"Champions keep playing until they get it right." — B.J. King' },
  ];

  const handleSelect = (sportId: string) => {
    setSport(sportId);
    setView(ViewState.ANALYZER);
  };

  // XP Progress Calculation
  const progressPercent = Math.min(100, Math.max(5, (userStats.currentXP / userStats.nextLevelXP) * 100));

  return (
    <div className="min-h-full animate-fade-in px-4 md:px-8 flex flex-col">
      
      {/* --- GAMIFICATION PROFILE HEADER --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 mt-8">
          
          {/* Main Player Card */}
          <div className="lg:col-span-2 bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:via-[#0a0a0b] dark:to-black border border-gray-200 dark:border-gray-800 rounded-[32px] p-6 md:p-8 shadow-2xl relative overflow-hidden group">
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none"></div>
              
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">
                  {/* Avatar / Rank */}
                  <div className="relative shrink-0">
                       <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-pulse"></div>
                       <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-surface border-4 border-primary flex items-center justify-center relative shadow-xl">
                            <span className="text-3xl font-black text-gray-900 dark:text-white italic">{userStats.level}</span>
                            <div className="absolute -bottom-2 bg-white dark:bg-black text-primary text-[10px] font-black uppercase px-2 py-0.5 rounded border border-primary">
                                Level
                            </div>
                       </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 w-full">
                      <div className="flex items-center gap-3 mb-1">
                          <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase italic tracking-wider">{userStats.title}</h2>
                          {userStats.level > 10 && <CrownIcon size={20} className="text-accent fill-accent" />}
                      </div>
                      
                      {/* XP Bar */}
                      <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">
                          <span>{userStats.currentXP} XP</span>
                          <span>{userStats.nextLevelXP} XP (Next Rank)</span>
                      </div>
                      <div className="w-full h-4 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden border border-gray-300 dark:border-gray-700/50 shadow-inner">
                          <div 
                            className="h-full bg-gradient-to-r from-primary to-secondary relative transition-all duration-1000 ease-out"
                            style={{ width: `${progressPercent}%` }}
                          >
                               <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[move_1s_linear_infinite]"></div>
                          </div>
                      </div>
                  </div>
              </div>

               {/* Active Challenges Mini-Section */}
               <div className="mt-6 border-t border-gray-200 dark:border-gray-800 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {userStats.challenges.slice(0, 2).map(challenge => (
                      <div key={challenge.id} className="bg-gray-50 dark:bg-black/40 rounded-xl p-3 border border-gray-200 dark:border-gray-800 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                              <Target size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                              <h4 className="text-gray-900 dark:text-white text-xs font-bold truncate">{challenge.title}</h4>
                              <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                                  <span>{challenge.currentCount}/{challenge.targetCount}</span>
                                  <span className="text-primary">+{challenge.xpReward} XP</span>
                              </div>
                              <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full">
                                  <div className="h-full bg-primary rounded-full transition-all" style={{width: `${(challenge.currentCount / challenge.targetCount) * 100}%`}}></div>
                              </div>
                          </div>
                      </div>
                  ))}
               </div>
          </div>

          {/* Badges / Streak Card (Leaderboard Removed) */}
          <div className="bg-white dark:bg-surface border border-gray-200 dark:border-gray-800 rounded-[32px] p-6 shadow-xl flex flex-col relative overflow-hidden transition-colors duration-300">
               
               {/* Streak & Stats */}
               <div className="flex justify-between items-start mb-6 border-b border-gray-800 pb-4">
                   <div>
                       <h3 className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-xs mb-1">Current Streak</h3>
                       <div className="flex items-center gap-2">
                           <Flame className="text-primary fill-primary animate-pulse" size={24} />
                           <span className="text-3xl font-black text-gray-900 dark:text-white">{userStats.streak} <span className="text-sm font-bold text-gray-500">Days</span></span>
                       </div>
                   </div>
                   <div className="text-right">
                       <h3 className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-xs mb-1">Total Scans</h3>
                       <span className="text-2xl font-black text-gray-900 dark:text-white">{userStats.lifetimeAnalyses}</span>
                   </div>
               </div>

               {/* Trophy Case */}
               <div className="flex-1">
                   <h3 className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mb-3">Trophy Case</h3>
                   <div className="flex gap-2 flex-wrap">
                       {userStats.badges.length > 0 ? userStats.badges.map((b) => (
                           <div key={b.id} className={`w-10 h-10 rounded-lg border flex items-center justify-center group relative cursor-pointer transition-colors ${b.rarity === 'legendary' ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500' : 'bg-gray-100 dark:bg-gray-800 border-gray-700 text-gray-400'}`}>
                               <Star size={16} fill="currentColor" />
                               {/* Tooltip */}
                               <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-black border border-gray-700 p-2 rounded-lg w-32 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl">
                                   <p className="text-white text-[10px] font-bold">{b.name}</p>
                                   <p className="text-gray-400 text-[9px]">{b.description}</p>
                               </div>
                           </div>
                       )) : (
                           <div className="w-full text-center py-4 bg-black/20 rounded-xl border border-dashed border-gray-800">
                               <p className="text-xs text-gray-500 italic">No badges earned yet.</p>
                           </div>
                       )}
                   </div>
               </div>
          </div>
      </div>

      {/* Sports Grid */}
      <div className="max-w-7xl mx-auto w-full mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 px-2 gap-4">
             <div>
                <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-2">{t('select_sport', lang)}</h2>
                <p className="text-gray-500 dark:text-gray-400 text-lg">{t('or_type_own', lang)}</p>
             </div>
             <button onClick={() => setView(ViewState.ANALYZER)} className="text-primary font-bold hover:text-secondary transition-colors flex items-center gap-2">
                 {t('view_all', lang)} <ArrowRight size={18} />
             </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {sports.map((sport) => (
            <button
              key={sport.id}
              onClick={() => handleSelect(sport.id)}
              className="group relative flex flex-col items-start p-8 h-80 rounded-3xl bg-white dark:bg-surface border border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600 transition-all duration-300 overflow-hidden hover:shadow-2xl hover:-translate-y-2"
            >
              <div className={`absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-black transition-opacity opacity-0 group-hover:opacity-100 ${sport.bg.replace('/10', '/5')}`}></div>
              
              <div className={`absolute -bottom-4 -right-4 opacity-[0.05] group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500 ${sport.color}`}>
                  <sport.icon size={200} />
              </div>
              
              <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center mb-auto ${sport.bg} ${sport.color} border ${sport.border} shadow-inner group-hover:scale-110 transition-transform`}>
                <sport.icon size={32} />
              </div>
              
              <div className="relative z-10 w-full text-left mt-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors">{sport.id}</h3>
                <p className="text-xs font-bold text-gray-500 italic mb-2 group-hover:text-gray-400 dark:group-hover:text-gray-300 transition-colors leading-relaxed min-h-[3rem]">{sport.slogan}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug">{sport.desc}</p>
              </div>
              
              <div className="relative z-10 w-full flex justify-between items-center mt-auto pt-6 border-t border-gray-100 dark:border-gray-800/50 group-hover:border-gray-300 dark:group-hover:border-white/10 transition-colors">
                  <span className="text-xs font-bold text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white transition-colors tracking-wider">ANALYZE</span>
                  <div className="bg-gray-100 dark:bg-black/40 p-2 rounded-full text-gray-500 group-hover:text-white group-hover:bg-primary transition-all">
                    <ArrowRight size={16} />
                  </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const CrownIcon = ({ size = 24, className }: any) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M5 16v-3.875a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2V16" />
      <path d="M3 5l2 8h14l2-8-4.5 3L12 3 7.5 8z" />
      <path d="M5 16h14a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2z" />
    </svg>
);

const StatItem = ({ icon: Icon, value, label }: any) => (
    <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-primary">
            <Icon size={20} />
        </div>
        <div className="text-left">
            <div className="text-xl font-black text-white">{value}</div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</div>
        </div>
    </div>
);

export default Home;