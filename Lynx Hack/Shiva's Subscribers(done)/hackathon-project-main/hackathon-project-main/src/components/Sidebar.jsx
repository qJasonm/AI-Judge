import React from 'react';
import { NavLink } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';

export default function Sidebar() {
  const navLinks = [
    { to: '/scan', icon: <LucideIcons.Search size={20} />, label: 'Scanner' },
    { to: '/dashboard', icon: <LucideIcons.BarChart2 size={20} />, label: 'Analytics' },
    { to: '/alternatives', icon: <LucideIcons.Sparkles size={20} />, label: 'AI Sweeps' },
  ];

  return (
    <aside className="w-64 h-screen bg-[#0d1117] border-r border-white/5 flex flex-col pt-8 pb-6 px-4 shrink-0 hidden md:flex sticky top-0 justify-between z-40">
       <div>
         <div className="flex items-center gap-3 px-2 mb-12">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00f2fe] to-[#4facfe] flex items-center justify-center text-black">
               <LucideIcons.Activity size={24} strokeWidth={3} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">SubSave</h1>
         </div>
         
         <nav className="flex flex-col gap-2">
            {navLinks.map(link => (
              <NavLink 
                key={link.to} 
                to={link.to}
                className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition ${isActive ? 'bg-white/10 text-white font-semibold' : 'text-gray-400 hover:bg-white/5 hover:text-white font-medium'}`}
              >
                 {link.icon} {link.label}
              </NavLink>
            ))}
         </nav>
       </div>
       
       <div className="px-4 py-4 rounded-xl bg-white/5 border border-white/10 mt-auto">
          <div className="flex items-center gap-3 mb-2">
             <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400"><LucideIcons.User size={16} /></div>
             <div>
                <p className="text-sm font-semibold leading-tight">Hackathon User</p>
                <p className="text-xs text-gray-500">Pro Tier</p>
             </div>
          </div>
       </div>
    </aside>
  );
}
