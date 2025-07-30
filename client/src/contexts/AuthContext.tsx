import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  _id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  isPaid: boolean;
  paidUntil?: string | null;
  freeQuotaUsed: number;
  userType: 'User' | 'Institution';
  isRoomOwner: boolean;
  listedRooms?: any[]; // Add this to User interface if your profile endpoint returns it
  // Add other relevant user fields from your schema
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string) => Promise<User>; // <--- Changed return type to Promise<User>
  logout: () => void;
  loading: boolean;
  checkAuthStatus: () => Promise<void>; // Expose for re-checking after an action
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  axios.defaults.headers.common['Content-Type'] = 'application/json';

  const checkAuthStatus = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      try {
        const res = await axios.get(`${API_BASE_URL}/auth/profile`);
        setUser(res.data);
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    } else {
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Modified login function to return the fetched user object
  const login = async (token: string): Promise<User> => {
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`; // Set header immediately

    try {
      setLoading(true); // Start loading when attempting login
      const res = await axios.get(`${API_BASE_URL}/auth/profile`);
      const loggedInUser: User = res.data;
      setUser(loggedInUser);
      setIsAuthenticated(true);
      return loggedInUser; // Return the user object
    } catch (err) {
      console.error('Login failed during profile fetch:', err);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      setIsAuthenticated(false);
      throw err; // Re-throw to allow component to catch and display error
    } finally {
      setLoading(false); // End loading
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
    // Redirect to login or home page after logout
    window.location.href = '/login'; // Or use useNavigate from react-router-dom
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, loading, checkAuthStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};