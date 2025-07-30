import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@heroui/spinner'; // Assuming HeroUI Spinner for loading indicator
import { title, subtitle } from '@/components/primitives'; // For basic text styles

export default function AuthSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (loading) return; // Wait until auth context has initialized

    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const error = params.get('error');

    if (token) {
      // If already authenticated with the same token, no need to re-login
      // You might add a check here if user._id from token matches current user._id
      login(token)
        .then(() => {
          navigate('/dashboard', { replace: true }); // Redirect to dashboard after successful login
        })
        .catch(() => {
          // Handle login error (e.g., token invalid after backend redirect)
          navigate('/login?error=oauth_failed', { replace: true });
        });
    } else if (error) {
      // Handle Google OAuth failure
      console.error("Google OAuth Error:", error);
      navigate(`/login?error=${error}`, { replace: true });
    } else {
      // No token or error, likely an direct access or misconfiguration
      navigate('/login', { replace: true });
    }
  }, [location.search, navigate, login, isAuthenticated, loading]);

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10 h-screen">
      <Spinner size="lg" color="primary" /> {/* Display a spinner while processing */}
      <h1 className={title()}>Processing Login...</h1>
      <p className={subtitle()}>Please wait while we log you in.</p>
    </section>
  );
}