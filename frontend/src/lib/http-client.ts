import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
console.log("BASE_URL:", BASE_URL);

const httpClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (!config) return Promise.reject(error);

    const maxRetries = 3;
    config._retryCount = (config._retryCount || 0) + 1;

    const shouldRetry =
      config._retryCount <= maxRetries &&
      (!error.response ||
        (error.response.status >= 500 && error.response.status < 600) ||
        error.code === "ECONNABORTED" ||
        error.message === "Network Error");

    if (shouldRetry) {
      const delay = Math.min(1000 * Math.pow(2, config._retryCount - 1), 8000);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return httpClient(config);
    }

    return Promise.reject(error);
  },
);

export default httpClient;
