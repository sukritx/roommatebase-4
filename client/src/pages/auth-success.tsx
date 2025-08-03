import React, { useEffect, useState } from 'react'; // Keep useState for local error (optional)
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@heroui/spinner';
import { title, subtitle } from '@/components/primitives';

export default function AuthSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, loading } = useAuth(); // isAuthenticated not directly used for redirection here
  const [error, setError] = useState<string | null>(null); // Optional: local error state for debugging/display

  useEffect(() => {
    if (loading) {
      return; // Wait for auth context to initialize
    }

    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const authError = params.get('error');

    if (token) {
      // Immediately clear the token from the URL to prevent re-processing on subsequent renders
      navigate(location.pathname, { replace: true });

      login(token) // This returns Promise<User>
        .then(loggedInUser => {
          // Perform the redirect based on the received user object
          if (loggedInUser?.isRoomOwner) {
            navigate('/dashboard', { replace: true });
          } else {
            navigate('/', { replace: true });
          }
        })
        .catch((err) => {
          console.error("AuthSuccessPage: login(token) FAILED! Error:", err.response?.data || err.message || err);
          setError('Google login failed. Please try again.'); // Set local error
          navigate('/login?error=oauth_failed', { replace: true });
        });
    } else if (authError) {
      console.error("AuthSuccessPage: Google OAuth Error in URL parameter:", authError);
      setError('Google login failed. Please try again.');
      navigate(`/login?error=${authError}`, { replace: true });
    } else {
      // No token or error in URL, redirect to login page (shouldn't happen on normal flow)
      navigate('/login', { replace: true });
    }
  }, [location.search, navigate, login, loading]); // Remove isAuthenticated from deps, it's not directly needed for primary flow

  // Optional: Display error message on the page itself if needed, otherwise this is fine
  if (error) {
    return (
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10 h-screen text-red-500">
        <h1 className={title()}>Login Error</h1>
        <p className={subtitle()}>{error}</p>
        <p className="mt-4">Redirecting to login page...</p>
      </section>
    );
  }

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10 h-screen">
      <Spinner size="lg" color="primary" />
      <h1 className={title()}>Processing Login...</h1>
      <p className={subtitle()}>Please wait while we log you in.</p>
    </section>
  );
}