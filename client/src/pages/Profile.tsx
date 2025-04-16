import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

interface User {
  username: string;
  email: string;
}

const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    api.get('/api/users/profile', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setUser(res.data))
      .catch(err => {
        setError('Failed to fetch profile');
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      });
  }, [navigate]);

  if (error) return <div className="flex min-h-screen items-center justify-center text-red-500">{error}</div>;
  if (!user) return <div className="flex min-h-screen items-center justify-center">Loading...</div>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-lg">
        <h2 className="mb-6 text-2xl font-bold text-center">Profile</h2>
        <div className="space-y-4">
          <div>
            <span className="font-semibold">Username:</span> {user.username}
          </div>
          <div>
            <span className="font-semibold">Email:</span> {user.email}
          </div>
          <Button className="w-full mt-6" onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}>Logout</Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
