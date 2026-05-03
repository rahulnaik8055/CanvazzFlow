// lib/api.ts
import axios from "axios";
import { useAuth } from "@clerk/nextjs";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export function useApi() {
  const { getToken } = useAuth();

  const getHeaders = async () => {
    const token = await getToken();
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const api = {
    get: async (url: string) => {
      const headers = await getHeaders();
      const res = await axios.get(`${BASE_URL}/${url}`, { headers });
      console.log(process.env.NEXT_PUBLIC_API_URL)
      return res.data;
    },

    post: async (url: string, data?: any) => {
      const headers = await getHeaders();
      const res = await axios.post(`${BASE_URL}/${url}`, data, { headers });
      return res.data;
    },

    put: async (url: string, data?: any) => {
      const headers = await getHeaders();
      const res = await axios.put(`${BASE_URL}/${url}`, data, { headers });
      return res.data;
    },

    patch: async (url: string, data?: any) => {
      const headers = await getHeaders();
      const res = await axios.patch(`${BASE_URL}/${url}`, data, { headers });
      return res.data;
    },

    delete: async (url: string) => {
      const headers = await getHeaders();
      const res = await axios.delete(`${BASE_URL}/${url}`, { headers });
      return res.data;
    },
  };

  return api;
}
