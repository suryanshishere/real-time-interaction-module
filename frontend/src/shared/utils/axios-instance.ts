"use client";

import axios from "axios";
import { updateDeactivatedAt } from "./userLocalStorage";

const EXEMPT_URLS = ["/user/account/activate-account"];
const STORAGE_KEY = "app_user_state";
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || ""

const axiosInstance = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const userState = stored ? JSON.parse(stored) : {};
    const deactivatedAt = userState.deactivated_at;

    if (
      deactivatedAt &&
      config.method?.toLowerCase() !== "get" &&
      config.url &&
      !EXEMPT_URLS.includes(config.url)
    ) {
      return Promise.reject({
        response: {
          data: {
            message: "Your account is deactivated. Please activate it first.",
          },
        },
      });
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    if (response.data?.deactivated_at !== undefined) {
       updateDeactivatedAt(response.data.deactivated_at);
    }
    return response;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
