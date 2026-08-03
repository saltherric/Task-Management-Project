import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import API from '../services/api';
import { useAlert } from '../contexts/AlertContext';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.redirectTo || '/home';
  const { showAlert } = useAlert();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState({});

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRemember(true);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('expired') === 'true') {
      showAlert('Your session has expired. Please log in again.', 'warning');
      navigate('/login', { replace: true });
    }
  }, [location.search, navigate, showAlert]);

  const validate = () => {
    const tempErrors = {};
    if (!email.trim()) {
      tempErrors.email = 'Please input your Email!';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = 'Please input a valid Email!';
    }
    
    if (!password) {
      tempErrors.password = 'Please input your Password!';
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const user = {
        email,
        password
      };
      const response = await API.post('/auth/login', user);
      console.log(response.data);
      
      // save token
      localStorage.setItem(
        'userInfo',
        JSON.stringify(response.data)
      );
      window.dispatchEvent(new Event('userInfoUpdated'));

      if (remember) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
     
      showAlert('Logged in successfully.', 'success');
      navigate(redirectTo, { replace: true });
      
    } catch (error) {
      console.log(error.response?.data);
      const backendMessage = error.response?.data?.message;
      showAlert(backendMessage || 'Login failed, please try again!', 'danger');
    }
  };

  const handleGoogleLogin = () => {
    const apiBaseUrl = API.defaults.baseURL || 'http://localhost:5000/api';
    window.location.href = `${apiBaseUrl}/auth/google`;
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3">
      <div className="bg-(--color-card) backdrop-blur-[10px] border border-indigo-600/10 rounded-3xl py-10 px-[35px] w-full max-w-[420px] text-center shadow-[0_8px_32px_rgba(30,41,59,0.10)]">
        <h1 className="mb-9 pb-8 text-4xl font-semibold">Login</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div className="flex flex-col text-left">
            <div className="relative flex items-center bg-(--color-card) border border-indigo-600/15 rounded-xl px-4 py-2.5 transition-all duration-300 focus-within:border-(--color-primary) focus-within:ring-1 focus-within:ring-(--color-primary)">
              <Mail className="w-5 h-5 text-(--color-primary) mr-3 flex-shrink-0" />
              <input
                type="text"
                placeholder="Email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                }}
                className="w-full bg-transparent text-(--color-text) text-base placeholder-(--color-muted) outline-none border-none p-0"
              />
            </div>
            {errors.email && <span className="text-red-500 text-xs mt-1.5 ml-3">{errors.email}</span>}
          </div>

          {/* Password Input */}
          <div className="flex flex-col text-left">
            <div className="relative flex items-center bg-(--color-card) border border-indigo-600/15 rounded-xl px-4 py-2.5 transition-all duration-300 focus-within:border-(--color-primary) focus-within:ring-1 focus-within:ring-(--color-primary)">
              <Lock className="w-5 h-5 text-(--color-primary) mr-3 flex-shrink-0" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                }}
                className="w-full bg-transparent text-(--color-text) text-base placeholder-(--color-muted) outline-none border-none p-0 pr-8"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 text-(--color-muted) hover:text-(--color-primary) transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <span className="text-red-500 text-xs mt-1.5 ml-3">{errors.password}</span>}
          </div>

          {/* Options Row (Remember Me & Forgot Password) */}
          <div className="flex items-center justify-between text-sm py-1">
            <label className="flex items-center gap-2 cursor-pointer text-(--color-text)">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded border-indigo-600/15 accent-(--color-primary) bg-transparent"
              />
              <span>Remember me</span>
            </label>
            <Link className="forgot-password text-(--color-primary) font-medium hover:underline" to="/forgot-password">
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-(--color-primary) text-(--color-card) font-semibold rounded-xl transition-all duration-200 cursor-pointer shadow-[0_4px_12px_rgba(37,99,235,0.20)] hover:bg-[color-mix(in_srgb,var(--color-primary)_88%,black)]"
            >
              Login
            </button>
          </div>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="h-[1px] flex-1 bg-indigo-600/10"></div>
          <span className="text-xs text-(--color-muted) uppercase">or</span>
          <div className="h-[1px] flex-1 bg-indigo-600/10"></div>
        </div>

        {/* Google Login Button */}
        <button 
          onClick={handleGoogleLogin}
          className="w-full py-3 border border-indigo-600/20 rounded-xl bg-(--color-card) text-(--color-text) font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:bg-[color-mix(in_srgb,var(--color-card)_95%,var(--color-primary))] cursor-pointer shadow-[0_4px_12px_rgba(99,102,241,0.05)]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {/* Footer */}
        <p className="mt-6 text-sm text-(--color-muted)">
          Don't have an account? <Link to="/register" className="text-(--color-primary) font-semibold hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
