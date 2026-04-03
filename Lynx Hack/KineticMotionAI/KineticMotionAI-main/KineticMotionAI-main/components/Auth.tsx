import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { Mail, Lock, User as UserIcon, ArrowRight, Activity, Zap, Camera, Fingerprint, ShieldCheck, AlertCircle } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User, profile?: any) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // Profile Picture State
  const [avatar, setAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile State
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [gender, setGender] = useState('Male');
  const [skillLevel, setSkillLevel] = useState('Intermediate');

  // Verification & Loading State
  const [isLoading, setIsLoading] = useState(false);
  const [isRobotVerified, setIsRobotVerified] = useState(false);
  const [captchaOpen, setCaptchaOpen] = useState(false);
  const [captchaStep, setCaptchaStep] = useState(0); // 0 to 3
  const [captchaGrid, setCaptchaGrid] = useState<string[]>([]);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Password Requirements
  const passwordRequirements = [
      { id: 'length', label: '8+ Chars', regex: /.{8,}/ },
      { id: 'upper', label: 'Uppercase', regex: /[A-Z]/ },
      { id: 'lower', label: 'Lowercase', regex: /[a-z]/ },
      { id: 'number', label: 'Number', regex: /[0-9]/ },
      { id: 'special', label: 'Special', regex: /[^A-Za-z0-9]/ },
  ];

  const isPasswordValid = (pwd: string) => {
      return passwordRequirements.every(req => req.regex.test(pwd));
  };

  // Clear state on mode switch
  useEffect(() => {
    setPassword('');
    setEmailError('');
    setPasswordError('');
    setIsRobotVerified(false); 
    setCaptchaOpen(false);
    setCaptchaStep(0);
  }, [isLogin]);

  // Generate random grid when captcha opens or step changes
  useEffect(() => {
    if (captchaOpen && !isRobotVerified) {
        generateCaptchaGrid();
    }
  }, [captchaOpen, captchaStep]);

  const generateCaptchaGrid = () => {
      const distractors = ['🐱', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸'];
      // Pick 3 random distractors
      const selected = [];
      const tempDistractors = [...distractors];
      for(let i=0; i<3; i++) {
          const idx = Math.floor(Math.random() * tempDistractors.length);
          selected.push(tempDistractors[idx]);
          tempDistractors.splice(idx, 1);
      }
      // Add the dog
      selected.push('🐶');
      // Shuffle
      for (let i = selected.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [selected[i], selected[j]] = [selected[j], selected[i]];
      }
      setCaptchaGrid(selected);
  };

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setEmail(val);
      if (val && !isValidEmail(val)) {
          setEmailError("Please enter a valid email address.");
      } else {
          setEmailError("");
      }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = (ev) => {
              if (ev.target?.result) {
                  setAvatar(ev.target.result as string);
              }
          };
          reader.readAsDataURL(e.target.files[0]);
      }
  };

  const handleCaptchaSelection = (emoji: string) => {
      if (emoji === '🐶') {
          if (captchaStep < 2) {
              // Move to next step
              setCaptchaStep(prev => prev + 1);
          } else {
              // Success
              setIsRobotVerified(true);
              setCaptchaOpen(false);
          }
      } else {
          // Failed
          alert("Incorrect. Verification failed. Please try again.");
          setCaptchaStep(0);
          setCaptchaOpen(false);
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) return setEmailError("Invalid email format.");
    if (!isLogin && !isPasswordValid(password)) return setPasswordError("Please meet all password requirements.");
    if (!isRobotVerified) return;

    setIsLoading(true);

    setTimeout(() => {
      const userData: User = {
        name: name || email.split('@')[0],
        email: email,
        avatar: avatar || undefined
      };

      const profileData = !isLogin ? {
        age: parseInt(age) || 24,
        height: parseInt(height) || 180,
        weight: parseInt(weight) || 75,
        gender,
        skillLevel
      } : undefined;

      onLogin(userData, profileData);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] -mr-48 -mt-48 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] -ml-24 -mb-24 pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="text-center mb-8">
           <div className="inline-flex items-center justify-center w-20 h-20 mb-6 relative group">
               <div className="absolute inset-0 bg-primary/30 rounded-2xl blur-xl group-hover:bg-primary/50 transition-all duration-500"></div>
               <div className="relative w-full h-full bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-black border border-gray-200 dark:border-gray-700 rounded-2xl flex items-center justify-center shadow-2xl">
                    <Zap size={48} className="text-primary fill-primary/10 stroke-[2px]" />
                    <Activity size={24} className="absolute text-gray-900 dark:text-white stroke-[3px]" />
               </div>
           </div>
           
           <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter mb-2">
             KINETIC<span className="text-primary">MOTION</span>
           </h1>
           <p className="text-gray-500 dark:text-gray-400 font-medium tracking-wide">Move to Improve</p>
        </div>

        <div className="bg-white dark:bg-surface border border-gray-200 dark:border-gray-800 p-8 rounded-3xl shadow-2xl backdrop-blur-sm">
           <div className="flex gap-4 mb-8 border-b border-gray-200 dark:border-gray-800 pb-1">
             <button onClick={() => setIsLogin(true)} className={`flex-1 pb-3 text-sm font-bold transition-colors ${isLogin ? 'text-gray-900 dark:text-white border-b-2 border-primary' : 'text-gray-500'}`}>Sign In</button>
             <button onClick={() => setIsLogin(false)} className={`flex-1 pb-3 text-sm font-bold transition-colors ${!isLogin ? 'text-gray-900 dark:text-white border-b-2 border-primary' : 'text-gray-500'}`}>Create Account</button>
           </div>

           <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                  <div className="flex justify-center mb-6 animate-in fade-in zoom-in">
                      <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                          <div className={`w-24 h-24 rounded-full border-2 flex items-center justify-center overflow-hidden transition-all ${avatar ? 'border-primary' : 'border-dashed border-gray-400 dark:border-gray-600 group-hover:border-gray-900 dark:group-hover:border-white bg-gray-100 dark:bg-black/40'}`}>
                              {avatar ? <img src={avatar} alt="Avatar" className="w-full h-full object-cover" /> : <Camera className="text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white" size={24} />}
                          </div>
                          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
                      </div>
                  </div>
              )}

              {!isLogin && (
                  <div className="space-y-1 animate-in fade-in slide-in-from-bottom-2">
                      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Username</label>
                      <div className="relative">
                          <UserIcon className="absolute left-4 top-3.5 text-gray-500" size={18} />
                          <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-700 rounded-xl py-3 pl-11 pr-4 text-gray-900 dark:text-white focus:border-primary focus:outline-none transition-colors" placeholder="John Doe" />
                      </div>
                  </div>
              )}

              <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Email</label>
                  <div className="relative">
                      <Mail className="absolute left-4 top-3.5 text-gray-500" size={18} />
                      <input type="email" required value={email} onChange={handleEmailChange} className={`w-full bg-gray-50 dark:bg-black/50 border rounded-xl py-3 pl-11 pr-4 text-gray-900 dark:text-white focus:outline-none transition-colors ${emailError ? 'border-red-500 focus:border-red-500' : 'border-gray-200 dark:border-gray-700 focus:border-primary'}`} placeholder="athlete@example.com" />
                  </div>
                  {emailError && <p className="text-red-500 text-[10px] ml-1 flex items-center gap-1"><AlertCircle size={10} /> {emailError}</p>}
              </div>

              <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Password</label>
                  <div className="relative">
                      <Lock className="absolute left-4 top-3.5 text-gray-500" size={18} />
                      <input 
                        type="password" 
                        required 
                        value={password} 
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setPasswordError('');
                        }}
                        onFocus={() => setPasswordFocused(true)}
                        // onBlur={() => setPasswordFocused(false)} // Keep focused to show requirements if invalid
                        className={`w-full bg-gray-50 dark:bg-black/50 border rounded-xl py-3 pl-11 pr-4 text-gray-900 dark:text-white focus:outline-none transition-colors ${passwordError ? 'border-red-500 focus:border-red-500' : 'border-gray-200 dark:border-gray-700 focus:border-primary'}`} 
                        placeholder="••••••••" 
                      />
                  </div>

                  {/* Password Requirements Checklist */}
                  {!isLogin && (passwordFocused || password.length > 0) && (
                      <div className="grid grid-cols-3 gap-2 mt-2 px-1 animate-in fade-in slide-in-from-top-2">
                          {passwordRequirements.map((req) => {
                              const met = req.regex.test(password);
                              return (
                                  <div key={req.id} className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${met ? 'text-green-500' : 'text-gray-400'}`}>
                                      <div className={`w-1.5 h-1.5 rounded-full ${met ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'}`}></div>
                                      {req.label}
                                  </div>
                              );
                          })}
                      </div>
                  )}
                  
                  {passwordError && <p className="text-red-500 text-[10px] ml-1 flex items-center gap-1"><AlertCircle size={10} /> {passwordError}</p>}
              </div>

              {/* ENHANCED AI CAPTCHA */}
              <div className="pt-2">
                  {!isRobotVerified ? (
                      <div className="bg-gray-100 dark:bg-black/30 border border-gray-200 dark:border-gray-700 rounded-xl p-4 relative overflow-hidden">
                          {!captchaOpen ? (
                              <button type="button" onClick={() => setCaptchaOpen(true)} className="w-full flex items-center justify-between text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white group">
                                  <div className="flex items-center gap-3">
                                      <div className="relative">
                                          <Fingerprint size={24} className="text-primary group-hover:scale-110 transition-transform" />
                                          <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full animate-pulse"></div>
                                      </div>
                                      <div className="text-left">
                                          <span className="block text-sm font-bold">Biometric Verification</span>
                                          <span className="text-[10px] text-gray-500 uppercase tracking-wider">Click to Scan</span>
                                      </div>
                                  </div>
                                  <div className="w-5 h-5 border-2 border-gray-400 dark:border-gray-500 rounded sm:rounded-md group-hover:border-primary transition-colors"></div>
                              </button>
                          ) : (
                              <div className="animate-in fade-in relative">
                                  {/* Scanning Overlay */}
                                  <div className="absolute inset-0 pointer-events-none z-0 opacity-10">
                                      <div className="w-full h-full bg-[linear-gradient(transparent_0%,#f97316_50%,transparent_100%)] bg-[length:100%_200%] animate-scan"></div>
                                  </div>

                                  <p className="text-center text-sm font-bold text-gray-900 dark:text-white mb-2 relative z-10">
                                      Identify Subject: <span className="text-primary uppercase tracking-wider">Dog</span> 🐶
                                  </p>
                                  <p className="text-center text-[10px] text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-widest relative z-10">
                                      Analysis Sequence {captchaStep + 1}/3
                                  </p>
                                  <div className="grid grid-cols-4 gap-2 relative z-10">
                                      {captchaGrid.map((emoji, index) => (
                                          <button 
                                            key={index} 
                                            type="button" 
                                            onClick={() => handleCaptchaSelection(emoji)} 
                                            className="text-2xl p-2 bg-gray-200 dark:bg-black/60 hover:bg-primary/20 rounded-lg transition-all border border-transparent hover:border-primary/50 transform hover:scale-105 active:scale-95"
                                          >
                                              {emoji}
                                          </button>
                                      ))}
                                  </div>
                              </div>
                          )}
                      </div>
                  ) : (
                      <div className="w-full py-4 rounded-xl border-2 border-primary bg-primary/10 text-primary flex items-center justify-center gap-2 animate-in zoom-in">
                          <ShieldCheck size={20} />
                          <span className="font-bold text-sm uppercase tracking-widest">Identity Verified</span>
                      </div>
                  )}
              </div>

              <button 
                type="submit"
                disabled={isLoading || !isRobotVerified || !!emailError}
                className={`w-full font-bold py-3.5 rounded-xl transition-all shadow-lg mt-6 flex items-center justify-center gap-2 group ${
                    isLoading || !isRobotVerified || !!emailError
                    ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed shadow-none' 
                    : 'bg-primary hover:bg-orange-400 text-white dark:text-black shadow-orange-900/20'
                }`}
              >
                  {isLoading ? 'Processing...' : (isLogin ? 'Access Dashboard' : 'Join Team')}
                  {!isLoading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
              </button>
           </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;