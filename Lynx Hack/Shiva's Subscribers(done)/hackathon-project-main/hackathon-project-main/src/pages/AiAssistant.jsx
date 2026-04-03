import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AiAssistant() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hey there! I am your SubSave AI. I just scanned your exported transactions. You can ask me how to save more money or view a breakdown of your spending.' }
  ]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
       setMessages(prev => [...prev, { role: 'ai', text: 'I am sorry, I seem to be having connection issues.' }]);
    } finally {
       setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen relative p-6 max-w-4xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <button onClick={() => navigate(-1)} className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition">
          <LucideIcons.ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
           <LucideIcons.Sparkles className="text-[#00f2fe]" /> SubSave Concierge
        </h1>
        <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center bg-[#0d1117] relative">
           <span className="w-3 h-3 bg-green-500 rounded-full absolute bottom-0 right-0 border-2 border-black"></span>
           <img src="https://api.dicebear.com/7.x/bottts/svg?seed=subsave" alt="AI Agent" className="w-8 h-8 rounded-full" />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto mb-6 flex flex-col gap-4 px-4 py-2 custom-scrollbar">
         {messages.map((msg, i) => (
            <motion.div 
               key={i} 
               initial={{ opacity: 0, y: 10, scale: 0.95 }}
               animate={{ opacity: 1, y: 0, scale: 1 }}
               className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'ai' ? 'self-start bg-white/5 border border-white/10 rounded-tl-sm' : 'self-end bg-gradient-to-r from-[#00f2fe]/20 to-[#4facfe]/20 border border-[#4facfe]/30 rounded-tr-sm'}`}
            >
               <p className="leading-relaxed text-[15px] whitespace-pre-wrap">{msg.text}</p>
            </motion.div>
         ))}
         {loading && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
              className="self-start max-w-[80%] p-4 rounded-2xl bg-white/5 border border-white/10 rounded-tl-sm flex gap-2 items-center"
            >
               <span className="w-2 h-2 rounded-full bg-[#00f2fe] animate-bounce delay-75"></span>
               <span className="w-2 h-2 rounded-full bg-[#00f2fe] animate-bounce delay-150"></span>
               <span className="w-2 h-2 rounded-full bg-[#00f2fe] animate-bounce delay-300"></span>
            </motion.div>
         )}
      </div>

      <form onSubmit={handleSend} className="relative w-full shadow-2xl">
         <div className="glass-panel rounded-full flex items-center pl-6 pr-2 py-2 border-white/20">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your spending..."
              className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-white placeholder-gray-500"
            />
            <button 
              type="submit" 
              disabled={!input.trim()}
              className="p-3 bg-gradient-to-br from-[#00f2fe] to-[#4facfe] rounded-full text-black hover:opacity-90 transition active:scale-95 ml-2 disabled:opacity-50"
            >
              <LucideIcons.Send size={20} />
            </button>
         </div>
      </form>
    </div>
  );
}
