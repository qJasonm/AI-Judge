
export enum ViewState {
  AUTH = 'AUTH',
  PRICING = 'PRICING',
  HOME = 'HOME',
  DAILY = 'DAILY',
  ANALYTICS = 'ANALYTICS',
  ANALYZER = 'ANALYZER',
  SETTINGS = 'SETTINGS',
  ABOUT = 'ABOUT',
  LEGAL_PRIVACY = 'LEGAL_PRIVACY',
  LEGAL_TERMS = 'LEGAL_TERMS',
}

export type Tier = 'Basic' | 'Intermediate' | 'Pro';

export interface User {
  name: string;
  email: string;
  tier?: Tier;
  avatar?: string;
}

export interface Badge {
    id: string;
    icon: string;
    name: string;
    description: string;
    unlockedAt?: string;
    rarity?: 'common' | 'rare' | 'legendary';
}

export interface Challenge {
    id: string;
    title: string;
    description: string;
    targetCount: number;
    currentCount: number;
    xpReward: number;
    completed: boolean;
    expiresIn: string; // e.g. "2 days"
}

export interface Goal {
    id: string;
    title: string; 
    category: 'Strength' | 'Technique' | 'Safety' | 'Consistency';
    metric: 'Score' | 'Risk' | 'Symmetry' | 'Frequency';
    targetValue: number;
    currentValue: number;
    unit: string;
    completed: boolean;
}

export interface Meal {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    description: string;
    timing: 'Breakfast' | 'Lunch' | 'Dinner' | 'Pre-Workout' | 'Post-Workout' | 'Snack';
}

export interface AgendaItem {
    id: string;
    text: string;
    completed: boolean;
    time?: string;
    category: 'workout' | 'focus' | 'recovery' | 'nutrition' | 'other';
}

export interface DailyLog {
    date: string; // ISO String YYYY-MM-DD
    readinessScore: number; // Calculated 0-100
    sleepHours: number;
    hydrationCups: number; // 1 cup = 250ml
    soreness: number; // 1-10
    energy: number; // 1-10
    trainingIntensity?: number; // Recommended vs Actual
    mobilityChecked: boolean;
    warmupChecked: boolean;
    macros: {
        protein: number;
        water: number; // Liters
        calories: number;
    };
    agenda: AgendaItem[];
    notes?: string; 
}

export interface UserStats {
  streak: number;
  level: number;
  currentXP: number;
  nextLevelXP: number;
  title: string;
  badges: Badge[];
  lifetimeAnalyses: number;
  challenges: Challenge[];
  goals: Goal[];
  weaknesses: Record<string, number>; // e.g. { "Knee Valgus": 5 }
  consistencyGrade: 'S' | 'A' | 'B' | 'C' | 'D';
}

export interface JointAngle {
  joint: string;
  angle: number;
  target: string;
  status: 'optimal' | 'warning' | 'critical';
}

export interface AnalysisResult {
  sport: string;
  timestamp: string;
  overallScore: number;
  scoreTitle?: string; 
  postureScore: number;
  balanceScore: number;
  powerScore: number;
  symmetryScore?: number;
  explosivenessScore?: number;
  injuryRiskScore: number;
  injuryRiskLevel: 'Low' | 'Medium' | 'High';
  errors: AnalysisError[];
  feedback: string;
  detailedAnalysis: string;
  technicalBreakdown: string;
  kinematicChain: string;
  jointAngles: JointAngle[];
  jointStress?: Record<string, number>; // 0-100 stress level per joint
  comparisonFeedback?: string;
  groundingUrls?: { title: string; uri: string }[];
  videoQueries?: string[];
  drills: string[];
  badges: string[];
  isCached?: boolean;
  audioBase64?: string;
  referenceImageBase64?: string;
}

export interface AnalysisError {
  joint: string;
  issue: string;
  correction: string;
  severity: 'Low' | 'Medium' | 'High';
}

export interface MicroLesson {
    id: string;
    title: string;
    content: string;
    icon: string;
}

export interface UserSettings {
  profile: {
    age: number;
    height: number;
    weight: number;
    gender: 'Male' | 'Female' | 'Other';
    skillLevel: 'Beginner' | 'Intermediate' | 'Elite';
    goal?: 'Muscle Gain' | 'Fat Loss' | 'Endurance' | 'Maintenance' | 'Performance';
  };
  preferences: {
    sport: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Elite';
    sensitivity: number;
    voiceFeedback: boolean;
    voiceName: string; 
    autoSave: boolean;
    resolution: '720p' | '1080p' | '4K';
    cameraFacingMode: 'user' | 'environment';
    autoZoom: boolean;
    cloudBackup: boolean;
    language: string;
    smartRecovery: boolean; // NEW: Enable/Disable Smart Recovery logic
    focusMode: boolean; // NEW: Enable Focus Mode features
    notifications: {
        email: boolean;
        push: boolean;
        tips: boolean;
        hydration: boolean; // NEW
        recovery: boolean; // NEW
    };
  };
  theme: 'dark' | 'light';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}
