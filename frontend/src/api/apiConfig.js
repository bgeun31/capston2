// src/api/apiConfig.js
import axios from 'axios';

// Lambda API 엔드포인트
const URL_ENDPOINT = 'https://83xt4e7ki5.execute-api.ap-northeast-2.amazonaws.com/capston_backend';
let backendBaseUrl = null;

export const getBackendUrl = async () => {
  if (backendBaseUrl) {
    return backendBaseUrl;
  }
  
  try {
    const response = await axios.get(URL_ENDPOINT);
    backendBaseUrl = response.data.url;
    console.log('Backend URL loaded:', backendBaseUrl);
    return backendBaseUrl;
  } catch (error) {
    console.error('Failed to get backend URL:', error);
    throw error;
  }
};

export const apiClient = {
  get: async (endpoint) => {
    const baseUrl = await getBackendUrl();
    return axios.get(`${baseUrl}${endpoint}`);
  },
  post: async (endpoint, data) => {
    const baseUrl = await getBackendUrl();
    return axios.post(`${baseUrl}${endpoint}`, data);
  },
};



