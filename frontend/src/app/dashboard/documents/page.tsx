"use client";
import { useState, useEffect } from "react";
import { Upload, FileText, CheckCircle2, Loader2, Search, Trash2 } from "lucide-react";
import { uploadDocument, getDocuments, getWebsites, scrapeWebsite, deleteDocument, deleteWebsite } from "@/lib/api";

export default function DocumentsPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [websites, setWebsites] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [urlInput, setUrlInput] = useState("");

  const fetchData = async () => {
    try {
      const [docsRes, sitesRes] = await Promise.all([getDocuments(), getWebsites()]);
      setDocuments(docsRes.data);
      setWebsites(sitesRes.data);
    } catch (err) {
      console.error("Failed to fetch data", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      await uploadDocument(file);
      await fetchData();
    } catch (err) {
      alert("Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleScrape = async () => {
    if (!urlInput) return;
    setIsScraping(true);
    try {
      await scrapeWebsite(urlInput);
      setUrlInput("");
      await fetchData();
    } catch (err) {
      const errorData = (err as any).response?.data;
      const errorMsg = errorData?.url?.[0] || errorData?.error || "Check your URL and try session again.";
      alert("Scraping failed: " + errorMsg);
    } finally {
      setIsScraping(false);
    }
  };

  const handleDeleteDoc = async (id: number) => {
    if (!confirm("Are you sure you want to delete this document? This cannot be undone.")) return;
    try {
      await deleteDocument(id);
      await fetchData();
    } catch (err) {
      alert("Failed to delete document.");
    }
  };

  const handleDeleteWebsite = async (id: number) => {
    if (!confirm("Are you sure you want to delete this website source?")) return;
    try {
      await deleteWebsite(id);
      await fetchData();
    } catch (err) {
      alert("Failed to delete website source.");
    }
  };

  const filteredDocs = documents.filter(doc => doc.title.toLowerCase().includes(search.toLowerCase()));
  const filteredSites = websites.filter(site => site.url.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 pb-20">
      {/* Search Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-1/2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search knowledge sources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition-all"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
           <label className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl cursor-pointer transition-all shadow-lg shadow-primary-500/20">
            <Upload size={18} />
            <span>Upload PDF</span>
            <input type="file" className="hidden" accept=".pdf,.txt" onChange={handleUpload} disabled={isUploading} />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Documents Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/30">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <FileText size={18} className="text-primary-600" />
                Files & Documents
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <tbody className="divide-y divide-gray-100">
                  {filteredDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50 group transition-colors">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <div className="h-8 w-8 bg-primary-50 text-primary-600 rounded-lg flex items-center justify-center">
                          <FileText size={16} />
                        </div>
                        <span className="font-semibold text-gray-900">{doc.title}</span>
                      </td>
                      <td className="px-6 py-4">
                        {doc.is_processed ? (
                          <span className="text-emerald-600 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                            <CheckCircle2 size={14} /> Indexed
                          </span>
                        ) : (
                          <span className="text-amber-600 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                            <Loader2 size={14} className="animate-spin" /> Processing
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDeleteDoc(doc.id)}
                          className="p-2 text-gray-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100" title="Delete Source"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredDocs.length === 0 && (
                    <tr className="text-gray-400 text-sm italic">
                      <td colSpan={3} className="px-6 py-8 text-center">No PDFs uploaded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Websites Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/30">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Search size={18} className="text-primary-600" />
                Website Sources
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <tbody className="divide-y divide-gray-100">
                  {filteredSites.map((site) => (
                    <tr key={site.id} className="hover:bg-gray-50 group transition-colors">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <div className="h-8 w-8 bg-sky-50 text-sky-600 rounded-lg flex items-center justify-center">
                          <Upload size={16} />
                        </div>
                        <span className="font-medium text-gray-700 truncate max-w-[300px]">{site.url}</span>
                      </td>
                      <td className="px-6 py-4">
                        {site.is_processed ? (
                          <span className="text-emerald-600 text-xs font-bold">Indexed</span>
                        ) : (
                          <span className="text-amber-600 text-xs font-bold flex items-center gap-1">
                            <Loader2 size={12} className="animate-spin" /> Scraping
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDeleteWebsite(site.id)}
                          className="p-2 text-gray-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100" title="Delete Source"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredSites.length === 0 && (
                    <tr className="text-gray-400 text-sm italic">
                      <td colSpan={3} className="px-6 py-8 text-center">No website links added yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Action Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-blue-500/5 relative overflow-hidden">
            {/* Subtle background decoration */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-50"></div>
            
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500 rounded-xl text-white shadow-lg shadow-blue-500/30">
                  <Search size={22} />
                </div>
                <h3 className="font-bold text-xl text-gray-900">Website Import</h3>
              </div>
              
              <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                Enter a public URL below. Our AI will automatically scrape and learn from the content in seconds.
              </p>
              
              <div className="space-y-4">
                <div className="relative">
                  <input 
                    type="url"
                    placeholder="https://company.com/about"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 placeholder:text-gray-400 text-gray-700 transition-all font-medium"
                  />
                </div>
                
                <button 
                  onClick={handleScrape}
                  disabled={isScraping || !urlInput}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-blue-600/20 active:scale-[0.98]"
                >
                  {isScraping ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Upload size={20} />
                  )}
                  <span>{isScraping ? "Scraping Data..." : "Index Website Content"}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100/50">
            <div className="flex items-center gap-2 mb-2 text-amber-800">
              <span className="text-lg">💡</span>
              <h4 className="font-bold text-sm">Pro Tip</h4>
            </div>
            <p className="text-xs text-amber-700/80 leading-relaxed font-medium">
              For the best AI answers, index specific pages like **"About Us"**, **"FAQs"**, or **"Services"** instead of just the main page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
