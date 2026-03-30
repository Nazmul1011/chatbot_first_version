"use client";
import { useEffect, useState } from "react";
import { getAnalytics, getDocuments, getWebsites } from "@/lib/api";
import { FileText, Globe, MessageSquare, Clock, Bot } from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    documents: 0,
    websites: 0,
    queries: 0,
    avgResponse: "0",
    successRate: 100,
  });
  const [loading, setLoading] = useState(true);
  const [agentName, setAgentName] = useState("Your Agent");

  useEffect(() => {
    // Read active agent name from localStorage
    const stored = localStorage.getItem('active_tenant_id');
    const name = localStorage.getItem(`tenant_name_${stored}`) || "Your Agent";
    setAgentName(name);

    const fetchData = async () => {
      try {
        const [analyticsRes, docsRes, sitesRes] = await Promise.all([
          getAnalytics(),
          getDocuments(),
          getWebsites(),
        ]);
        setStats({
          documents: docsRes.data.length,
          websites: sitesRes.data.length,
          queries: analyticsRes.data.total_queries,
          avgResponse: analyticsRes.data.avg_response_time.toString(),
          successRate: analyticsRes.data.success_rate,
        });
      } catch (err) {
        // New/empty agent — show zeroes
        setStats({ documents: 0, websites: 0, queries: 0, avgResponse: "0", successRate: 100 });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { label: "Total Documents", value: loading ? "..." : stats.documents, icon: FileText, color: "bg-blue-50 text-blue-600" },
    { label: "Website Sources", value: loading ? "..." : stats.websites, icon: Globe,    color: "bg-sky-50 text-sky-600" },
    { label: "Total Queries",   value: loading ? "..." : stats.queries,   icon: MessageSquare, color: "bg-violet-50 text-violet-600" },
    { label: "Avg Response",    value: loading ? "..." : `${stats.avgResponse}s`, icon: Clock, color: "bg-emerald-50 text-emerald-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-900 rounded-2xl p-6 text-white flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Bot size={24} />
        </div>
        <div>
          <p className="text-blue-200 text-sm font-semibold uppercase tracking-wider">Active Agent</p>
          <h2 className="text-2xl font-bold">{agentName}</h2>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:-translate-y-1 transition-transform">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <Icon size={18} />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
            </div>
          );
        })}
      </div>

      {/* Status Panel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">Agent Status</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {[
            {
              label: "Knowledge Base",
              desc: stats.documents + stats.websites === 0
                ? "No sources indexed yet — upload a PDF or add a website URL."
                : `${stats.documents} PDF(s) + ${stats.websites} website(s) indexed and ready.`,
              dot: stats.documents + stats.websites === 0 ? "bg-amber-400" : "bg-emerald-500",
            },
            {
              label: "Query Engine",
              desc: stats.queries === 0
                ? "No queries received yet for this agent."
                : `${stats.queries} total queries handled — Success Rate: ${stats.successRate}%`,
              dot: "bg-emerald-500",
            },
            {
              label: "Agent Isolation",
              desc: "All data is strictly isolated. Switching agents shows only their data.",
              dot: "bg-blue-500",
            },
          ].map((item, i) => (
            <div key={i} className="px-6 py-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${item.dot}`} />
              <div>
                <p className="text-sm font-bold text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
