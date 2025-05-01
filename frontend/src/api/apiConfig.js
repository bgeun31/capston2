// src/api/apiConfig.js
import axios from 'axios';

// ngrok 고정 도메인 URL
const NGROK_FIXED_URL = 'https://llama-lucky-mullet.ngrok-free.app';

// 기존 Lambda API 엔드포인트 (백업으로 유지)
const LAMBDA_ENDPOINT = 'https://83xt4e7ki5.execute-api.ap-northeast-2.amazonaws.com/capston_backend';

// 사용할 URL 모드: 'ngrok' 또는 'lambda'
const URL_MODE = 'ngrok';

let backendBaseUrl = null;

/**
 * 백엔드 URL을 가져오는 함수
 * ngrok 모드에서는 고정 URL을 바로 반환
 * lambda 모드에서는 Lambda API에서 동적 URL을 가져옴
 */
export const getBackendUrl = async () => {
  // 고정 ngrok URL 사용 모드
  if (URL_MODE === 'ngrok') {
    backendBaseUrl = NGROK_FIXED_URL;
    return backendBaseUrl;
  }
  
  // 이미 로드된 URL이 있으면 그대로 반환
  if (backendBaseUrl) {
    return backendBaseUrl;
  }
  
  // Lambda API를 통해 동적 URL 로드 (기존 방식)
  try {
    const response = await axios.get(LAMBDA_ENDPOINT);
    backendBaseUrl = response.data.url;
    console.log('Backend URL loaded:', backendBaseUrl);
    return backendBaseUrl;
  } catch (error) {
    console.error('Failed to get backend URL:', error);
    console.log('Falling back to fixed ngrok URL');
    // 실패 시 고정 URL로 폴백
    backendBaseUrl = NGROK_FIXED_URL;
    return backendBaseUrl;
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



