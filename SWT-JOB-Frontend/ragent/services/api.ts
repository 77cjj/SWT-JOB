import axios from "axios";
import { toast } from "sonner";
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

import { RAGENT_API_BASE_URL } from "@/config/runtimeEnv";
import { storage } from "@/utils/storage";

type ApiClient = Omit<AxiosInstance, "get" | "delete" | "post" | "put" | "patch"> & {
  get<T = unknown, R = T>(url: string, config?: AxiosRequestConfig): Promise<R>;
  delete<T = unknown, R = T>(url: string, config?: AxiosRequestConfig): Promise<R>;
  post<T = unknown, R = T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<R>;
  put<T = unknown, R = T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<R>;
  patch<T = unknown, R = T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<R>;
};

const axiosInstance = axios.create({
  baseURL: RAGENT_API_BASE_URL,
  timeout: 60000
});
export const api = axiosInstance as ApiClient;

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = token;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

axiosInstance.interceptors.request.use((config) => {
  const token = storage.getToken();
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    const payload = response.data;
    if (payload && typeof payload === "object" && "code" in payload) {
      if (payload.code !== "0") {
        const message = payload.message || "请求失败";
        const isAuthExpired = typeof message === "string" && message.includes("未登录");
        if (isAuthExpired) {
          storage.clearAuth();
          void import("@/stores/authStore").then(({ useAuthStore }) => {
            useAuthStore.getState().openLoginDialog("登录已过期，请重新登录");
          });
        }
        return Promise.reject(new Error(message));
      }
      return payload.data;
    }
    return payload;
  },
  (error) => {
    if (error?.response?.status === 401) {
      storage.clearAuth();
      void import("@/stores/authStore").then(({ useAuthStore }) => {
        useAuthStore.getState().openLoginDialog("请先登录");
      });
    }
    const responseData = error?.response?.data;
    if (responseData && typeof responseData === "object" && "message" in responseData && responseData.message) {
      toast.error(responseData.message);
    } else if (error?.code === "ERR_NETWORK") {
      toast.error("网络错误，请检查网络连接");
    } else {
      toast.error(error?.message || "网络错误");
    }
    return Promise.reject(error);
  }
);
