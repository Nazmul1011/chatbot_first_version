"use client";
import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles, Trash2, TrendingUp, ShieldCheck, Plus, Smile, Maximize2, MoreHorizontal, ArrowUp } from "lucide-react";
import { clsx } from "clsx";
import ReactMarkdown from 'react-markdown';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { sendChatMessage, getMarketingAgents } from "@/lib/api";

type Message = {
  role: "bot" | "user";
  content: string;
};

export default function ChatWidget({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showPrivacy, setShowPrivacy] = useState(true);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  // Marketing Detection
  const [marketingId, setMarketingId] = useState<string | null>(null);

  // Close emoji on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Environment Isolation Logic
  const getEnvironment = () => {
    if (typeof window !== 'undefined' && window.top !== window) return 'live';
    return 'preview';
  };

  const getTenantKey = () => {
    const tenantId = localStorage.getItem('active_tenant_id') || 'default';
    const env = getEnvironment();
    return `chat_history_${env}_${tenantId}_master`;
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const type = isOpen ? (isExpanded ? 'CHAT_MAXIMIZE' : 'CHAT_OPEN') : 'CHAT_CLOSE';
      window.parent.postMessage({ type }, '*');
    }
  }, [isOpen, isExpanded]);

  useEffect(() => {
    const initWidget = async () => {
      let mId = localStorage.getItem('active_marketing_id');
      try {
        const { data } = await getMarketingAgents();
        if (data && data.length > 0) {
          mId = data[0].public_api_key;
          localStorage.setItem('active_marketing_id', mId!);
          setMarketingId(mId);
        } else {
          localStorage.removeItem('active_marketing_id');
          setMarketingId(null);
        }
      } catch (e) { console.error("Agent validation failed", e); }
    };
    initWidget();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(getTenantKey());
    if (saved) {
      try { setMessages(JSON.parse(saved)); } catch (e) { setMessages([{ role: "bot", content: "Hello! I'm your AI assistant. How can I help you today?" }]); }
    } else {
      setMessages([{ role: "bot", content: "Hello! I'm your AI assistant. How can I help you today?" }]);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(getTenantKey(), JSON.stringify(messages));
    }
  }, [messages]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { if (isOpen) scrollToBottom(); }, [messages, isOpen]);

  const clearChat = () => {
    const initial = [{ role: "bot", content: "Chat reset. How can I help you now?" }] as Message[];
    setMessages(initial);
    localStorage.setItem(getTenantKey(), JSON.stringify(initial));
  };

  const onEmojiClick = (emojiData: any) => {
    setInput(prev => prev + emojiData.emoji);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setShowEmoji(false);
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const { data } = await sendChatMessage(userMessage);
      setMessages((prev) => [...prev, { role: "bot", content: data.answer }]);
      if (data.session_id) setSessionId(data.session_id);
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: "bot", content: "Agent connection timed out. Retrying..." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={clsx(
      isEmbedded ? "relative h-full w-full flex flex-col items-end justify-end p-2 outline-none select-none overflow-hidden"
        : "fixed bottom-6 right-6 z-50 flex flex-col items-end outline-none select-none"
    )}>
      {isOpen && (
        <div className={clsx(
          "rounded-[2.5rem] border border-white/50 flex flex-col mb-4 transition-all duration-500 overflow-hidden transform origin-bottom-right",
          isEmbedded ? "bg-[#f4f4f5] shadow-none" : "bg-[#F9F9F9] shadow-[0_20px_50px_rgba(0,0,0,0.1)]",
          isExpanded ? "w-full h-full p-4 sm:p-8" : "w-[420px] h-[720px]"
        )}>
          <div className={clsx(
            "flex flex-col h-full w-full bg-inherit transition-all duration-500",
            isExpanded ? "rounded-[2.5rem] border border-white/40" : ""
          )}>

          {isEmbedded ? (
            /* EMBEDDED AESTHETIC (TEXT SUPPORT) */
            <div className="pt-6 px-6 pb-4 flex items-start justify-between relative z-10 w-full">
              <button onClick={() => setIsExpanded(!isExpanded)} className="w-10 h-10 bg-slate-200/50 hover:bg-slate-200 text-slate-600 rounded-full flex items-center justify-center transition-all shadow-sm">
                <Maximize2 size={16} className={clsx(isExpanded && "rotate-180")} />
              </button>
              <div className="bg-white px-5 py-2.5 rounded-[2rem] shadow-sm flex items-center gap-3">
                <div className="w-9 h-9 bg-[#1E2330] rounded-full flex items-center justify-center relative shadow-sm shrink-0">
                  <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
                  <Sparkles size={16} className="text-pink-300" />
                </div>
                <div className="text-left flex flex-col justify-center">
                  <h1 className="font-bold text-sm text-slate-900 leading-tight">Text Support</h1>
                  <p className="text-[11px] font-medium text-slate-500 leading-tight">AI assistant</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="w-10 h-10 bg-slate-200/50 hover:bg-slate-200 text-slate-600 rounded-full flex items-center justify-center transition-all shadow-sm">
                  <MoreHorizontal size={18} />
                </button>
                <button onClick={() => setIsOpen(false)} className="w-10 h-10 bg-slate-200/50 hover:bg-slate-200 text-slate-600 rounded-full flex items-center justify-center transition-all shadow-sm">
                  <X size={18} />
                </button>
              </div>
            </div>
          ) : (
            /* DASHBOARD AESTHETIC (AGENTIC FORCE) */
            <div className="px-6 py-6 flex flex-col items-center relative">
              <div className="absolute top-4 left-6 flex gap-4">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className={clsx("p-2 rounded-full transition-all text-slate-500 shadow-sm border border-slate-100", isExpanded ? "bg-slate-100" : "bg-white/40 hover:bg-white")}
                >
                  <Maximize2 size={16} className={clsx(isExpanded && "rotate-180")} />
                </button>
              </div>
              <div className="absolute top-4 right-6 flex gap-2">
                <button className="p-2 bg-white/40 hover:bg-white rounded-full transition-all text-slate-500 shadow-sm border border-slate-100"><MoreHorizontal size={18} /></button>
                <button onClick={() => setIsOpen(false)} className="p-2 bg-white/80 hover:bg-white rounded-full transition-all text-slate-500 shadow-sm border border-slate-100"><X size={18} /></button>
              </div>
              <div className="bg-white px-6 py-4 rounded-[2rem] shadow-xl shadow-black/5 flex items-center gap-4 mt-8 border border-white">
                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center relative shadow-inner">
                  <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white online-pulse" />
                  <Sparkles size={20} className="text-pink-200" />
                </div>
                <div className="text-left">
                  <h1 className="font-bold text-lg text-slate-800 leading-none">AI Agent</h1>
                  <p className="text-[11px] font-medium text-slate-400 mt-0.5 tracking-tight">Always active</p>
                </div>
              </div>
            </div>
          )}

          <div className={clsx("flex-1 overflow-y-auto w-full px-6 py-2 space-y-6 custom-scrollbar scroll-smooth", isEmbedded ? "" : "px-8 py-4")}>
            {messages.map((m, i) => {
              if (isEmbedded) {
                return (
                  <div key={i} className={clsx("flex flex-col", m.role === "bot" ? "items-start" : "items-end")}>
                    <div className={clsx("flex items-start gap-3 w-full", m.role === "bot" ? "justify-start" : "justify-end")}>
                      {m.role === "bot" && (
                        <div className="w-8 h-8 rounded-full bg-[#353744] flex items-center justify-center mt-1 shrink-0 shadow-sm">
                          <Sparkles size={14} className="text-pink-200" />
                        </div>
                      )}
                      {m.role === "bot" ? (
                        <div className="text-[15px] leading-relaxed text-slate-700 font-medium max-w-[85%] pt-1 object-contain markdown-prose">
                          <ReactMarkdown>{m.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <div className="max-w-[75%] px-5 py-3.5 rounded-[1.5rem] text-[15px] leading-relaxed font-medium bg-[#006CFF] text-white shadow-sm break-words">
                          {m.content}
                        </div>
                      )}
                    </div>
                    {m.role === "user" && <span className="text-[10px] text-slate-400 mt-1 mr-2 font-medium">Read</span>}
                  </div>
                );
              }

              return (
                <div key={i} className={clsx("flex items-start gap-3", m.role === "bot" ? "justify-start" : "justify-end")}>
                  {m.role === "bot" && (
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center mt-1 shrink-0 shadow-sm">
                      <Sparkles size={14} className="text-pink-100" />
                    </div>
                  )}
                  <div className={clsx(
                    "max-w-[80%] px-5 py-4 rounded-[1.8rem] text-sm leading-relaxed shadow-sm font-medium",
                    m.role === "bot" ? "bg-white text-slate-700 border border-slate-100" : "bg-slate-800 text-white shadow-lg"
                  )}>
                    {m.role === "bot" ? (
                      <div className="markdown-prose opacity-90">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    ) : m.content}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex items-center gap-3 px-2 py-2 animate-in fade-in duration-300">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0 shadow-sm">
                  <Sparkles size={14} className="text-pink-100" />
                </div>
                <div className="bg-white/80 backdrop-blur-sm px-4 py-3 rounded-[1.2rem] flex items-center gap-2 border border-white shadow-sm">
                  <div className="w-1.5 h-1.5 bg-slate-100 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-6 pb-6 pt-0 flex flex-col gap-3 relative">
            {showEmoji && (
              <div ref={emojiRef} className="absolute bottom-20 left-6 right-6 z-[60] shadow-2xl rounded-3xl overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
                <EmojiPicker
                  onEmojiClick={onEmojiClick}
                  autoFocusSearch={false}
                  theme={Theme.LIGHT}
                  width="100%"
                  height={350}
                />
              </div>
            )}

            {showPrivacy && (
              <div className="bg-white/80 backdrop-blur-md border border-white p-5 rounded-[1.8rem] shadow-xl shadow-black/5 relative animate-in slide-in-from-bottom-4 duration-500">
                <button onClick={() => setShowPrivacy(false)} className="absolute top-4 right-4 w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all"><X size={12} /></button>
                <p className="text-[11px] leading-relaxed text-slate-500 font-medium pr-6">
                  By chatting here, you agree we and authorized partners may process, monitor, and record this chat.
                  <span className="text-slate-800 font-bold ml-1 cursor-pointer underline">Privacy Policy</span>.
                </p>
              </div>
            )}

            {isEmbedded ? (
              <form onSubmit={handleSend} className="relative flex items-center bg-white rounded-full p-1 shadow-sm border border-slate-200 group focus-within:border-slate-300 transition-all">
                <button type="button" className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"><Plus size={22} strokeWidth={1.5} /></button>
                <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Write a message..." className="flex-1 bg-transparent px-2 py-3 text-[15px] outline-none font-medium text-slate-700 placeholder:text-slate-400" />
                <button onClick={() => setShowEmoji(!showEmoji)} type="button" className={clsx("w-10 h-10 rounded-full flex items-center justify-center transition-all", showEmoji ? "text-blue-500 bg-blue-50" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50")}><Smile size={22} strokeWidth={1.5} /></button>
                <button disabled={loading || !input.trim()} type="submit" className={clsx("w-10 h-10 rounded-full flex items-center justify-center transition-all ml-1", input.trim() ? "bg-slate-200 text-slate-600" : "bg-slate-100 text-slate-300")}><ArrowUp size={20} strokeWidth={2.5} /></button>
              </form>
            ) : (
              <form onSubmit={handleSend} className="relative flex items-center bg-white rounded-full p-2 shadow-xl shadow-black/5 border border-white group focus-within:border-slate-200 transition-all">
                <button type="button" className="w-11 h-11 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"><Plus size={20} /></button>
                <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Write a message..." className="flex-1 bg-transparent px-2 py-3 text-sm outline-none font-medium text-slate-700 placeholder:text-slate-400" />
                <button onClick={() => setShowEmoji(!showEmoji)} type="button" className={clsx("w-11 h-11 rounded-full flex items-center justify-center transition-all", showEmoji ? "text-blue-500 bg-blue-50" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50")}><Smile size={20} /></button>
                <button disabled={loading || !input.trim()} type="submit" className={clsx("w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-lg", input.trim() ? "bg-slate-200 text-slate-600 scale-100" : "bg-slate-50 text-slate-300 scale-90")}><ArrowUp size={20} strokeWidth={3} /></button>
              </form>
            )}

            <div className="text-center mt-2">
              {isEmbedded ? (
                <p className="text-[10px] font-medium text-slate-500">Powered by <strong className="text-black font-extrabold text-[11px] tracking-tight">text|</strong></p>
              ) : (
                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest leading-none">Powered by <span className="text-slate-400 uppercase">Agentic Force</span></p>
              )}
            </div>
          </div>
        </div>
      </div>
    )}

      {/* Floating Launcher */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx("w-20 h-20 rounded-full shadow-2xl flex items-center justify-center text-white transition-all duration-500 hover:scale-110 active:scale-95 group relative overflow-hidden", isOpen ? "bg-slate-900" : "bg-blue-600 shadow-blue-500/30")}
      >
        {isOpen ? <X size={32} /> : (
          <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700">
            <MessageSquare size={32} />
            <div className="absolute top-5 right-5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white online-pulse" />
          </div>
        )}
      </button>
    </div>
  );
}
