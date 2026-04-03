import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as LucideIcons from 'lucide-react';

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hey there! I am your SubSave AI. I am scanning your data right now. Need any financial advice?' }
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
       const res = await fetch('http://localhost:3001/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: input })
       });
       const data = await res.json();
       setMessages(prev => [...prev, { role: 'ai', text: data.text }]);
    } catch (error) {
       console.error(error);
       setMessages(prev => [...prev, { role: 'ai', text: 'Oops! Cannot connect to my brain. Is the server running?' }]);
    } finally {
       setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-[#00f2fe] to-[#4facfe] flex items-center justify-center text-black shadow-[0_0_30px_rgba(0,242,254,0.4)] z-50 hover:scale-105 transition active:scale-95"
      >
        {isOpen ? <LucideIcons.X size={28} /> : <LucideIcons.MessageSquare size={28} />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 right-6 w-[380px] h-[500px] bg-[#161b22] border border-[#00f2fe]/30 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-white/10 bg-gradient-to-r from-black/50 to-transparent flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-[#00f2fe]/10 flex items-center justify-center text-[#00f2fe]">
                  <LucideIcons.Sparkles size={20} />
               </div>
               <div>
                  <h3 className="font-bold text-white leading-tight">SubSave AI Assist</h3>
                  <p className="text-xs text-[#00f2fe] flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#00f2fe] animate-pulse"></span> Online</p>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
               {messages.map((msg, i) => (
                  <div key={i} className={`max-w-[85%] p-3 rounded-2xl text-[14px] leading-relaxed ${msg.role === 'ai' ? 'self-start bg-white/5 border border-white/5 rounded-tl-sm text-gray-200' : 'self-end bg-[#00f2fe]/20 border border-[#00f2fe]/30 rounded-tr-sm text-[#00f2fe]'}`}>
                     {msg.text}
                  </div>
               ))}
               {loading && (
                  <div className="self-start p-4 rounded-2xl bg-white/5 border border-white/5 rounded-tl-sm flex gap-1 items-center">
                     <motion.div animate={{y:[0,-5,0]}} transition={{repeat:Infinity,duration:0.6}} className="w-1.5 h-1.5 bg-[#00f2fe] rounded-full"></motion.div>
                     <motion.div animate={{y:[0,-5,0]}} transition={{repeat:Infinity,duration:0.6,delay:0.2}} className="w-1.5 h-1.5 bg-[#00f2fe] rounded-full"></motion.div>
                     <motion.div animate={{y:[0,-5,0]}} transition={{repeat:Infinity,duration:0.6,delay:0.4}} className="w-1.5 h-1.5 bg-[#00f2fe] rounded-full"></motion.div>
                  </div>
               )}
            </div>

            <form onSubmit={handleSend} className="p-3 border-t border-white/10 bg-black/20 flex gap-2">
               <input 
                 autoFocus
                 type="text"
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-[#4facfe] transition text-white"
                 placeholder="Ask about your spending..." 
               />
               <button type="submit" disabled={!input.trim()} className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#00f2fe] to-[#4facfe] text-black flex items-center justify-center hover:opacity-90 disabled:opacity-50">
                  <LucideIcons.Send size={16} />
               </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
