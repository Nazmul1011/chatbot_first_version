"use client";
import { useState, useEffect } from "react";
import { getMarketingAgents, createMarketingAgent, deleteMarketingAgent, getMarketingLeads, sendMarketingChat } from "@/lib/api";
import { Plus, Check, TrendingUp, Users, Trash2, Code2, Loader2, Megaphone, Target, Rocket, RotateCcw, Send, PlusCircle } from "lucide-react";

type Agent = {
  id: string;
  name: string;
  is_active: boolean;
  model_name: string;
  company_name: string;
  lead_count: number;
  public_api_key: string;
  company_context: string;
};

export default function MarketingAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tab, setTab] = useState<'agents' | 'leads' | 'playground'>('agents');
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);
  
  // Chat state
  const [chat, setChat] = useState<{role: string, content: string}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [newAgent, setNewAgent] = useState({
    name: "",
    company_name: "",
    company_context: "",
    current_offer: "",
    api_key: "",
    model_name: "qwen/qwen3.6-plus-preview:free",
    lead_capture_enabled: true
  });

  const fetchAgents = async () => {
    try {
      const response = await getMarketingAgents();
      setAgents(response.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchLeads = async () => {
    if (!activeAgent) return;
    try {
      const response = await getMarketingLeads(activeAgent.id);
      setLeads(response.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchAgents(); }, []);
  useEffect(() => { if (tab === 'leads') fetchLeads(); }, [tab, activeAgent]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMarketingAgent(newAgent);
      setIsModalOpen(false);
      fetchAgents();
      setNewAgent({ name: "", company_name: "", company_context: "", current_offer: "", api_key: "", model_name: "qwen/qwen3.6-plus-preview:free", lead_capture_enabled: true });
    } catch (err) { alert("Failed to create marketing agent."); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this marketing agent?")) return;
    try { await deleteMarketingAgent(id); fetchAgents(); } catch { alert("Failed to delete agent."); }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeAgent) return;

    const userMsg = { role: 'user', content: chatInput };
    setChat(prev => [...prev, userMsg]);
    setChatInput("");
    setIsLoading(true);

    try {
      const res = await sendMarketingChat(activeAgent.public_api_key, chatInput, sessionId || undefined);
      setChat(prev => [...prev, { role: 'bot', content: res.data.reply }]);
      if (res.data.session_id) setSessionId(res.data.session_id);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || "AI Link failed. Check your API key.";
      setChat(prev => [...prev, { role: 'bot', content: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen bg-slate-50/50 outline-none select-none">
      {/* Header section... same as before but cleaner */}
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Marketing Agents</h1>
          <p className="text-slate-500 font-medium tracking-wide">Manage your 24/7 automated sales force.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center gap-3 shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all hover:scale-105 active:scale-95"
        >
          <PlusCircle size={20} />
          Create New Agent
        </button>
      </div>

      <div className="flex gap-4 mb-10 pb-2 border-b border-slate-200/60 overflow-x-auto whitespace-nowrap scrollbar-hide font-black text-xs uppercase tracking-widest">
        <button onClick={() => setTab('agents')} className={`pb-4 px-2 tracking-widest transition-all relative ${tab === 'agents' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
          Active Agents
          {tab === 'agents' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />}
        </button>
        <button onClick={() => setTab('leads')} className={`pb-4 px-2 tracking-widest transition-all relative ${tab === 'leads' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
          Lead Hunter Center
          {tab === 'leads' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />}
        </button>
        {activeAgent && (
          <button onClick={() => setTab('playground')} className={`pb-4 px-2 tracking-widest transition-all relative ${tab === 'playground' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
            Playground: {activeAgent.name.substring(0, 8)}...
            {tab === 'playground' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />}
          </button>
        )}
      </div>

      {loading ? ( <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" size={48} /></div> ) : (
        <>
          {tab === 'agents' && (
            <div className="grid md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {agents.map((agent) => (
                <div key={agent.id} className="bg-white border border-slate-200 rounded-[32px] p-8 hover:shadow-2xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
                  <div className="flex items-start justify-between mb-8 relative">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100 uppercase font-black text-2xl">
                        {agent.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 mb-1">{agent.name}</h3>
                        <div className="flex items-center gap-2">
                           <span className={`w-2 h-2 rounded-full ${agent.is_active ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{agent.model_name.includes('/') ? agent.model_name.split('/')[1] : agent.model_name}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 italic text-sm text-slate-500 mb-10 line-clamp-2">"{agent.company_context}"</div>
                  <div className="flex gap-4 relative">
                    <button onClick={() => { setActiveAgent(agent); setTab('playground'); }} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 shadow-xl transition-all"><Rocket size={18} /> OPEN MANAGEMENT</button>
                    <button onClick={() => { navigator.clipboard.writeText(`<script src="http://localhost:8000/static/marketing-embed.js" data-agent-id="${agent.public_api_key}"></script>`); alert("Code Copied!"); }} className="px-6 py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:border-blue-500 transition-all"><Code2 size={18} /> COPY CODE</button>
                    <button onClick={() => handleDelete(agent.id)} className="p-4 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={20} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'leads' && (
            <div className="bg-white border rounded-[32px] overflow-hidden shadow-xl animate-in fade-in duration-500">
               <div className="px-10 py-8 bg-slate-900 border-b border-slate-800 text-white font-black uppercase text-xl tracking-tighter">Lead Intelligence hub</div>
               <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 border-b">
                      <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase">Agent</th>
                      <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase">Visitor Email</th>
                      <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase">Signal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead: any) => (
                      <tr key={lead.id} className="border-b hover:bg-slate-50 transition-all font-bold">
                        <td className="px-10 py-6 text-slate-700">{lead.marketing_agent_name}</td>
                        <td className="px-6 py-6 text-blue-600">{lead.visitor_email}</td>
                        <td className="px-6 py-6 text-slate-500 italic text-sm">{lead.interest_summary}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
               </div>
            </div>
          )}

          {tab === 'playground' && activeAgent && (
            <div className="bg-white border rounded-[40px] overflow-hidden flex flex-col h-[750px] shadow-2xl animate-in zoom-in-95 duration-500">
              <div className="px-10 py-8 bg-slate-900 border-b border-slate-800 flex justify-between items-center text-white">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-black">M</div>
                  <h2 className="font-black text-xl">{activeAgent.name}</h2>
                </div>
                <button onClick={() => { setChat([]); setSessionId(null); }} className="px-4 py-2 bg-slate-800 text-xs font-black rounded-lg">RESET SESSION</button>
              </div>
              <div className="flex-1 overflow-y-auto p-10 space-y-8">
                {chat.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-6 rounded-[2rem] font-medium ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>{msg.content}</div>
                  </div>
                ))}
              </div>
              <div className="p-8 border-t">
                <form onSubmit={handleChat} className="flex gap-4">
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type logic test..." className="flex-1 px-8 py-5 bg-slate-50 border rounded-3xl outline-none focus:bg-white focus:border-blue-500" />
                  <button className="px-10 py-5 bg-blue-600 text-white rounded-3xl font-black">{isLoading ? <Loader2 className="animate-spin" /> : "SEND"}</button>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 z-[100] animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[48px] p-12 shadow-2xl animate-in zoom-in-95 duration-500">
            <h2 className="text-3xl font-black text-slate-900 mb-8">Deploy Sales Force</h2>
            <form onSubmit={handleCreate} className="grid grid-cols-2 gap-8">
              <div className="col-span-2"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Agent Name</label><input required type="text" placeholder="Sales Expert..." onChange={e => setNewAgent({...newAgent, name: e.target.value})} className="w-full px-8 py-5 bg-slate-50 border rounded-3xl outline-none focus:bg-white" /></div>
              <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Brand</label><input required type="text" placeholder="Alve Creative" onChange={e => setNewAgent({...newAgent, company_name: e.target.value})} className="w-full px-8 py-5 bg-slate-50 border rounded-3xl outline-none focus:bg-white" /></div>
              <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">API Key</label><input required type="password" placeholder="sk-or-v1-..." onChange={e => setNewAgent({...newAgent, api_key: e.target.value})} className="w-full px-8 py-5 bg-slate-50 border rounded-3xl outline-none focus:bg-white" /></div>
              <div className="col-span-2"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Model Choice</label>
                <select onChange={e => setNewAgent({...newAgent, model_name: e.target.value})} className="w-full px-8 py-5 bg-slate-50 border rounded-3xl outline-none focus:bg-white font-black text-[10px] uppercase tracking-widest">
                  <option value="qwen/qwen3.6-plus-preview:free">Qwen 3.6 Plus (Free) - STABLE</option>
                  <option value="meta-llama/llama-3.3-70b-instruct:free">Llama 3.3 70B (Free)</option>
                  <option value="deepseek/deepseek-r1:free">DeepSeek R1 (Free)</option>
                </select>
              </div>
              <div className="col-span-2"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Business Context</label><textarea required rows={3} placeholder="What do you do?" onChange={e => setNewAgent({...newAgent, company_context: e.target.value})} className="w-full px-8 py-5 bg-slate-50 border rounded-3xl outline-none focus:bg-white resize-none h-32" /></div>
              <div className="col-span-2"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Winning Offer</label><textarea required rows={3} placeholder="What should the bot pitch? (e.g. 50% discount)" onChange={e => setNewAgent({...newAgent, current_offer: e.target.value})} className="w-full px-8 py-5 bg-slate-50 border rounded-3xl outline-none focus:bg-white resize-none h-32" /></div>
              <div className="col-span-2 flex items-center justify-between pt-6 border-t mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-5 bg-slate-100 text-slate-400 rounded-3xl font-black text-xs">CANCEL</button>
                <button type="submit" className="px-16 py-5 bg-blue-600 text-white rounded-3xl font-black text-xs shadow-xl shadow-blue-200">DEPLOY FORCE</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
