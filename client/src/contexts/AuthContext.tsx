import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'; // <--- Import useCallback
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
  listedRooms?: any[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string) => Promise<User>;
  logout: () => void;
  loading: boolean;
  checkAuthStatus: () => Promise<void>; // This function
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

  // Make checkAuthStatus a useCallback
  const checkAuthStatus = useCallback(async () => {
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
  }, [API_BASE_URL]); // Dependencies for checkAuthStatus: only API_BASE_URL (which is stable)

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]); // useEffect now correctly depends on the memoized checkAuthStatus

  // Modified login function to return the fetched user object
  const login = useCallback(async (token: string): Promise<User> => { // <--- Also memoize login
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/auth/profile`);
      const loggedInUser: User = res.data;
      setUser(loggedInUser);
      setIsAuthenticated(true);
      return loggedInUser;
    } catch (err) {
      console.error('Login failed during profile fetch:', err);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      setIsAuthenticated(false);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]); // Dependencies for login

  // logout function is fine as it is (no dependencies or state logic inside)
  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = '/login';
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