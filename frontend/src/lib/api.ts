import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// For MVP, we'll use the hardcoded token generated for 'demo_user'
// In a real app, this would come from a login response
const DEMO_TOKEN = '954f728ffc6aa9e5b92f4c0e52dc78b462e101a9';
api.defaults.headers.common['Authorization'] = `Token ${DEMO_TOKEN}`;

// Dynamic Tenant Switching Interceptor
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const tenantId = localStorage.getItem('active_tenant_id');
    if (tenantId) {
      config.headers['X-Tenant-ID'] = tenantId;
    }
  }
  return config;
});

export const setAuthToken = (token: string) => {
  api.defaults.headers.common['Authorization'] = `Token ${token}`;
};

export const setTenantId = (id: string | null) => {
  if (id) localStorage.setItem('active_tenant_id', id);
  else localStorage.removeItem('active_tenant_id');
};

export const getTenants = async () => {
  return api.get('/tenants/');
};

export const createTenant = async (name: string) => {
  return api.post('/tenants/', { name });
};

export const deleteAgent = async (id: number) => {
  return api.delete(`/tenants/${id}/`);
};

export const uploadDocument = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', file.name);

  return api.post('/documents/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getDocuments = async () => {
  return api.get('/documents/');
};

export const sendChatMessage = async (question: string) => {
  return api.post('/chat/', { question });
};

export const getAnalytics = async () => {
  return api.get('/analytics/');
};

export const getWebsites = async () => {
  return api.get('/websites/');
};

export const scrapeWebsite = async (url: string) => {
  return api.post('/websites/', { url });
};

export const deleteDocument = async (id: number) => {
  return api.delete(`/documents/${id}/`);
};

export const deleteWebsite = async (id: number) => {
  return api.delete(`/websites/${id}/`);
};

// --- Marketing Agent API ---

export const getMarketingAgents = async () => {
  return api.get('/marketing-agent/agents/');
};

export const createMarketingAgent = async (data: any) => {
  return api.post('/marketing-agent/agents/', data);
};

export const updateMarketingAgent = async (id: string, data: any) => {
  return api.patch(`/marketing-agent/agents/${id}/`, data);
};

export const deleteMarketingAgent = async (id: string) => {
  return api.delete(`/marketing-agent/agents/${id}/`);
};

export const getMarketingLeads = async (agentId: string) => {
  return api.get(`/marketing-agent/${agentId}/leads/`);
};

export const sendMarketingChat = async (agentKey: string, question: string, sessionId?: string) => {
  return api.post('/marketing-agent/chat/', { question, session_id: sessionId }, {
    headers: {
      'X-Public-API-Key': agentKey
    }
  });
};

export default api;
