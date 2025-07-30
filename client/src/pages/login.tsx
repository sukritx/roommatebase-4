import React, { useState } from 'react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Link } from '@heroui/link';
import { title } from '@/components/primitives';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isAuthenticated } = useAuth(); // We don't need 'user' directly from context here
  const navigate = useNavigate();
  const location = useLocation();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Helper function for redirection logic
  const handleRedirectAfterLogin = (loggedInUser: { isRoomOwner?: boolean }) => {
    if (loggedInUser?.isRoomOwner) {
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/', { replace: true }); // Redirect non-landlords to the homepage
    }
  };

  // Handle successful Google OAuth callback
  React.useEffect(() => {
    // If already authenticated by another means, and landed here, just redirect
    if (isAuthenticated) {
      // Small delay to ensure AuthContext user state is fully propagated
      // before attempting to redirect if it was already authenticated.
      // In a very fast app, this might still be a race condition without a stronger pattern.
      // But given we handle the Google token, it's fine for initial load.
      // The primary path will be: no token -> receive token -> login() -> redirect.
      return;
    }

    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const authError = params.get('error');

    if (token) {
      login(token) // This call now returns a Promise<User>
        .then(loggedInUser => { // Capture the returned user immediately
          handleRedirectAfterLogin(loggedInUser);
        })
        .catch(() => {
          setError('Google login failed. Please try again.');
          // Ensure token is removed if login promise rejects
          localStorage.removeItem('token');
          navigate('/login', { replace: true });
        });
    } else if (authError) {
      setError('Google login failed. Please try again.');
    }
    // No need to add user, isAuthenticated to dependency array here, as the primary path is 'token' exists
    // And if isAuthenticated is true on initial render, we return early.
  }, [location.search, login, navigate, isAuthenticated]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
      const loggedInUser = await login(res.data.token); // Capture the returned user
      handleRedirectAfterLogin(loggedInUser); // Use it immediately
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Login failed. Please check your credentials.');
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <h1 className={title()}>Login</h1>
      <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Input
            type="email"
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" color="primary">
            Login
          </Button>
          <div className="text-center text-sm text-default-600">
            Don't have an account? <Link href="/register">Register</Link>
          </div>
          <div className="flex items-center gap-2 my-4">
            <hr className="flex-grow border-t border-gray-300 dark:border-gray-600" />
            <span className="text-default-500 text-sm">OR</span>
            <hr className="flex-grow border-t border-gray-300 dark:border-gray-600" />
          </div>
          <Button
            onClick={handleGoogleLogin}
            color="secondary"
            variant="flat"
            startContent={<img src="/google-icon.svg" alt="Google" className="w-5 h-5" />}
          >
            Login with Google
          </Button>
        </form>
      </div>
    </section>
  );
}