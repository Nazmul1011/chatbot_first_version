"use client";
import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, MessageSquare, Clock, Users, Zap, Calendar, ArrowUpRight, Bot } from "lucide-react";
import { getAnalytics } from "@/lib/api";
import { clsx } from "clsx";

type AnalyticsData = {
  total_queries: number;
  avg_response_time: number;
  success_rate: number;
  weekly_data: { day: string; queries: number }[];
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [agentName, setAgentName] = useState("Your Agent");

  useEffect(() => {
    // Read Agent Name from localStorage
    const activeId = localStorage.getItem('active_tenant_id');
    const name = localStorage.getItem(`tenant_name_${activeId}`) || "Your Agent";
    setAgentName(name);

    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const response = await getAnalytics();
        setData(response.data);
      } catch (error) {
        // Fallback for new agents/no data
        setData({
          total_queries: 0,
          avg_response_time: 0,
          success_rate: 100,
          weekly_data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => ({ day, queries: 0 }))
        });
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const displayData: AnalyticsData = data ?? {
    total_queries: 0,
    avg_response_time: 0,
    success_rate: 100,
    weekly_data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => ({ day, queries: 0 }))
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const maxQueries = Math.max(...displayData.weekly_data.map((d) => d.queries), 1);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* High-End Agent Banner */}
      <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl border border-slate-800">
        <div className="absolute top-[-50%] right-[-10%] w-[50%] h-[200%] bg-blue-600/10 blur-[100px] rotate-[-15deg]" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-blue-600 rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Bot size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-blue-400 font-bold uppercase tracking-[0.2em] text-[10px]">Command Center</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight mt-1">{agentName} <span className="text-slate-500">Analytics</span></h2>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/50 backdrop-blur-md px-5 py-3 rounded-2xl border border-slate-700/50">
            <Calendar size={18} className="text-blue-400" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Reporting</span>
              <span className="text-sm font-bold text-slate-200">Last 7 Days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[
          { label: "Total Queries", value: displayData.total_queries, icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Avg Response", value: `${displayData.avg_response_time}s`, icon: Clock, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Success Rate", value: `${displayData.success_rate}%`, icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "Online Users", value: "1", icon: Users, color: "text-violet-500", bg: "bg-violet-500/10" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:-translate-y-1 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{stat.label}</p>
              <div className={clsx("w-9 h-9 rounded-xl flex items-center justify-center", stat.bg)}>
                <stat.icon className={stat.color} size={18} />
              </div>
            </div>
            <h3 className="text-3xl font-black text-gray-900">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Main Chart Card */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
            <BarChart3 size={20} />
          </div>
          <h3 className="font-black text-xl text-gray-900 uppercase tracking-tight">Query Volume</h3>
        </div>

        <div className="flex items-end gap-3 md:gap-6 h-64 px-4 border-b border-gray-50 pb-2">
          {displayData.weekly_data.map((d) => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-4 group">
              <div className="relative w-full flex flex-col items-center">
                <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all">
                  {d.queries}
                </div>
                <div
                  className="w-full bg-gradient-to-t from-blue-600 to-sky-400 rounded-t-xl transition-all duration-700 hover:brightness-110 shadow-lg shadow-blue-500/10"
                  style={{ height: `${(d.queries / maxQueries) * 100}%`, minHeight: d.queries > 0 ? "8px" : "4px" }}
                />
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase">{d.day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
