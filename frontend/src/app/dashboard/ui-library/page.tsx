"use client";
import React, { useState } from "react";
import { Check, Layout, Palette, Image as ImageIcon, Sparkles, MoveRight, Monitor, MessageSquare } from "lucide-react";
import { clsx } from "clsx";

const templates = [
  {
    id: "default",
    name: "Classic Force",
    description: "The premium shadow-rich look of your main dashboard.",
    color: "#0F172A",
    preview: (
      <div className="w-full h-40 bg-slate-900/5 rounded-2xl flex flex-col p-4 gap-3 overflow-hidden border border-slate-100">
        <div className="bg-white px-3 py-2 rounded-[1rem] shadow-sm flex items-center gap-2 self-center w-fit border border-slate-50">
          <div className="w-6 h-6 bg-slate-800 rounded-full flex items-center justify-center shrink-0"><Sparkles size={10} className="text-pink-200" /></div>
          <div className="text-[9px] font-bold text-slate-800">AI Agent</div>
        </div>
        <div className="self-start bg-white p-3 rounded-[1rem] text-[10px] shadow-sm border border-slate-50 text-slate-600 max-w-[80%] font-medium">Hello! I'm your AI...</div>
        <div className="self-end bg-slate-800 p-2.5 rounded-[1rem] text-[10px] text-white shadow-md max-w-[60%]">How are you?</div>
      </div>
    ),
    features: ["Classic Pills", "Shadow Transitions", "Dark Accents"]
  },
  {
    id: "minimal",
    name: "Text Minimal",
    description: "The sleek, modern aesthetic with bright blue accents.",
    color: "#006CFF",
    preview: (
      <div className="w-full h-40 bg-[#f4f4f5] rounded-2xl flex flex-col p-4 gap-3 overflow-hidden border border-slate-200">
        <div className="bg-white px-3 py-2 rounded-[1.5rem] shadow-sm flex items-center gap-2 self-center w-fit">
          <div className="w-6 h-6 bg-[#1E2330] rounded-full flex items-center justify-center shrink-0"><Sparkles size={10} className="text-pink-300" /></div>
          <div className="text-[9px] font-bold text-slate-900">Text Support</div>
        </div>
        <div className="self-start text-[10px] text-slate-600 font-semibold max-w-[85%] pt-1">Good morning! welcome to...</div>
        <div className="self-end bg-[#006CFF] p-2.5 rounded-[1rem] text-[10px] text-white shadow-sm max-w-[70%] font-medium">Hey do you know me?</div>
      </div>
    ),
    features: ["Borderless Chat", "Thin Input", "Bright Accents"]
  },
  {
    id: "glass",
    name: "Glassmorphic",
    description: "Ultra-modern translucent design with soft blurs.",
    color: "#7C3AED",
    preview: (
      <div className="w-full h-40 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex flex-col p-4 gap-3 overflow-hidden border border-white/20 shadow-inner">
        <div className="bg-white/40 backdrop-blur-md px-3 py-2 rounded-[1rem] border border-white/50 flex items-center gap-2 self-center w-fit">
          <Sparkles size={12} className="text-purple-600" />
          <div className="text-[9px] font-black text-purple-900 uppercase tracking-widest leading-none">Glass Bot</div>
        </div>
        <div className="self-start bg-white/30 backdrop-blur-sm p-3 rounded-[1rem] text-[10px] border border-white/50 text-purple-900 max-w-[80%] font-medium">Step into the future...</div>
        <div className="self-end bg-purple-600/80 backdrop-blur-sm p-2.5 rounded-[1rem] text-[10px] text-white border border-white/20 max-w-[70%] shadow-lg shadow-purple-500/10">Hello world!</div>
      </div>
    ),
    features: ["Backdrop Blur", "Gradient Avatars", "Soft Outlines"]
  }
];

export default function UILibraryPage() {
  const [selectedTemplate, setSelectedTemplate] = useState("default");
  const [customColor, setCustomColor] = useState("#006CFF");
  const [isSaving, setIsSaving] = useState(false);

  const handleSelect = (id: string) => {
    setSelectedTemplate(id);
    localStorage.setItem("pending_ui_template", id);
  };

  const saveConfiguration = () => {
    setIsSaving(true);
    // Simulate API delay
    setTimeout(() => {
      setIsSaving(false);
      alert("Design style selected! Any new agent you create will now use this look.");
    }, 1200);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
          <Palette className="text-blue-600" /> UI Design Library
        </h1>
        <p className="text-slate-500 text-lg max-w-2xl">
          Choose a visual DNA for your agents. Select a pre-built UI style below to apply it to your future agents.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {templates.map((template) => (
          <div 
            key={template.id}
            onClick={() => handleSelect(template.id)}
            className={clsx(
              "group relative bg-white rounded-3xl border-2 p-8 transition-all duration-500 cursor-pointer hover:shadow-2xl hover:shadow-blue-500/10",
              selectedTemplate === template.id 
                ? "border-blue-500 ring-4 ring-blue-50" 
                : "border-slate-100 hover:border-slate-300"
            )}
          >
            {selectedTemplate === template.id && (
              <div className="absolute -top-3 -right-3 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-xl animate-in zoom-in duration-300">
                <Check size={18} strokeWidth={3} />
              </div>
            )}

            <div className="mb-6 transform group-hover:scale-[1.02] transition-transform">
              {template.preview}
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-2">{template.name}</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-6 font-medium">
              {template.description}
            </p>

            <div className="space-y-3">
              {template.features.map(f => (
                <div key={f} className="flex items-center gap-2 text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                  {f}
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50">
              <button className={clsx(
                "w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2",
                selectedTemplate === template.id 
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30" 
                  : "bg-slate-50 text-slate-500 hover:bg-slate-100"
              )}>
                {selectedTemplate === template.id ? "Target Selected" : "Preview Style"}
                <MoveRight size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] -mr-48 -mt-48 group-hover:bg-blue-500/20 transition-all duration-1000" />
        
        <div className="relative z-10 space-y-4">
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <Sparkles className="text-blue-400" /> Apply Global Design
          </h2>
          <p className="text-slate-400 max-w-md font-medium leading-relaxed">
            Ready to deploy this look? Clicking the button below will lock-in the 
            <span className="text-white mx-1">"{templates.find(t => t.id === selectedTemplate)?.name}"</span> 
            style for your next agent creation.
          </p>
        </div>

        <button 
          onClick={saveConfiguration}
          disabled={isSaving}
          className="relative z-10 px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-extrabold shadow-xl shadow-blue-900/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-3 disabled:opacity-50"
        >
          {isSaving ? "Finalizing DNA..." : "Lock-in Selected UI"}
          <MoveRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="bg-white p-8 rounded-[2rem] border border-slate-100 space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800"><Palette size={20} /> Accent Control</h3>
            <div className="flex items-center gap-4">
               <input 
                  type="color" 
                  value={customColor} 
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="w-14 h-14 rounded-xl border-none p-0 cursor-pointer bg-transparent" 
               />
               <div>
                  <p className="font-bold text-slate-700">{customColor.toUpperCase()}</p>
                  <p className="text-xs text-slate-400 uppercase font-black tracking-widest mt-1">Active hex color</p>
               </div>
            </div>
         </div>
         <div className="bg-white p-8 rounded-[2rem] border border-slate-100 space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800"><ImageIcon size={20} /> Default Identity</h3>
            <div className="flex items-center gap-6">
               <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-300">
                  <ImageIcon className="text-slate-400" />
               </div>
               <div>
                  <button className="px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-all">Upload Avatar</button>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tighter mt-2">Max 2MB (SVG, PNG, JPG)</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
