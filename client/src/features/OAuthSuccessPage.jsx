import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import API from '../services/api';
import { useAlert } from '../contexts/AlertContext';

function OAuthSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  useEffect(() => {
    const fetchUserData = async () => {
      const token = searchParams.get('token');

      if (!token) {
        showAlert('Google authentication failed: Token not found.', 'danger');
        navigate('/login', { replace: true });
        return;
      }

      try {
        // 1. Store token temporarily so the API interceptor can attach it
        localStorage.setItem('userInfo', JSON.stringify({ token }));

        // 2. Fetch authenticated user details from /me
        const response = await API.get('/auth/me');
        
        // 3. Construct and save the full user info
        const fullUserInfo = {
          _id: response.data._id || response.data.id,
          username: response.data.username || response.data.name || 'User',
          email: response.data.email,
          token: token,
        };

        localStorage.setItem('userInfo', JSON.stringify(fullUserInfo));
        window.dispatchEvent(new Event('userInfoUpdated'));

        // 4. Success alert and redirect to home
        showAlert('Logged in with Google successfully.', 'success');
        navigate('/home', { replace: true });
      } catch (error) {
        console.error('OAuth success parsing error:', error);
        localStorage.removeItem('userInfo');
        
        const backendMessage = error.response?.data?.message;
        showAlert(backendMessage || 'Failed to authenticate with Google.', 'danger');
        navigate('/login', { replace: true });
      }
    };

    fetchUserData();
  }, [searchParams, navigate, showAlert]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-(--color-bg)">
      <Loader2 className="w-12 h-12 text-(--color-primary) animate-spin" />
      <p className="text-lg font-medium text-(--color-muted) animate-pulse">
        Completing Google sign-in...
      </p>
    </div>
  );
}

export default OAuthSuccessPage;
