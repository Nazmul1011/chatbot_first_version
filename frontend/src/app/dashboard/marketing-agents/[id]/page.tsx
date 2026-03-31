"use client";
import { useState, useEffect, useRef, use } from "react";
import { getMarketingLeads, sendMarketingChat, getMarketingAgents } from "@/lib/api";
import { Target, Users, Zap, Bot, Send, User, Loader2, Sparkles, AlertCircle, Calendar, Trophy, Mail, Briefcase, ChevronLeft } from "lucide-react";
import { clsx } from "clsx";
import Link from "next/link";

type Lead = { id: number; visitor_email: string; visitor_name?: string; interest_summary: string; created_at: string; };
type Message = { role: "bot" | "user"; content: string; };

export default function MarketingAgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState<"playground" | "leads">("playground");
  const [agent, setAgent] = useState<any>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [messages, setMessages] = useState<Message[]>([{ role: "bot", content: "I am ready to pitch! How would you like me to start engaging visitors?" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchAgentData = async () => {
    try {
      const agentsRes = await getMarketingAgents();
      const current = agentsRes.data.find((a: any) => a.id === id);
      setAgent(current);
      const leadsRes = await getMarketingLeads(id);
      setLeads(leadsRes.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchAgentData(); }, [id]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading || !agent) return;
    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);
    try {
      const { data } = await sendMarketingChat(agent.public_api_key, userMessage, sessionId);
      setMessages((prev) => [...prev, { role: "bot", content: data.reply }]);
      setSessionId(data.session_id);
      if (data.lead_captured) {
        const leadsRes = await getMarketingLeads(id);
        setLeads(leadsRes.data);
      }
    } catch (err) { setMessages((prev) => [...prev, { role: "bot", content: "AI link failed. Check your API key." }]); }
    finally { setLoading(false); }
  };

  if (!agent) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
            <Link href="/dashboard/marketing-agents" className="p-3 bg-white border border-gray-100 rounded-xl hover:bg-gray-50"><ChevronLeft size={20} /></Link>
            <div><h2 className="text-2xl font-black text-slate-900">{agent.name}</h2><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{agent.company_name} / {agent.model_name}</p></div>
         </div>
         <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200">
            <button onClick={() => setActiveTab("playground")} className={clsx("px-6 py-2.5 rounded-xl text-xs font-black transition-all", activeTab === "playground" ? "bg-white text-blue-600 shadow-sm border border-gray-200" : "text-gray-500")}>PLAYGROUND</button>
            <button onClick={() => setActiveTab("leads")} className={clsx("px-6 py-2.5 rounded-xl text-xs font-black transition-all", activeTab === "leads" ? "bg-white text-emerald-600 shadow-sm border border-gray-200" : "text-gray-500")}>LEAD HUNTER ({leads.length})</button>
         </div>
      </div>

      {activeTab === "playground" ? (
        <div className="flex flex-col h-[calc(100vh-280px)] bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
           <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50/30">
              {messages.map((m, i) => (
                <div key={i} className={clsx("flex items-start gap-4", m.role === "bot" ? "justify-start" : "justify-end")}>
                  {m.role === "bot" && <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-lg shadow-blue-600/20"><Bot size={14} className="text-white" /></div>}
                  <div className={clsx("max-w-[75%] px-5 py-3.5 rounded-2xl text-sm leading-relaxed", m.role === "bot" ? "bg-white text-slate-900 border border-gray-100 rounded-tl-none shadow-sm" : "bg-slate-900 text-white rounded-tr-none")}>{m.content}</div>
                  {m.role === "user" && <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1"><User size={14} className="text-blue-600" /></div>}
                </div>
              ))}
              <div ref={messagesEndRef} />
           </div>
           <div className="p-8 bg-white border-t border-gray-100">
              <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-center gap-4">
                 <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message..." className="flex-1 px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:border-blue-600 transition-all" />
                 <button disabled={loading || !input.trim()} className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl hover:scale-105 transition-all"><Send size={24} /></button>
              </form>
           </div>
        </div>
      ) : (
        <div className="animate-in slide-in-from-bottom-5 duration-500">
           <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
              <div className="p-8 bg-slate-900 text-white flex items-center justify-between"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20"><Trophy size={24} /></div><div><h3 className="text-xl font-black">Lead Vault</h3><p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Harvested from {agent.name}</p></div></div><div className="bg-slate-800 px-4 py-2 rounded-xl text-xs font-bold text-emerald-400 border border-slate-700">Total Leads: {leads.length}</div></div>
              {leads.length === 0 ? ( <div className="p-20 text-center text-slate-400 italic">No leads captured yet. 🏺📈</div> ) : (
                <div className="overflow-x-auto"><table className="w-full text-left border-collapse"><thead><tr className="bg-gray-50/50 border-b border-gray-100"><th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Visitor Info</th><th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Interest Summary</th><th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th></tr></thead><tbody>{leads.map((lead) => (
                      <tr key={lead.id} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors"><td className="px-8 py-6"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600"><Mail size={18} /></div><div><p className="text-sm font-black text-slate-900">{lead.visitor_email}</p>{lead.visitor_name && <p className="text-xs text-slate-400 font-medium">{lead.visitor_name}</p>}</div></div></td><td className="px-8 py-6"><p className="text-xs text-slate-600 font-medium italic line-clamp-2 max-w-[300px]">"{lead.interest_summary}"</p></td><td className="px-8 py-6"><div className="flex items-center gap-2 text-slate-400"><Calendar size={14} /><span className="text-[10px] font-black uppercase tracking-tight">{new Date(lead.created_at).toLocaleDateString()}</span></div></td></tr>
                ))}</tbody></table></div>
              )}
           </div>
        </div>
      )}
    </div>
  );
}
