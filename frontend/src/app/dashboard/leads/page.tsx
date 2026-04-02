"use client";
import React, { useState, useEffect } from "react";
import { User, Mail, Calendar, MessageCircle, Bot, Search, ExternalLink, Download } from "lucide-react";
import { getMarketingAgents, getMarketingLeads } from "@/lib/api";

type Lead = {
  id: string;
  visitor_email: string;
  visitor_name?: string;
  visitor_phone?: string;
  interest_summary: string;
  created_at: string;
  agent_name: string;
};

export default function LeadsHub() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchLeads = async () => {
    try {
      // 1. Get all marketing agents first
      const { data: agents } = await getMarketingAgents();
      
      const allLeads: Lead[] = [];

      // 2. Fetch leads for each agent
      for (const agent of agents) {
        try {
          const { data } = await getMarketingLeads(agent.id);
          if (Array.isArray(data)) {
             data.forEach((l: any) => allLeads.push({ ...l, agent_name: agent.name }));
          }
        } catch (e) {
          console.error(`Leads not found for agent ${agent.name}`, e);
        }
      }

      setLeads(allLeads.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (e) { console.error("Lead fetch failed", e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLeads(); }, []);

  const filteredLeads = leads.filter(l => 
    l.visitor_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.agent_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Lead Intelligence Hub</h1>
          <p className="text-slate-500 font-medium mt-1">Monitor and extract every contact your AI has captured.</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search emails or agents..." 
                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all w-64 shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <button onClick={() => window.print()} className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all shadow-sm"><Download size={20} /></button>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xl shadow-black/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-black uppercase text-slate-400 tracking-widest">
                <th className="px-8 py-5">Visitor Email</th>
                <th className="px-6 py-5">Source Agent</th>
                <th className="px-6 py-5">Latest Intent</th>
                <th className="px-6 py-5 text-right">Captured On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                   <td colSpan={4} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                         <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-600 rounded-full animate-spin" />
                         <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Scanning Databases...</p>
                      </div>
                   </td>
                </tr>
              ) : filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-all group cursor-pointer">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner group-hover:scale-110 transition-transform">
                            <Mail size={18} />
                         </div>
                         <span className="font-bold text-slate-700 tracking-tight">{lead.visitor_email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                       <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-tight">
                          <Bot size={12} /> {lead.agent_name}
                       </span>
                    </td>
                    <td className="px-6 py-6 max-w-xs overflow-hidden text-ellipsis whitespace-nowrap">
                       <span className="text-sm font-medium text-slate-500">"{lead.interest_summary}"</span>
                    </td>
                    <td className="px-6 py-6 text-right">
                       <span className="text-[11px] font-bold text-slate-400 uppercase tabular-nums">
                          {new Date(lead.created_at).toLocaleDateString()}
                       </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                   <td colSpan={4} className="px-8 py-24 text-center">
                      <div className="flex flex-col items-center gap-2">
                         <Search className="text-slate-200 mb-2" size={48} />
                         <p className="text-slate-900 font-bold tracking-tight">No leads found</p>
                         <p className="text-sm text-slate-400">Try talking to your agent first!</p>
                      </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
