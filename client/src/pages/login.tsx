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
  const { login } = useAuth(); // We don't need 'isAuthenticated' or 'user' directly here from context
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

  // Effect for handling Google OAuth callback
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const authError = params.get('error');

    // If there's a token in the URL, attempt to log in.
    // This handles the redirect after Google OAuth.
    if (token) {
      // Clear URL parameters to prevent re-processing on subsequent renders
      navigate(location.pathname, { replace: true });

      login(token) // This call now returns a Promise<User>
        .then(loggedInUser => { // Capture the returned user immediately
          handleRedirectAfterLogin(loggedInUser);
        })
        .catch((err) => {
          console.error("Google login useEffect catch:", err); // Log the error
          setError('Google login failed. Please try again.');
          localStorage.removeItem('token'); // Ensure token is removed on failure
          // Navigate to a clean login page state
          navigate('/login', { replace: true });
        });
    } else if (authError) {
      console.error("Google OAuth Error in URL:", authError); // Log the error
      setError('Google login failed. Please try again.');
      // Navigate to a clean login page state
      navigate('/login', { replace: true });
    }
    // Dependencies: only `location.search`, `login`, `navigate`.
    // We explicitly avoid `isAuthenticated` and `user` here to prevent race conditions
    // as their values might not be stable immediately after a deep state update.
  }, [location.search, login, navigate]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
      const loggedInUser = await login(res.data.token); // Capture the returned user
      handleRedirectAfterLogin(loggedInUser); // Use it immediately
    } catch (err: any) {
      console.error("Manual login catch:", err); // Log the error
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