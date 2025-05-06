// src/api/apiConfig.js
import axios from 'axios';

// 고정 백엔드 URL 사용 
const backendBaseUrl =
  process.env.REACT_APP_API_BASE || 'http://localhost:8000';

// 디버깅용 로그 활성화
const debugMode = true;

// axios 인스턴스 생성
const axiosInstance = axios.create({
  baseURL: backendBaseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// 요청 인터셉터 추가
axiosInstance.interceptors.request.use(
  config => {
    // API 경로 앞에 슬래시 추가 확인
    if (config.url && !config.url.startsWith('/')) {
      config.url = '/' + config.url;
    }
    
    // 전체 URL 출력 (디버깅용)
    if (debugMode) {
      console.log(`API 요청: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
      console.log('요청 헤더:', config.headers);
    }
    return config;
  },
  error => {
    if (debugMode) {
      console.error('API 요청 오류:', error);
    }
    return Promise.reject(error);
  }
);

// 응답 인터셉터 추가
axiosInstance.interceptors.response.use(
  response => {
    if (debugMode) {
      console.log(`API 응답 (${response.status}):`, response.data);
    }
    return response;
  },
  error => {
    if (debugMode) {
      if (error.response) {
        console.error(`API 오류 (${error.response.status}):`, error.response.data);
      } else if (error.request) {
        console.error('응답을 받지 못했습니다:', error.request);
      } else {
        console.error('요청 설정 중 오류:', error.message);
      }
    }
    return Promise.reject(error);
  }
);

export const apiClient = {
  get: async (endpoint) => {
    try {
      return await axiosInstance.get(endpoint);
    } catch (error) {
      console.error(`GET ${endpoint} 요청 실패:`, error);
      throw error;
    }
  },
  post: async (endpoint, data) => {
    try {
      return await axiosInstance.post(endpoint, data);
    } catch (error) {
      console.error(`POST ${endpoint} 요청 실패:`, error);
      throw error;
    }
  },
};



