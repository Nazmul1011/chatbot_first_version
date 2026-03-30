"use client";
import { useState, useEffect } from "react";
import { Upload, FileText, CheckCircle2, Loader2, Search, Trash2 } from "lucide-react";
import { uploadDocument, getDocuments } from "@/lib/api";

export default function DocumentsPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const fetchDocs = async () => {
    try {
      const { data } = await getDocuments();
      setDocuments(data);
    } catch (err) {
      console.error("Failed to fetch docs", err);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await uploadDocument(file);
      await fetchDocs();
    } catch (err) {
      alert("Upload failed. Make sure the backend is running and DB is configured.");
    } finally {
      setIsUploading(false);
    }
  };

  const filteredDocs = documents.filter(doc => 
    doc.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Knowledge Base</h1>
          <p className="text-sm text-gray-500">Upload PDF or TXT files to train your AI agent</p>
        </div>
        
        <label className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl cursor-pointer transition-all shadow-lg shadow-primary-500/20">
          <Upload size={18} />
          <span>Upload Document</span>
          <input type="file" className="hidden" accept=".pdf,.txt" onChange={handleUpload} disabled={isUploading} />
        </label>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-xs text-gray-400 uppercase tracking-widest border-b border-gray-100 font-bold">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Uploaded</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isUploading && (
                <tr className="bg-primary-50/30 animate-pulse">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <Loader2 className="animate-spin text-primary-500" size={18} />
                    <div className="h-4 bg-gray-200 rounded w-48" />
                  </td>
                  <td colSpan={3} className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-24" />
                  </td>
                </tr>
              )}
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <FileText className="text-gray-400" size={20} />
                    <span className="font-semibold text-gray-900">{doc.title}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(doc.uploaded_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    {doc.is_processed ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                        <CheckCircle2 size={12} />
                        Indexed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full border border-amber-200">
                        <Loader2 className="animate-spin" size={12} />
                        Processing
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button className="p-2 text-gray-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 size={18} />
                    </button>
                    <button className="text-primary-600 font-semibold text-sm hover:underline ml-2">Open</button>
                  </td>
                </tr>
              ))}
              {filteredDocs.length === 0 && !isUploading && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                    No documents found. Upload your first knowledge piece.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
