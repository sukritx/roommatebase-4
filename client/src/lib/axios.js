import axios from "axios";

const api = axios.create({
  baseURL: "/api", // Change to your API URL if needed
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional: Add a request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
