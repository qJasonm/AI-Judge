import React from 'react';
import { ViewState, User } from '../types';
import { Activity, BarChart2, Settings, Home, Info, User as UserIcon, LogOut, Hexagon, CalendarClock } from 'lucide-react';
import { t } from '../utils/translations';

interface NavbarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  user?: User | null;
  onLogout?: () => void;
  lang: string;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, setView, user, onLogout, lang }) => {
  const navItems = [
    { id: ViewState.HOME, label: t('nav_home', lang), icon: Home },
    { id: ViewState.DAILY, label: "Daily Hub", icon: CalendarClock },
    { id: ViewState.ANALYZER, label: t('nav_analyzer', lang), icon: Activity },
    { id: ViewState.ANALYTICS, label: t('nav_analytics', lang), icon: BarChart2 },
    { id: ViewState.SETTINGS, label: t('nav_settings', lang), icon: Settings },
    { id: ViewState.ABOUT, label: t('nav_about', lang), icon: Info },
  ];

  return (
    <nav className="fixed left-0 top-0 h-screen w-20 md:w-72 bg-surface border-r border-gray-800 flex flex-col justify-between py-6 z-50 transition-all duration-300">
      {/* Logo Area */}
      <div className="px-4 md:px-8 mb-8">
        <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setView(ViewState.HOME)}>
            <div className="relative w-12 h-12 shrink-0">
                <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg group-hover:bg-primary/40 transition-all duration-500"></div>
                <div className="relative w-full h-full bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-xl flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <Hexagon size={28} className="text-primary fill-primary/10 stroke-[2.5px] transform group-hover:rotate-180 transition-transform duration-700 ease-out" />
                    <Activity size={16} className="absolute text-white stroke-[3px]" />
                </div>
            </div>
            <div className="hidden md:block">
                <h1 className="text-2xl font-black text-white tracking-tighter leading-none group-hover:tracking-normal transition-all duration-300">
                    KINETIC<span className="text-primary">MOTION</span>
                </h1>
                <div className="flex flex-col mt-1.5">
                    <div className="h-0.5 w-6 bg-primary rounded-full mb-1"></div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase leading-tight max-w-[180px]">Move to Improve</p>
                </div>
            </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 md:px-4 space-y-2 overflow-y-auto scrollbar-hide">
        <p className="hidden md:block px-4 text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 mt-4">Menu</p>
        {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
                <button
                    key={item.id}
                    onClick={() => setView(item.id)}
                    className={`w-full flex items-center gap-4 px-3 md:px-4 py-3.5 rounded-xl transition-all group relative ${
                        isActive 
                        ? 'bg-primary text-black font-bold shadow-[0_0_20px_rgba(217,70,239,0.4)]' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <item.icon size={22} className={`transition-colors ${isActive ? 'text-black' : 'group-hover:text-primary'}`} />
                    <span className={`hidden md:block text-sm ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
                    
                    {/* Active Indicator for Mobile */}
                    {isActive && <div className="md:hidden absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-black/20 rounded-r-full" />}
                </button>
            );
        })}
      </div>

      {/* User / Footer */}
      <div className="px-3 md:px-4 mt-auto">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-gray-900 to-black border border-gray-800 group cursor-pointer hover:border-gray-700 transition-colors relative overflow-hidden">
             <div className="flex items-center gap-3 relative z-10">
                 <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 border border-gray-700 overflow-hidden">
                     {user?.avatar ? (
                         <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
                     ) : (
                         <UserIcon size={20} />
                     )}
                 </div>
                 <div className="hidden md:block text-left">
                     <p className="text-sm font-bold text-white truncate max-w-[120px]">{user?.name || 'Guest User'}</p>
                     <p className="text-xs text-primary font-medium">{user?.tier || 'Free Tier'}</p>
                 </div>
                 {onLogout && (
                     <button onClick={onLogout} className="ml-auto text-gray-500 hover:text-white hidden md:block">
                         <LogOut size={16} />
                     </button>
                 )}
             </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;