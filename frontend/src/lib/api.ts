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

export const setAuthToken = (token: string) => {
  api.defaults.headers.common['Authorization'] = `Token ${token}`;
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

export default api;
