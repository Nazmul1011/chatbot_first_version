"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BarChart3, 
  FileText, 
  MessageSquare, 
  LayoutDashboard, 
  Settings, 
  LogOut,
  Bot
} from "lucide-react";
import { clsx } from "clsx";
import ChatWidget from "@/components/ChatWidget";
import TenantSwitcher from "@/components/TenantSwitcher";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
  { icon: FileText, label: "Documents", href: "/dashboard/documents" },
  { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics" },
  { icon: MessageSquare, label: "Test Agent", href: "/dashboard/test-agent" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3 mb-4">
          <Bot className="text-blue-500" />
          <span className="font-bold text-xl tracking-tight">AgentFlow</span>
        </div>

        <div className="px-4">
          <TenantSwitcher />
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link 
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all",
                pathname === item.href 
                  ? "bg-primary-600/20 text-primary-400 border border-primary-600/30" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <button className="flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white transition-colors w-full">
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-auto">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-gray-800">
            {navItems.find(item => item.href === pathname)?.label || "Dashboard"}
          </h2>
          <div className="flex items-center gap-4">
             {/* Header icons or user profile can go here */}
          </div>
        </header>
        

        <div className="p-8">
          {children}
        </div>

        {/* Floating Chat Widget */}
        <ChatWidget />
      </main>
    </div>
  );
}
