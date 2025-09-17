import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../../stores/authStore';

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuthStore();

  useEffect(() => {
    console.log('🔄 AuthCallback: Processing OAuth callback...');
    
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refresh');
    const error = searchParams.get('error');

    console.log('🔍 AuthCallback: Extracted params:', { 
      hasToken: !!token, 
      hasRefreshToken: !!refreshToken, 
      error 
    });

    if (error) {
      console.error('❌ AuthCallback: OAuth error:', error);
      toast.error('Authentication failed. Please try again.');
      navigate('/login');
      return;
    }

    if (token && refreshToken) {
      console.log('✅ AuthCallback: Valid tokens received, setting up authentication...');
      
      try {
        // Validate token format before processing
        if (!token || typeof token !== 'string' || !token.includes('.')) {
          throw new Error('Invalid token format');
        }

        // Store tokens
        setTokens(token, refreshToken);
        
        // Decode the JWT to get user info (simple base64 decode for demonstration)
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          throw new Error('Invalid JWT token structure');
        }

        const payload = JSON.parse(atob(tokenParts[1]));
        console.log('👤 AuthCallback: Decoded user payload:', payload);
        
        setUser({
          id: payload.sub || payload.userId,
          email: payload.email,
          firstName: payload.firstName || payload.given_name,
          lastName: payload.lastName || payload.family_name,
          role: payload.role || 'PATIENT',
          avatar: payload.avatar || payload.picture
        });

        console.log('🎉 AuthCallback: Authentication successful, redirecting to dashboard...');
        toast.success('Successfully signed in with Google!');
        navigate('/dashboard');
        
      } catch (error) {
        console.error('❌ AuthCallback: Error processing tokens:', error);
        toast.error('Authentication failed. Please try again.');
        navigate('/login');
      }
    } else {
      console.error('❌ AuthCallback: Missing required tokens');
      toast.error('Authentication failed. Missing credentials.');
      navigate('/login');
    }
  }, [searchParams, navigate, setTokens, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Completing Sign In...
          </h2>
          <p className="text-gray-600">
            Please wait while we finish setting up your account.
          </p>
        </div>
      </div>
    </div>
  );
}
