import axios, { AxiosInstance, AxiosError } from "axios";

/**
 * API error interface for type safety
 */
export interface ApiError {
  message: string;
  status?: number;
  data?: unknown;
}

/**
 * Create and configure axios client with base URL from environment
 */
const client: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request interceptor for logging and auth (if needed)
 */
client.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor for error handling
 */
client.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const apiError: ApiError = {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    };
    console.error("[API Error]", apiError);
    return Promise.reject(apiError);
  }
);

export default client;
