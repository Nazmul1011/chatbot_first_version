"use client";
import { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "@/lib/api";
import { Send, Bot, User, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { clsx } from "clsx";

type Message = {
  role: "bot" | "user";
  content: string;
};

export default function TestAgentPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", content: "Hello! I'm your AI playground. I'll answer based on the knowledge base of the currently selected agent. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [agentName, setAgentName] = useState("Your Agent");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync agent name from sidebar/switcher
  useEffect(() => {
    const activeId = localStorage.getItem('active_tenant_id');
    const name = localStorage.getItem(`tenant_name_${activeId}`) || "Your Agent";
    setAgentName(name);

    // Reset chat if agent changes? Optional, but maybe good for clarity
    // setMessages([{ role: "bot", content: `I am now connected to ${name}. How can I assist you?` }]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
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
        { role: "bot", content: "⚠️ Sorry, I encountered an error. Please make sure the backend is running and the agent has knowledge indexed!" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden relative">
      {/* Header Info */}
      <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
            <Bot size={22} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Playground Mode</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Agent: {agentName}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-2">
            <Sparkles size={14} className="text-blue-400" />
            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-tight">RAG Powered</span>
        </div>
      </div>

      {/* Messages Window */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50 backdrop-blur-sm custom-scrollbar">
        {messages.map((m, i) => (
          <div
            key={i}
            className={clsx(
              "flex items-start gap-4 transition-all duration-300 transform translate-y-0",
              m.role === "bot" ? "justify-start" : "justify-end"
            )}
          >
            {m.role === "bot" && (
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot size={16} className="text-blue-600" />
              </div>
            )}
            <div
              className={clsx(
                "max-w-[80%] px-5 py-3 rounded-2xl shadow-sm text-sm leading-relaxed",
                m.role === "bot" 
                  ? "bg-white text-gray-800 border border-gray-100 rounded-tl-none" 
                  : "bg-blue-600 text-white rounded-tr-none shadow-blue-600/10"
              )}
            >
              {m.content}
            </div>
            {m.role === "user" && (
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center flex-shrink-0 mt-1">
                <User size={16} className="text-white" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center animate-bounce">
              <Bot size={16} className="text-blue-600" />
            </div>
            <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-gray-100 italic text-gray-400 text-xs flex items-center gap-2">
              <Loader2 size={12} className="animate-spin text-blue-600" />
              {agentName} is thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-gray-100 pb-8">
        <form 
          onSubmit={handleSend}
          className="relative max-w-4xl mx-auto flex items-center gap-3 transition-all focus-within:translate-y-[-2px]"
        >
          <div className="flex-1 relative group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask ${agentName} anything...`}
              disabled={loading}
              className="w-full pl-6 pr-14 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-gray-800 placeholder-gray-400 shadow-inner"
            />
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-300 group-focus-within:text-blue-500 transition-colors">
                 <AlertCircle size={18} />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:bg-gray-400 group"
          >
            <Send size={22} className={clsx("transition-transform", !loading && "group-hover:translate-x-1 group-hover:-translate-y-1")} />
          </button>
        </form>
        <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-4 opacity-50">
           End-to-End Encrypted Knowledge Playground
        </p>
      </div>
    </div>
  );
}
