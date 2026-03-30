"use client";
import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Bot, User, Minimize2, Maximize2, Loader2, X } from "lucide-react";
import { sendChatMessage } from "@/lib/api";
import { clsx } from "clsx";
import ReactMarkdown from "react-markdown";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'agent', content: string}[]>([
    { role: 'agent', content: "Hello! I'm your AI assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize from localStorage on mount
  useEffect(() => {
    setIsClient(true);
    const savedMessages = localStorage.getItem('chatAgent_messages');
    const savedIsOpen = localStorage.getItem('chatAgent_isOpen');
    const savedIsMinimized = localStorage.getItem('chatAgent_isMinimized');

    if (savedMessages) {
      try { setMessages(JSON.parse(savedMessages)); } catch (e) {}
    }
    if (savedIsOpen === 'true') setIsOpen(true);
    if (savedIsMinimized === 'true') setIsMinimized(true);
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('chatAgent_messages', JSON.stringify(messages));
      localStorage.setItem('chatAgent_isOpen', isOpen.toString());
      localStorage.setItem('chatAgent_isMinimized', isMinimized.toString());
    }
  }, [messages, isOpen, isMinimized, isClient]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const { data } = await sendChatMessage(userMessage);
      setMessages(prev => [...prev, { role: 'agent', content: data.answer }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'agent', content: "Sorry, I'm having trouble connecting to the brain. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isClient) return null; // Prevent hydration mismatch

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 group"
      >
        <MessageSquare size={28} className="group-hover:animate-pulse" />
      </button>
    );
  }

  return (
    <div className={clsx(
      "fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl flex flex-col transition-all border border-gray-100 overflow-hidden z-50",
      isMinimized ? "h-16 w-64" : "h-[500px] w-96"
    )}>
      {/* Header */}
      <div className="bg-primary-600 p-4 text-white flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Bot size={18} />
          </div>
          <div>
            <p className="text-sm font-bold">Support Agent</p>
            <p className="text-[10px] opacity-80 uppercase tracking-widest font-bold">Online</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsMinimized(!isMinimized)} className="p-1 hover:bg-white/10 rounded transition-colors">
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {messages.map((msg, i) => (
              <div key={i} className={clsx("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                <div className={clsx(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1",
                  msg.role === 'user' ? "bg-primary-100 text-primary-700" : "bg-white border border-gray-200 text-gray-500"
                )}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={clsx(
                  "max-w-[80%] p-3 text-sm rounded-2xl",
                   msg.role === 'user' 
                    ? "bg-primary-600 text-white rounded-tr-none shadow-md shadow-primary-500/10" 
                    : "bg-white border border-gray-100 text-gray-800 rounded-tl-none shadow-sm"
                )}>
                  {msg.role === 'user' ? (
                    msg.content
                  ) : (
                    <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-gray-50 prose-pre:text-gray-800">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 text-gray-400 flex items-center justify-center">
                  <Bot size={16} />
                </div>
                <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                  <div className="w-1 h-1 bg-gray-300 rounded-full animate-bounce" />
                  <div className="w-1 h-1 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1 h-1 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100 flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:hover:bg-primary-600 shadow-md shadow-primary-500/20"
            >
              <Send size={18} />
            </button>
          </form>
        </>
      )}
    </div>
  );
}
