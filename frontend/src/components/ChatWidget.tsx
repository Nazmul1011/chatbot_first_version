"use client";
import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles, Maximize2, Minimize2, Trash2 } from "lucide-react";
import { clsx } from "clsx";
import { sendChatMessage } from "@/lib/api";

type Message = {
  role: "bot" | "user";
  content: string;
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Load messages from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('agent_chat_history');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        setMessages([{ role: "bot", content: "Hello! I'm your AI Support assistant. How can I help you today?" }]);
      }
    } else {
      setMessages([{ role: "bot", content: "Hello! I'm your AI Support assistant. How can I help you today?" }]);
    }
  }, []);

  // 2. Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('agent_chat_history', JSON.stringify(messages));
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const clearChat = () => {
    if (confirm("Clear your conversation history?")) {
      const initial = [{ role: "bot", content: "Hello! I'm your AI Support assistant. How can I help you today?" }];
      setMessages(initial);
      localStorage.setItem('agent_chat_history', JSON.stringify(initial));
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const { data } = await sendChatMessage(userMessage);
      setMessages((prev) => [...prev, { role: "bot", content: data.answer }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: "Sorry, I'm having trouble connecting right now. Please try again later." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div
          className={clsx(
            "bg-white shadow-2xl rounded-3xl border border-gray-100 flex flex-col mb-4 transition-all duration-500 ease-out overflow-hidden transform origin-bottom-right",
            isMaximized ? "w-[90vw] h-[85vh] fixed inset-6 md:w-[60vw] md:h-[80vh] md:relative md:inset-auto" : "w-[380px] h-[580px]"
          )}
        >
          {/* High-End Header */}
          <div className="bg-slate-900 px-6 py-5 flex items-center justify-between text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-3xl rounded-full" />
             
             <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                   <Bot size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight">Support Agent</h3>
                  <div className="flex items-center gap-1.5 ">
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                     <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Online & Persistent</span>
                  </div>
                </div>
             </div>
             
             <div className="flex items-center gap-2 relative z-10">
                <button 
                   onClick={clearChat}
                   title="Clear Chat"
                   className="p-2 hover:bg-rose-500/20 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                >
                   <Trash2 size={16} />
                </button>
                <button 
                   onClick={() => setIsMaximized(!isMaximized)}
                   className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition-colors hidden md:block"
                >
                   {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
             </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50 custom-scrollbar relative">
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

            {messages.map((m, i) => (
              <div
                key={i}
                className={clsx(
                  "flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-300",
                  m.role === "bot" ? "justify-start" : "justify-end"
                )}
              >
                {m.role === "bot" && (
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                    <Bot size={14} className="text-blue-600" />
                  </div>
                )}
                <div
                  className={clsx(
                    "max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm relative z-10",
                    m.role === "bot" 
                       ? "bg-white text-gray-800 border border-gray-100 rounded-tl-none" 
                       : "bg-blue-600 text-white rounded-tr-none"
                  )}
                >
                  {m.content}
                </div>
                {m.role === "user" && (
                  <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                    <User size={14} className="text-white" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center animate-bounce">
                  <Bot size={14} className="text-blue-600" />
                </div>
                <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-gray-100 text-xs text-gray-400 flex items-center gap-2">
                   <Loader2 size={12} className="animate-spin text-blue-600" />
                   Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Premium Input Section */}
          <div className="p-5 bg-white border-t border-gray-100 relative z-20">
            <form onSubmit={handleSend} className="relative flex items-center gap-2 group">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message Support..."
                disabled={loading}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-sm outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="w-12 h-12 bg-blue-600 rounded-[1.125rem] flex items-center justify-center text-white shadow-xl shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:bg-gray-400"
              >
                <Send size={18} />
              </button>
            </form>
            <div className="flex items-center justify-center gap-1.5 mt-4 opacity-30">
               <Sparkles size={10} className="text-blue-600" />
               <span className="text-[9px] font-black uppercase tracking-widest text-slate-900">Session Memory Enabled</span>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "w-16 h-16 rounded-2xl shadow-2xl flex items-center justify-center text-white transition-all duration-500 hover:scale-105 active:scale-95 group relative",
          isOpen ? "bg-slate-900" : "bg-blue-600 shadow-blue-600/30"
        )}
      >
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
      </button>
    </div>
  );
}
