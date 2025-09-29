import axios from 'axios';

// Access environment variables using import.meta.env in Vite
// Make sure the variable name matches what's in your .env file
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
                           // ^^^^^^^^^^^^^^^  <-- This now matches your .env file

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for sending cookies/sessions
});

// Interceptor to attach JWT token to requests if available
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Assuming you store JWT in localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const userApi = {
  updateProfile: async (profileData: any) => {
    const response = await axiosInstance.put('/users/profile', profileData);
    return response.data;
  },
  // New API call for getting a presigned upload URL
  getProfilePictureUploadUrl: async (fileType: string) => {
    const response = await axiosInstance.post('/users/profile-picture-upload-url', { fileType });
    return response.data.data; // Return the 'data' object from the response
  },
};

export const roomApi = {
  // ... existing room API calls
}

// ... other API services