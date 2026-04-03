import React, { useState } from 'react';
import { UserSettings } from '../types';
import { User, Activity, Smartphone, Database, Moon, Sun, Mic, Brain, Bell, Eye, Maximize, Droplets } from 'lucide-react';
import { t } from '../utils/translations';

interface SettingsProps {
  settings: UserSettings;
  onSettingsChange: (newSettings: UserSettings) => void;
  lang: string;
}

const Settings: React.FC<SettingsProps> = ({ settings, onSettingsChange, lang }) => {
  const [activeTab, setActiveTab] = useState('profile');

  const handleChange = (section: keyof UserSettings, key: string, value: any) => {
    onSettingsChange({
        ...settings,
        [section]: {
            ...settings[section as keyof UserSettings] as object,
            [key]: value
        }
    });
  };

  return (
    <div className="p-6 md:p-8 pb-24 max-w-5xl mx-auto animate-fade-in">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">{t('settings_title', lang)}</h1>
        
        <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-64 space-y-2">
                <TabButton id="profile" icon={User} label={t('tab_profile', lang)} active={activeTab} set={setActiveTab} />
                <TabButton id="preferences" icon={Activity} label="Performance" active={activeTab} set={setActiveTab} />
                <TabButton id="notifications" icon={Bell} label="Notifications" active={activeTab} set={setActiveTab} />
                <TabButton id="device" icon={Smartphone} label={t('tab_device', lang)} active={activeTab} set={setActiveTab} />
                <TabButton id="data" icon={Database} label={t('tab_privacy', lang)} active={activeTab} set={setActiveTab} />
            </div>

            <div className="flex-1 bg-white dark:bg-surface border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-xl transition-colors duration-300">
                {activeTab === 'profile' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2"><User size={20} className="text-primary"/> {t('athlete_profile', lang)}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputGroup label="Age" value={settings.profile.age} onChange={(v) => handleChange('profile', 'age', parseInt(v))} type="number" />
                            <InputGroup label="Weight (kg)" value={settings.profile.weight} onChange={(v) => handleChange('profile', 'weight', parseInt(v))} type="number" />
                            <InputGroup label="Height (cm)" value={settings.profile.height} onChange={(v) => handleChange('profile', 'height', parseInt(v))} type="number" />
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Goal</label>
                                <select value={settings.profile.goal} onChange={(e) => handleChange('profile', 'goal', e.target.value)} className="bg-gray-100 dark:bg-black/40 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:border-primary focus:outline-none appearance-none">
                                    <option>Muscle Gain</option>
                                    <option>Fat Loss</option>
                                    <option>Endurance</option>
                                    <option>Performance</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-widest">Appearance</h3>
                            <div className="flex bg-gray-100 dark:bg-black/40 p-1.5 rounded-xl inline-flex border border-gray-300 dark:border-gray-700">
                                <button onClick={() => onSettingsChange({...settings, theme: 'light'})} className={`px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-all ${settings.theme === 'light' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}><Sun size={14} /> Light</button>
                                <button onClick={() => onSettingsChange({...settings, theme: 'dark'})} className={`px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-all ${settings.theme === 'dark' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-white'}`}><Moon size={14} /> Dark</button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'preferences' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2"><Brain size={20} className="text-primary"/> Performance Intelligence</h2>
                        <div className="space-y-6">
                            <ToggleItem 
                                label="Smart Recovery Logic" 
                                desc="Dynamically suggest rest days based on readiness score." 
                                icon={Activity} 
                                checked={settings.preferences.smartRecovery} 
                                onChange={(v) => handleChange('preferences', 'smartRecovery', v)} 
                            />
                             <ToggleItem 
                                label="Focus Mode Features" 
                                desc="Enable distraction-free training views." 
                                icon={Maximize} 
                                checked={settings.preferences.focusMode} 
                                onChange={(v) => handleChange('preferences', 'focusMode', v)} 
                            />
                            <ToggleItem 
                                label="Voice Coaching" 
                                desc="Real-time audio feedback during analysis." 
                                icon={Mic} 
                                checked={settings.preferences.voiceFeedback} 
                                onChange={(v) => handleChange('preferences', 'voiceFeedback', v)} 
                            />
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-sm font-bold text-gray-900 dark:text-white">Analysis Sensitivity</label>
                                    <span className="text-primary font-bold">{settings.preferences.sensitivity}%</span>
                                </div>
                                <input type="range" min="0" max="100" value={settings.preferences.sensitivity} onChange={(e) => handleChange('preferences', 'sensitivity', parseInt(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"/>
                            </div>
                        </div>
                    </div>
                )}
                
                {activeTab === 'notifications' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Bell size={20} className="text-primary"/> Smart Notifications</h2>
                        <div className="space-y-4">
                            <ToggleItem label="Hydration Reminders" desc="Notify when hydration is low based on activity." icon={Droplets} checked={settings.preferences.notifications.hydration} onChange={(v) => handleChange('preferences', 'notifications', {...settings.preferences.notifications, hydration: v})} />
                            <ToggleItem label="Recovery Alerts" desc="Alerts for high strain/low readiness days." icon={Activity} checked={settings.preferences.notifications.recovery} onChange={(v) => handleChange('preferences', 'notifications', {...settings.preferences.notifications, recovery: v})} />
                            <ToggleItem label="Daily Tips" desc="Training motivation and tips." icon={Brain} checked={settings.preferences.notifications.tips} onChange={(v) => handleChange('preferences', 'notifications', {...settings.preferences.notifications, tips: v})} />
                        </div>
                    </div>
                )}
                
                {activeTab === 'device' && <div className="text-gray-500 italic">Device configurations...</div>}
                {activeTab === 'data' && <div className="text-gray-500 italic">Privacy and Data export options...</div>}
            </div>
        </div>
    </div>
  );
};

const TabButton = ({ id, icon: Icon, label, active, set }: any) => (
    <button onClick={() => set(id)} className={`w-full flex items-center gap-3 px-6 py-4 rounded-xl transition-all ${active === id ? 'bg-primary text-white dark:text-black font-bold shadow-lg' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}`}>
        <Icon size={18} /><span className="text-sm">{label}</span>{active === id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white dark:bg-black"></div>}
    </button>
);

const InputGroup = ({ label, value, onChange, type = "text" }: any) => (
    <div className="flex flex-col gap-2"><label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{label}</label><input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="bg-gray-100 dark:bg-black/40 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:border-primary focus:outline-none transition-colors"/></div>
);

const ToggleItem = ({ label, desc, icon: Icon, checked, onChange }: any) => (
    <div className="p-4 bg-gray-50 dark:bg-black/40 rounded-2xl border border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div><h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Icon size={16} className="text-primary" /> {label}</h3><p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{desc}</p></div>
        <button onClick={() => onChange(!checked)} className={`w-12 h-7 rounded-full p-1 transition-colors ${checked ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-700'}`}><div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} /></button>
    </div>
);

export default Settings;