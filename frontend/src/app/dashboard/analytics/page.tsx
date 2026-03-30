"use client";
import { useState, useEffect } from "react";
import { BarChart2, TrendingUp, MessageSquare, Clock, Users, Zap } from "lucide-react";
import { getAnalytics } from "@/lib/api";

type AnalyticsData = {
  total_queries: number;
  avg_response_time: number;
  success_rate: number;
  weekly_data: { day: string; queries: number }[];
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await getAnalytics();
        setData(response.data);
      } catch (error) {
        console.error("Failed to load analytics", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <div className="p-8 space-y-8 flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const maxQueries = Math.max(...data.weekly_data.map((d) => d.queries), 1);

  const stats = [
    { label: "Total Queries", value: data.total_queries.toString(), change: "Live data", icon: MessageSquare, color: "text-blue-500" },
    { label: "Avg Response Time", value: `${data.avg_response_time}s`, change: "Real-time", icon: Clock, color: "text-green-500" },
    { label: "Active Users", value: "1", change: "Demo User", icon: Users, color: "text-purple-500" },
    { label: "Success Rate", value: `${data.success_rate}%`, change: "Real-time", icon: Zap, color: "text-yellow-500" },
  ];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
        <p className="text-gray-500 mt-1">Real-time performance metrics for your AI agent</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">{stat.label}</p>
                <Icon className={stat.color} size={20} />
              </div>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              <p className={`text-sm mt-2 font-medium text-gray-400`}>
                {stat.change}
              </p>
            </div>
          );
        })}
      </div>

      {/* Bar Chart */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart2 size={20} className="text-primary-600" />
          <h3 className="font-semibold text-gray-900">Weekly Query Volume</h3>
        </div>
        <div className="flex items-end gap-4 h-48">
          {data.weekly_data.map((d) => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs text-gray-500">{d.queries}</span>
              <div
                className="w-full bg-primary-500 rounded-t-md transition-all hover:bg-primary-600"
                style={{ height: `${(d.queries / maxQueries) * 100}%`, minHeight: d.queries > 0 ? "4px" : "0" }}
              />
              <span className="text-xs font-medium text-gray-600">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trend */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={20} className="text-green-500" />
          <h3 className="font-semibold text-gray-900">Key Insights</h3>
        </div>
        <ul className="space-y-3 text-sm text-gray-600">
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            Live data tracking is now active.
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full" />
            {data.success_rate}% of queries resolved without escalation — RAG pipeline is healthy.
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full" />
            Average response time is {data.avg_response_time} seconds.
          </li>
        </ul>
      </div>
    </div>
  );
}
