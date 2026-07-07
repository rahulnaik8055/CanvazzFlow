import { useAuth } from "@clerk/nextjs";
import httpClient from "./http-client";

export function useApi() {
  const { getToken } = useAuth();

  const authHeaders = async () => {
    const token = await getToken();
    return { Authorization: `Bearer ${token}` };
  };

  const api = {
    get: async (url: string) => {
      const headers = await authHeaders();
      const res = await httpClient.get(url, { headers });
      return res.data;
    },

    post: async (url: string, data?: any) => {
      const headers = await authHeaders();
      const res = await httpClient.post(url, data, { headers });
      return res.data;
    },

    put: async (url: string, data?: any) => {
      const headers = await authHeaders();
      const res = await httpClient.put(url, data, { headers });
      return res.data;
    },

    patch: async (url: string, data?: any) => {
      const headers = await authHeaders();
      const res = await httpClient.patch(url, data, { headers });
      return res.data;
    },

    delete: async (url: string) => {
      const headers = await authHeaders();
      const res = await httpClient.delete(url, { headers });
      return res.data;
    },
  };

  return api;
}
