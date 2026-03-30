"use client";
import { useState, useEffect } from "react";
import { Users, ChevronDown, Check } from "lucide-react";
import { getTenants, setTenantId } from "@/lib/api";

export default function TenantSwitcher() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const { data } = await getTenants();
        setTenants(data);
        const stored = localStorage.getItem('active_tenant_id');
        if (stored) {
          setActiveId(stored);
        } else if (data && data.length > 0) {
          // If none stored, pick the first one and REFRESH once to sync context
          const firstId = data[0].id.toString();
          setTenantId(firstId);
          setActiveId(firstId);
          window.location.reload(); 
        }
      } catch (err) {
        setTenants([]);
      }
    };
    fetchTenants();
  }, []);

  const handleSwitch = (id: number, name: string) => {
    setTenantId(id.toString());
    setActiveId(id.toString());
    // Store name so Overview can display it without an API call
    localStorage.setItem(`tenant_name_${id}`, name);
    setIsOpen(false);
    window.location.reload(); 
  };

  const activeTenant = tenants.length > 0 
    ? (tenants.find(t => t.id.toString() === activeId) || tenants[0]) 
    : null;

  return (
    <div className="relative mb-6">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-sm text-white shadow-lg shadow-blue-500/20 uppercase">
             {activeTenant?.name?.charAt(0) || "A"}
          </div>
          <div className="text-left overflow-hidden">
            <p className="text-xs text-blue-200 font-bold uppercase tracking-widest">Active Agent</p>
            <p className="text-sm font-bold text-white truncate">{activeTenant?.name || "Loading..."}</p>
          </div>
        </div>
        <ChevronDown size={16} className={`text-blue-200 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl z-[100] py-2 animate-in fade-in zoom-in duration-200 origin-top">
          <p className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-700 mb-1">Switch Managed Agent</p>
          <div className="max-height-[240px] overflow-y-auto custom-scrollbar">
            {tenants.map((t) => (
              <button
                key={t.id}
                onClick={() => handleSwitch(t.id, t.name)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700/50 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                   <div className="w-6 h-6 bg-slate-700 text-slate-400 group-hover:bg-blue-500 group-hover:text-white rounded flex items-center justify-center text-[10px] font-bold transition-all">
                     {t.name.charAt(0)}
                   </div>
                   <span className={`text-sm font-medium ${t.id.toString() === activeId ? 'text-white' : 'text-slate-400'}`}>
                     {t.name}
                   </span>
                </div>
                {t.id.toString() === activeId && <Check size={14} className="text-blue-500" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
