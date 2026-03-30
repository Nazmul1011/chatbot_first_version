"use client";
import { useState, useEffect } from "react";
import { getTenants, createTenant, setTenantId, deleteAgent } from "@/lib/api";
import { Plus, Copy, Check, Bot, Key, Code2, Loader2, Trash2 } from "lucide-react";

type Agent = {
  id: number;
  name: string;
  subdomain: string;
  public_api_key: string;
  created_at: string;
};

export default function SettingsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setActiveId(localStorage.getItem("active_tenant_id"));
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const { data } = await getTenants();
      setAgents(data);
    } catch {
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const { data } = await createTenant(newName.trim());
      setNewName("");
      await fetchAgents();
      // auto-switch to new agent
      setTenantId(data.id.toString());
      localStorage.setItem(`tenant_name_${data.id}`, data.name);
      window.location.reload();
    } catch (err) {
      alert("Failed to create agent.");
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSwitch = (agent: Agent) => {
    setTenantId(agent.id.toString());
    localStorage.setItem(`tenant_name_${agent.id}`, agent.name);
    window.location.reload();
  };

  const handleDelete = async (agent: Agent) => {
    if (!confirm(`Delete "${agent.name}" and ALL its data (documents, websites, AI memory)? This cannot be undone.`)) return;
    try {
      await deleteAgent(agent.id);
      // If we deleted the active agent, switch to the first remaining one
      if (agent.id.toString() === activeId) {
        const remaining = agents.filter(a => a.id !== agent.id);
        if (remaining.length > 0) {
          setTenantId(remaining[0].id.toString());
          localStorage.setItem(`tenant_name_${remaining[0].id}`, remaining[0].name);
        } else {
          localStorage.removeItem('active_tenant_id');
        }
        window.location.reload();
      } else {
        await fetchAgents();
      }
    } catch {
      alert("Failed to delete agent.");
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Agent Manager</h2>
        <p className="text-gray-500 mt-1">Create agents, copy their API keys, and manage embed scripts.</p>
      </div>

      {/* Create New Agent */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Plus size={18} className="text-blue-600" /> Create New Agent
        </h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="e.g. TechStore, Hotel Sunrise, Law Firm..."
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-gray-800 font-medium"
          />
          <button
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-600/20"
          >
            {creating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            {creating ? "Creating..." : "Create Agent"}
          </button>
        </div>
      </div>

      {/* Agent List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={28} className="animate-spin text-blue-600" />
          </div>
        ) : (
          agents.map((agent) => {
            const isActive = agent.id.toString() === activeId;
            const embedScript = `<script\n  src="http://localhost:3000/embed.js"\n  data-api-key="${agent.public_api_key}"\n  async>\n</script>`;

            return (
              <div
                key={agent.id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                  isActive ? "border-blue-500 ring-2 ring-blue-500/20" : "border-gray-100"
                }`}
              >
                {/* Agent Header */}
                <div className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shadow-md ${isActive ? "bg-blue-600" : "bg-slate-700"}`}>
                      {agent.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900">{agent.name}</p>
                        {isActive && (
                          <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Active</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">Created {new Date(agent.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isActive && (
                      <button
                        onClick={() => handleSwitch(agent)}
                        className="px-4 py-2 text-sm font-bold text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-all"
                      >
                        Switch
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(agent)}
                      disabled={isActive && agents.length === 1}
                      title={isActive ? "Switch to another agent before deleting" : "Delete this agent"}
                      className={`p-2 rounded-xl border transition-all ${
                        isActive
                          ? "border-gray-100 text-gray-300 cursor-not-allowed"
                          : "border-rose-100 text-rose-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300"
                      }`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* API Key Row */}
                <div className="px-5 pb-3">
                  <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Key size={14} className="text-gray-400 flex-shrink-0" />
                      <p className="text-xs font-mono text-gray-600 truncate">{agent.public_api_key}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(agent.public_api_key, agent.id)}
                      className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-all"
                    >
                      {copiedId === agent.id ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                      {copiedId === agent.id ? "Copied!" : "Copy Key"}
                    </button>
                  </div>
                </div>

                {/* Embed Script */}
                <div className="px-5 pb-5">
                  <div className="bg-slate-900 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Code2 size={13} />
                        <span className="text-xs font-mono">Embed Script</span>
                      </div>
                      <button
                        onClick={() => handleCopy(embedScript, agent.id * -1)}
                        className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                      >
                        {copiedId === agent.id * -1 ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                        {copiedId === agent.id * -1 ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <pre className="px-4 py-3 text-xs text-green-400 font-mono overflow-x-auto whitespace-pre">{embedScript}</pre>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
