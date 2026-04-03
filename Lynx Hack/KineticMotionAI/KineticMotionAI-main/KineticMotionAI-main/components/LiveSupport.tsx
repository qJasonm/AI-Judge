import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, HelpCircle, ChevronRight } from 'lucide-react';
import { getChatResponse } from '../services/geminiService';
import { ChatMessage } from '../types';

const LiveSupport: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      id: '0', 
      role: 'model', 
      text: 'Hi there! I can help you navigate Kinetic MotionAI or explain how to use the AI Coach. What do you need help with?', 
      timestamp: new Date() 
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const SUGGESTIONS = [
    "How do I use Live Coach?",
    "Fix camera permission error",
    "What does Posture Score mean?",
    "How to upload a video?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (text: string = inputValue) => {
    if (!text.trim()) return;

    // Use a more robust random ID
    const userMsg: ChatMessage = { 
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9), 
        role: 'user', 
        text: text, 
        timestamp: new Date() 
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Filter out the local greeting (id: '0') from the history sent to Gemini
      // to ensure the conversation starts cleanly with user input if needed.
      const history = messages
        .filter(m => m.id !== '0')
        .map(m => ({ role: m.role, content: m.text }));

      const responseText = await getChatResponse(history, userMsg.text);
      
      const botMsg: ChatMessage = { 
          id: (Date.now() + 1).toString() + Math.random().toString(36).substr(2, 9), 
          role: 'model', 
          text: responseText || 'I am having trouble connecting. Please check your internet.', 
          timestamp: new Date() 
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error("Support Chat Error:", err);
      setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          role: 'model', 
          text: 'Connection error. Please try again later.', 
          timestamp: new Date() 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
          {!isOpen && (
            <button 
                onClick={() => setIsOpen(true)}
                className="bg-primary hover:bg-cyan-400 text-black p-4 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all transform hover:scale-105 flex items-center gap-2 font-bold group"
            >
                <div className="relative">
                    <Bot size={24} />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-400"></span>
                    </span>
                </div>
                <span className="hidden md:inline group-hover:inline transition-all">Support & Help</span>
            </button>
          )}
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] h-[600px] max-h-[80vh] bg-surface border border-gray-700 rounded-2xl shadow-2xl flex flex-col animate-fade-in overflow-hidden font-sans">
            {/* Header */}
            <div className="bg-gray-800 p-4 flex justify-between items-center border-b border-gray-700 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white">
                        <Bot size={20} />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-sm">Kinetic MotionAI Support</h3>
                        <div className="flex items-center gap-1.5">
                             <span className="w-2 h-2 rounded-full bg-green-500"></span>
                             <span className="text-xs text-gray-400">Online</span>
                        </div>
                    </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/40 scrollbar-hide">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'model' && (
                             <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-2 shrink-0 self-end mb-1">
                                 <Bot size={14} className="text-gray-300" />
                             </div>
                        )}
                        <div className={`max-w-[80%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                            msg.role === 'user' 
                            ? 'bg-primary text-black rounded-tr-sm font-medium' 
                            : 'bg-gray-800 text-gray-100 rounded-tl-sm border border-gray-700/50'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                
                {isLoading && (
                    <div className="flex justify-start">
                         <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-2 shrink-0 self-end mb-1">
                                 <Bot size={14} className="text-gray-300" />
                         </div>
                        <div className="bg-gray-800 p-4 rounded-2xl rounded-tl-sm border border-gray-700/50 flex gap-1.5">
                            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-75"></span>
                            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-150"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions */}
            {messages.length < 3 && (
                <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide shrink-0 bg-black/40 pb-4">
                    {SUGGESTIONS.map((s, i) => (
                        <button 
                            key={i} 
                            onClick={() => handleSend(s)}
                            className="whitespace-nowrap px-3 py-1.5 rounded-full bg-gray-800 border border-gray-700 text-xs text-primary hover:bg-gray-700 hover:border-primary/50 transition-colors"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}

            {/* Input */}
            <div className="p-3 bg-gray-800 border-t border-gray-700 shrink-0">
                <div className="flex gap-2 items-center bg-black/50 border border-gray-600 rounded-xl px-2 py-1 focus-within:border-primary transition-colors">
                    <input 
                        type="text" 
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your question..."
                        className="flex-1 bg-transparent px-3 py-2 text-sm text-white focus:outline-none placeholder:text-gray-500"
                    />
                    <button 
                        onClick={() => handleSend()}
                        disabled={isLoading || !inputValue.trim()}
                        className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={18} />
                    </button>
                </div>
                <div className="text-center mt-2">
                    <p className="text-[10px] text-gray-500">AI can make mistakes. Consult a coach for medical advice.</p>
                </div>
            </div>
        </div>
      )}
    </>
  );
};

export default LiveSupport;