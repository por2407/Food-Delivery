import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// ─── Axios Instance ──────────────────────────────────────────────────

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // สำหรับส่ง HttpOnly Cookies ไปยัง Backend
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Interceptors ───────────────────────────────────────────────────

// 1. Response Interceptor: จัดการ Error ให้มีรูปแบบเดียวกัน
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // ดึง error message จาก Backend ถ้ามี
    const message =
      error.response?.data?.error || error.message || "Something went wrong";
    return Promise.reject(new Error(message));
  },
);
