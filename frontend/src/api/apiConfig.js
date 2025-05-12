// src/api/apiConfig.js
import axios from "axios";

/* ──────────────────────────────────────────────────────────
   1) 환경변수 (Create‑React‑App => REACT_APP_ 접두사)
   ────────────────────────────────────────────────────────── */
export const API_BASE = process.env.REACT_APP_API_BASE; // 예) https://capston.ngrok.app
export const WS_BASE  = process.env.REACT_APP_WS_BASE;  // 예) wss://capston.ngrok.app

if (!API_BASE || !WS_BASE) {
  console.error("[apiConfig] .env 파일에 REACT_APP_API_BASE / REACT_APP_WS_BASE 가 정의되지 않았습니다.");
  throw new Error("필수 환경변수가 비어 있어 API 요청을 생성할 수 없습니다.");
}

/* ──────────────────────────────────────────────────────────
   2) axios 인스턴스 생성
   ────────────────────────────────────────────────────────── */
const axiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/* ──────────────────────────────────────────────────────────
   3) 요청 인터셉터: endpoint 앞에 항상 '/' 붙이기 + 로그
   ────────────────────────────────────────────────────────── */
const debug = true;

axiosInstance.interceptors.request.use(
  (config) => {
    if (config.url && !config.url.startsWith("/")) {
      config.url = `/${config.url}`;
    }
    if (debug) {
      console.log(`API → ${config.method?.toUpperCase()}  ${config.baseURL}${config.url}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ──────────────────────────────────────────────────────────
   4) 응답 인터셉터: 디버그 로그
   ────────────────────────────────────────────────────────── */
axiosInstance.interceptors.response.use(
  (res) => {
    if (debug) console.log(`API ← ${res.status}`, res.data);
    return res;
  },
  (err) => {
    if (debug) {
      if (err.response) console.error(`API ${err.response.status}`, err.response.data);
      else console.error("API Error", err.message);
    }
    return Promise.reject(err);
  }
);

/* ──────────────────────────────────────────────────────────
   5) export: REST wrapper + WS_BASE
   ────────────────────────────────────────────────────────── */
export const apiClient = {
  get: (endpoint, cfg)  => axiosInstance.get(endpoint, cfg),
  post: (endpoint, data, cfg) => axiosInstance.post(endpoint, data, cfg),
};
