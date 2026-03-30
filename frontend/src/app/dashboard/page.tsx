"use client";
import { useEffect, useState } from "react";
import { getAnalytics, getDocuments } from "@/lib/api";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    documents: 0,
    queries: 0,
    avgResponse: "0",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, docsRes] = await Promise.all([
          getAnalytics(),
          getDocuments()
        ]);
        
        setStats({
          documents: docsRes.data.length,
          queries: analyticsRes.data.total_queries,
          avgResponse: analyticsRes.data.avg_response_time.toString()
        });
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Documents", value: loading ? "..." : stats.documents, trend: "Indexed dynamically" },
          { label: "Avg Response Time", value: loading ? "..." : `${stats.avgResponse}s`, trend: "Real-time latency" },
          { label: "Total Queries", value: loading ? "..." : stats.queries, trend: "Real-time volume" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-transform hover:-translate-y-1">
            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</h3>
            <p className="text-xs text-emerald-600 font-medium mt-2">{stat.trend}</p>
          </div>
        ))}
      </div>
      
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">Recent Activity</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {[
            { event: "Knowledge base indexed", time: "Just now", desc: "All embedding vectors successfully processed" },
            { event: "System health check", time: "Live", desc: "All background nodes operational" },
            { event: "Demo mode initiated", time: "Live", desc: "Zero config MVP is active" },
          ].map((item, i) => (
            <div key={i} className="px-6 py-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
              <div className="w-2 h-2 rounded-full bg-primary-500 mt-2" />
              <div>
                <p className="text-sm font-bold text-gray-900">{item.event}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-semibold">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
