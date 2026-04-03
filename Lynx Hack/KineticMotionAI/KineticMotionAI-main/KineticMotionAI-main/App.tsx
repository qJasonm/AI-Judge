import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard'; 
import Analyzer from './components/Analyzer';
import DailyCompanion from './components/DailyCompanion';
import Home from './components/Home';
import Settings from './components/Settings';
import About from './components/About';
import Auth from './components/Auth';
import LiveSupport from './components/LiveSupport';
import Legal from './components/Legal';
import LevelUpModal from './components/LevelUpModal';
import DailyCheckInModal from './components/DailyCheckInModal';
import { ViewState, AnalysisResult, UserStats, UserSettings, Badge, User, Challenge, DailyLog } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.AUTH);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [selectedSport, setSelectedSport] = useState('Basketball Shooting');

  // Daily Logging State
  const [currentDailyLog, setCurrentDailyLog] = useState<DailyLog | undefined>(undefined);
  const [showCheckIn, setShowCheckIn] = useState(false);

  // Gamification State - Started Fresh
  const [userStats, setUserStats] = useState<UserStats>({
    streak: 0, 
    level: 1,
    currentXP: 0,
    nextLevelXP: 500,
    title: 'Rookie',
    lifetimeAnalyses: 0,
    weaknesses: {}, // Empty initially
    consistencyGrade: '-', // Default
    badges: [],
    challenges: [
        { id: '1', title: 'First Analysis', description: 'Complete your first movement analysis', targetCount: 1, currentCount: 0, xpReward: 100, completed: false, expiresIn: '7 days' },
    ],
    goals: [] // Empty initially
  });

  const [levelUpData, setLevelUpData] = useState<{show: boolean, oldLevel: number, newLevel: number, title: string, xpGained: number} | null>(null);
  const [surpriseReward, setSurpriseReward] = useState<{show: boolean, type: string, amount: number} | null>(null);

  // Settings State
  const [userSettings, setUserSettings] = useState<UserSettings>({
      profile: { age: 24, height: 180, weight: 75, gender: 'Male', skillLevel: 'Intermediate', goal: 'Muscle Gain' },
      preferences: { 
          sport: 'Basketball', 
          difficulty: 'Intermediate', 
          sensitivity: 75, 
          voiceFeedback: true, 
          voiceName: 'Kore', 
          autoSave: true, 
          resolution: '1080p', 
          cameraFacingMode: 'user',
          autoZoom: true,
          cloudBackup: true,
          language: 'English',
          showOnLeaderboard: true,
          notifications: { email: true, push: true, tips: true }
      },
      theme: 'dark'
  });

  // Handle Theme Switching
  useEffect(() => {
    const root = document.documentElement;
    if (userSettings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [userSettings.theme]);

  const [showTour, setShowTour] = useState(false);

  // --- AUTH LOGIC ---
  const handleLogin = (loggedInUser: User, profile?: any) => {
    setUser(loggedInUser);
    if (profile) {
         setUserSettings(prev => ({
            ...prev,
            profile: {
                ...prev.profile,
                ...profile
            }
        }));
    }
    // Set view to HOME so Auth is unmounted, but show CheckIn modal on top
    setCurrentView(ViewState.HOME);
    setShowCheckIn(true);
    
    // Show tour if it's a new user (lifetime analyses is 0)
    if (loggedInUser.name && userStats.lifetimeAnalyses === 0) {
        setTimeout(() => setShowTour(true), 1000);
    }
  };

  const handleCheckInComplete = (logData: Partial<DailyLog>) => {
      // Create the log
      const newLog = logData as DailyLog;
      setCurrentDailyLog(newLog);
      setShowCheckIn(false);
      // Direct user to HOME initially as requested
      setCurrentView(ViewState.HOME);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView(ViewState.AUTH);
    setHistory([]); 
    setCurrentDailyLog(undefined);
  };

  // --- GAMIFICATION LOGIC ---
  const TITLES = [
    { level: 1, title: 'Rookie' },
    { level: 5, title: 'Amateur' },
    { level: 10, title: 'Prospect' },
    { level: 20, title: 'Semi-Pro' },
    { level: 30, title: 'Professional' },
    { level: 40, title: 'Veteran' },
    { level: 50, title: 'Elite' },
    { level: 75, title: 'Master' },
    { level: 100, title: 'Kinetic Legend' },
  ];

  const getScoreTitle = (score: number) => {
      if (score >= 95) return "Kinetic Form";
      if (score >= 85) return "Elite Motion";
      if (score >= 70) return "Solid Performance";
      if (score >= 50) return "Needs Refinement";
      return "Foundation Phase";
  };

  const getTitleForLevel = (level: number) => {
    const match = [...TITLES].reverse().find(t => level >= t.level);
    return match ? match.title : 'Rookie';
  };

  const calculateNextLevelXP = (level: number) => {
      return Math.floor(500 * Math.pow(1.2, level - 1));
  };

  const handleAnalysisComplete = (result: AnalysisResult) => {
    // Inject Fun Score Name
    result.scoreTitle = getScoreTitle(result.overallScore);
    
    setHistory(prev => [...prev, result]);
    
    // 1. Calculate XP Gained
    let xpGain = 100; // Base XP
    if (result.overallScore > 80) xpGain += 50;
    if (result.overallScore > 90) xpGain += 100;
    if (result.errors.length === 0) xpGain += 150;

    // 2. Random Surprise Reward (10% chance)
    if (Math.random() < 0.1) {
        const bonus = 500;
        xpGain += bonus;
        setSurpriseReward({ show: true, type: 'Bonus XP', amount: bonus });
        setTimeout(() => setSurpriseReward(null), 4000);
    }

    // 3. Update Stats & Check Challenges
    setUserStats(prev => {
        const newTotalXP = prev.currentXP + xpGain;
        let newLevel = prev.level;
        let nextLevelThreshold = prev.nextLevelXP;
        let leveledUp = false;

        // Level Up Logic
        while (newTotalXP >= nextLevelThreshold) {
            newLevel++;
            nextLevelThreshold = calculateNextLevelXP(newLevel) + nextLevelThreshold; 
            leveledUp = true;
        }

        const newTitle = getTitleForLevel(newLevel);

        // Badge Unlocking Logic
        const newBadges = [...prev.badges];
        if (result.overallScore >= 95 && !newBadges.find(b => b.id === 'perfectionist')) {
            newBadges.push({ id: 'perfectionist', icon: 'Crown', name: 'Perfect Form', description: 'Score 95+ on an analysis.', rarity: 'legendary' });
        }
        if (prev.lifetimeAnalyses + 1 === 5 && !newBadges.find(b => b.id === 'consistency')) {
             newBadges.push({ id: 'consistency', icon: 'Flame', name: 'Consistency King', description: 'Completed 5 sessions.', rarity: 'rare' });
        }
        if (result.injuryRiskLevel === 'Low' && !newBadges.find(b => b.id === 'safe')) {
            newBadges.push({ id: 'safe', icon: 'Shield', name: 'Injury Safe', description: 'Completed a session with Low injury risk.', rarity: 'common' });
        }
        
        // Update Challenges
        const updatedChallenges = prev.challenges.map(c => {
             if (c.id === '1') { // First Analysis
                 const newCount = Math.min(c.targetCount, c.currentCount + 1);
                 return { ...c, currentCount: newCount, completed: newCount >= c.targetCount };
             }
             return c;
        });

        // Weakness Tracking Aggregation
        const newWeaknesses = { ...prev.weaknesses };
        result.errors.forEach(err => {
            const key = err.issue.split(':')[0] || err.issue; 
            newWeaknesses[key] = (newWeaknesses[key] || 0) + 1;
        });

        if (leveledUp) {
            setLevelUpData({
                show: true,
                oldLevel: prev.level,
                newLevel: newLevel,
                title: newTitle,
                xpGained: xpGain
            });
        }

        return {
            ...prev,
            currentXP: newTotalXP, 
            nextLevelXP: nextLevelThreshold, 
            level: newLevel,
            title: newTitle,
            lifetimeAnalyses: prev.lifetimeAnalyses + 1,
            badges: newBadges,
            challenges: updatedChallenges,
            weaknesses: newWeaknesses
        };
    });
  };

  const renderView = () => {
    switch (currentView) {
      case ViewState.HOME:
        return (
            <Home 
                setView={setCurrentView} 
                setSport={setSelectedSport} 
                userStats={userStats}
                lang={userSettings.preferences.language}
                showLeaderboard={userSettings.preferences.showOnLeaderboard}
            />
        );
      case ViewState.DAILY:
        return (
            <DailyCompanion 
                settings={userSettings}
                currentLog={currentDailyLog}
                onUpdateLog={setCurrentDailyLog}
            />
        );
      case ViewState.ANALYTICS:
        return <Dashboard history={history} userStats={userStats} dailyLog={currentDailyLog} />;
      case ViewState.ANALYZER:
        return (
          <Analyzer 
            onAnalyzeComplete={handleAnalysisComplete} 
            selectedSport={selectedSport} 
            onSportChange={setSelectedSport} 
            userStats={userStats}
            userSettings={userSettings}
            sessionHistory={history}
            onExit={() => setCurrentView(ViewState.HOME)}
          />
        );
      case ViewState.SETTINGS:
        return <Settings settings={userSettings} onSettingsChange={setUserSettings} lang={userSettings.preferences.language} />;
      case ViewState.ABOUT:
        return <About lang={userSettings.preferences.language} />;
      default:
        return (
            <Home 
                setView={setCurrentView} 
                setSport={setSelectedSport} 
                userStats={userStats}
                lang={userSettings.preferences.language}
                showLeaderboard={userSettings.preferences.showOnLeaderboard}
            />
        );
    }
  };

  // Force Auth View if not logged in
  if (currentView === ViewState.AUTH) {
      return (
        <div className="bg-background min-h-screen text-gray-900 dark:text-gray-100 font-sans selection:bg-primary/30">
           <Auth onLogin={handleLogin} />
           <LiveSupport />
           {(currentView === ViewState.LEGAL_PRIVACY || currentView === ViewState.LEGAL_TERMS) && (
              <Legal view={currentView} onClose={() => setCurrentView(ViewState.AUTH)} />
           )}
        </div>
      );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden text-gray-900 dark:text-gray-100 font-sans selection:bg-primary/30 transition-colors duration-300">
      <Navbar 
        currentView={currentView} 
        setView={setCurrentView} 
        user={user} 
        onLogout={handleLogout}
        lang={userSettings.preferences.language} 
      />
      <main className="flex-1 ml-20 md:ml-72 h-full overflow-y-auto relative bg-[#f4f4f5] dark:bg-[#09090b] flex flex-col transition-colors duration-300">
        <div className="max-w-[1600px] mx-auto min-h-full flex flex-col w-full">
            <div className="flex-1">
                {renderView()}
            </div>
            <div className="w-full py-8 mt-12 border-t border-gray-300 dark:border-gray-800 bg-white/50 dark:bg-black/20">
                <div className="px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
                    <div className="flex gap-6">
                        <button onClick={() => setCurrentView(ViewState.LEGAL_PRIVACY)} className="hover:text-black dark:hover:text-white transition-colors">Privacy Policy</button>
                        <button onClick={() => setCurrentView(ViewState.LEGAL_TERMS)} className="hover:text-black dark:hover:text-white transition-colors">Terms of Service</button>
                    </div>
                    <div className="flex gap-6 items-center">
                        <span className="opacity-70">v3.2.0 Kinetic</span>
                        <span>© 2025 Kinetic MotionAI</span>
                    </div>
                </div>
            </div>
        </div>
      </main>
      
      {/* Daily Check In Modal */}
      {showCheckIn && (
          <DailyCheckInModal onComplete={handleCheckInComplete} username={user?.name || 'Athlete'} />
      )}

      {/* Level Up Modal Overlay */}
      {levelUpData?.show && (
          <LevelUpModal 
              oldLevel={levelUpData.oldLevel} 
              newLevel={levelUpData.newLevel} 
              title={levelUpData.title} 
              xpGained={levelUpData.xpGained}
              onClose={() => setLevelUpData(null)} 
          />
      )}

      {/* Surprise Reward Toast */}
      {surpriseReward && (
          <div className="fixed top-10 right-10 z-[120] animate-in slide-in-from-right fade-in duration-500">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-1 rounded-2xl shadow-[0_0_30px_rgba(250,204,21,0.5)]">
                  <div className="bg-black/90 px-6 py-4 rounded-xl flex items-center gap-4">
                      <div className="bg-yellow-400/20 p-2 rounded-full">
                          <img src="https://em-content.zobj.net/source/microsoft-teams/363/party-popper_1f389.png" className="w-8 h-8" alt="Party" />
                      </div>
                      <div>
                          <h4 className="font-black text-yellow-400 uppercase italic tracking-widest text-sm">Surprise Reward!</h4>
                          <p className="text-white font-bold text-lg">+{surpriseReward.amount} XP Bonus</p>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <LiveSupport />
      {(currentView === ViewState.LEGAL_PRIVACY || currentView === ViewState.LEGAL_TERMS) && (
          <Legal view={currentView} onClose={() => setCurrentView(ViewState.HOME)} />
      )}
      
      {/* Onboarding Tour Overlay */}
      {showTour && !showCheckIn && (
          <TourOverlay onClose={() => setShowTour(false)} />
      )}
    </div>
  );
};

const TourOverlay = ({ onClose }: { onClose: () => void }) => {
    const [step, setStep] = useState(0);
    
    const steps = [
        { 
            title: 'Navigation Hub', 
            text: 'Access your Dashboard, AI Analyzer, and Analytics from here.',
            position: 'left-24 top-20'
        },
        { 
            title: 'AI Motion Analyzer', 
            text: 'The core feature. Analyze your form in real-time or upload videos.',
            position: 'left-24 top-32'
        },
        { 
            title: 'Daily Companion', 
            text: 'Track your recovery, meals, and daily goals here.',
            position: 'left-24 top-44'
        }
    ];

    const currentStep = steps[step];

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 pointer-events-auto">
            <div className={`absolute ${currentStep.position} bg-white dark:bg-surface p-6 rounded-2xl shadow-2xl max-w-xs border border-primary/20 animate-in zoom-in slide-in-from-left-4 duration-300`}>
                <div className="absolute -left-2 top-6 w-4 h-4 bg-white dark:bg-surface transform rotate-45 border-l border-b border-primary/20"></div>
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{currentStep.title}</h3>
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">{step + 1}/{steps.length}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                    {currentStep.text}
                </p>
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white px-3 py-2">Skip</button>
                    <button onClick={handleNext} className="bg-primary hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg shadow-orange-500/20 transition-all transform hover:scale-105">
                        {step === steps.length - 1 ? 'Get Started' : 'Next'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default App;