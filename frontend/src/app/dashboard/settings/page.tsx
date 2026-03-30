"use client";
import { useState, useEffect } from "react";
import { Save, Bell, Shield, Globe, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const [agentName, setAgentName] = useState("Acme Support Bot");
  const [greeting, setGreeting] = useState("Hi! How can I help you today?");
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [strictMode, setStrictMode] = useState(true);
  const [saved, setSaved] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const savedName = localStorage.getItem('chatAgent_agentName');
    const savedGreeting = localStorage.getItem('chatAgent_greeting');
    const savedEmail = localStorage.getItem('chatAgent_emailNotifs');
    const savedStrict = localStorage.getItem('chatAgent_strictMode');

    if (savedName) setAgentName(savedName);
    if (savedGreeting) setGreeting(savedGreeting);
    if (savedEmail !== null) setEmailNotifs(savedEmail === 'true');
    if (savedStrict !== null) setStrictMode(savedStrict === 'true');
  }, []);

  const handleSave = () => {
    localStorage.setItem('chatAgent_agentName', agentName);
    localStorage.setItem('chatAgent_greeting', greeting);
    localStorage.setItem('chatAgent_emailNotifs', emailNotifs.toString());
    localStorage.setItem('chatAgent_strictMode', strictMode.toString());
    
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!isClient) return null;

  return (
    <div className="p-8 space-y-8 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-500 mt-1">Configure your AI agent&apos;s behavior</p>
      </div>

      {/* Agent Config */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <Globe size={18} className="text-primary-600" />
          <h3 className="font-semibold text-gray-900">Agent Configuration</h3>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Agent Name</label>
          <input
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Greeting Message</label>
          <textarea
            rows={3}
            value={greeting}
            onChange={(e) => setGreeting(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm resize-none"
          />
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Bell size={18} className="text-primary-600" />
          <h3 className="font-semibold text-gray-900">Notifications</h3>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Email Notifications</p>
            <p className="text-xs text-gray-500">Receive daily digest of agent activity</p>
          </div>
          <button
            onClick={() => setEmailNotifs(!emailNotifs)}
            className={`w-12 h-6 rounded-full transition-colors ${emailNotifs ? "bg-primary-500" : "bg-gray-200"}`}
          >
            <span
              className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${emailNotifs ? "translate-x-6" : "translate-x-0"}`}
            />
          </button>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield size={18} className="text-primary-600" />
          <h3 className="font-semibold text-gray-900">Security & Privacy</h3>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Strict Context Mode</p>
            <p className="text-xs text-gray-500">Agent only answers from uploaded documents</p>
          </div>
          <button
            onClick={() => setStrictMode(!strictMode)}
            className={`w-12 h-6 rounded-full transition-colors ${strictMode ? "bg-primary-500" : "bg-gray-200"}`}
          >
            <span
              className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${strictMode ? "translate-x-6" : "translate-x-0"}`}
            />
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <button className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 transition-colors">
          <Trash2 size={16} />
          Delete all knowledge base data
        </button>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all ${saved ? "bg-green-500" : "bg-primary-600 hover:bg-primary-700"}`}
        >
          <Save size={16} />
          {saved ? "Saved!" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
