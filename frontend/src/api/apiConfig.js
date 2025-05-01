// src/api/apiConfig.js
import axios from 'axios';

// 고정 백엔드 URL 사용
const backendBaseUrl = 'https://llama-lucky-mullet.ngrok-free.app';

export const apiClient = {
  get: async (endpoint) => {
    return axios.get(`${backendBaseUrl}${endpoint}`);
  },
  post: async (endpoint, data) => {
    return axios.post(`${backendBaseUrl}${endpoint}`, data);
  },
};



