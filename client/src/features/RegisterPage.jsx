import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import API from '../services/api';
import { useAlert } from '../contexts/AlertContext';

function Register() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isRegistered, setIsRegistered] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validate = () => {
    const tempErrors = {};
    if (!username.trim()) tempErrors.username = 'Please input your Full name!';
    
    if (!email.trim()) {
      tempErrors.email = 'Please input your Email!';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = 'Please input a valid Email!';
    }
    
    if (!password) {
      tempErrors.password = 'Please input your Password!';
    } else if (password.length < 6) {
      tempErrors.password = 'Password must be at least 6 characters!';
    }
    
    if (!confirmPassword) {
      tempErrors.confirmPassword = 'Please confirm your password!';
    } else if (password !== confirmPassword) {
      tempErrors.confirmPassword = 'The two passwords that you entered do not match!';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const user = {
        username,
        email,
        password
      };
      const response = await API.post('/auth/register', user);
      console.log(response.data);

      // Registration should not authenticate the user.
      localStorage.removeItem('userInfo');
     
      showAlert('Registered successfully. Please check your email to verify your account.', 'success');
      setIsRegistered(true);
      
    } catch (error) {
      console.log(error.response?.data);
      const backendMessage = error.response?.data?.message;
      showAlert(backendMessage || 'Registration failed.', 'danger');
    }
  };

  if (isRegistered) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <div className="bg-(--color-card) backdrop-blur-[10px] border border-indigo-600/10 rounded-3xl py-10 px-[35px] w-full max-w-[420px] text-center shadow-[0_8px_32px_rgba(30,41,59,0.10)]">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-indigo-600/10 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-(--color-primary)" />
            </div>
          </div>
          <h1 className="mb-4 text-3xl font-semibold text-(--color-text)">Verify your email</h1>
          <p className="text-(--color-muted) mb-8 text-base leading-relaxed">
            We've sent a verification link to <span className="font-semibold text-(--color-text) block mt-1 break-all">{email}</span>. Please check your inbox and click the link to activate your account.
          </p>
          <div className="space-y-4">
            <Link
              to="/login"
              className="block w-full py-3 bg-(--color-primary) text-(--color-card) font-semibold rounded-xl transition-all duration-200 cursor-pointer shadow-[0_4px_12px_rgba(37,99,235,0.20)] hover:bg-[color-mix(in_srgb,var(--color-primary)_88%,black)]"
            >
              Go to Login
            </Link>
            <p className="text-sm text-(--color-muted)">
              Didn't receive the email? <Link to="/resend-verification" className="text-(--color-primary) font-semibold hover:underline">Resend verification</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3">
      <div className="bg-(--color-card) backdrop-blur-[10px] border border-indigo-600/10 rounded-3xl py-10 px-[35px] w-full max-w-[420px] text-center shadow-[0_8px_32px_rgba(30,41,59,0.10)]">
        <h1 className="mb-9 pb-4 text-4xl font-semibold">Register</h1>
        <p className="register-subtitle">Create your account to start managing tasks.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Input */}
          <div className="flex flex-col text-left">
            <div className="relative flex items-center bg-(--color-card) border border-indigo-600/15 rounded-xl px-4 py-2.5 transition-all duration-300 focus-within:border-(--color-primary) focus-within:ring-1 focus-within:ring-(--color-primary)">
              <User className="w-5 h-5 text-(--color-primary) mr-3 flex-shrink-0" />
              <input
                type="text"
                placeholder="Full name"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errors.username) setErrors(prev => ({ ...prev, username: '' }));
                }}
                className="w-full bg-transparent text-(--color-text) text-base placeholder-(--color-muted) outline-none border-none p-0"
              />
            </div>
            {errors.username && <span className="text-red-500 text-xs mt-1.5 ml-3">{errors.username}</span>}
          </div>

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

          {/* Confirm Password Input */}
          <div className="flex flex-col text-left">
            <div className="relative flex items-center bg-(--color-card) border border-indigo-600/15 rounded-xl px-4 py-2.5 transition-all duration-300 focus-within:border-(--color-primary) focus-within:ring-1 focus-within:ring-(--color-primary)">
              <Lock className="w-5 h-5 text-(--color-primary) mr-3 flex-shrink-0" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
                }}
                className="w-full bg-transparent text-(--color-text) text-base placeholder-(--color-muted) outline-none border-none p-0 pr-8"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 text-(--color-muted) hover:text-(--color-primary) transition-colors cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirmPassword && <span className="text-red-500 text-xs mt-1.5 ml-3">{errors.confirmPassword}</span>}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-(--color-primary) text-(--color-card) font-semibold rounded-xl transition-all duration-200 cursor-pointer shadow-[0_4px_12px_rgba(37,99,235,0.20)] hover:bg-[color-mix(in_srgb,var(--color-primary)_88%,black)]"
            >
              Register
            </button>
          </div>
        </form>

        {/* Footer */}
        <p className="mt-6 text-sm text-(--color-muted)">
          Already have an account? <Link to="/login" className="text-(--color-primary) font-semibold hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
