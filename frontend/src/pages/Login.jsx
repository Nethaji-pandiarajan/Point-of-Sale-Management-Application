import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import useToast from '../hooks/useToast';
import useAuth from '../hooks/useAuth';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { login, authLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (sessionStorage.getItem('saleiz_session_expired')) {
      addToast('Session expired, please log in again', 'error');
      sessionStorage.removeItem('saleiz_session_expired');
    }
  }, [addToast]);

  const validate = () => {
    const newErrors = {};
    
    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }
    
    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Double-click protection check
    if (authLoading) return;

    if (!validate()) {
      addToast('Please correct validation errors first', 'warning');
      return;
    }

    try {
      await login(email, password, rememberMe);
      addToast('Welcome back to Saleiz!', 'success');
      navigate('/');
    } catch (err) {
      addToast(err.message || 'Login failed. Please check credentials.', 'error');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    addToast('Forgot password recovery is currently offline.', 'info');
  };

  // Password visibility eye icon toggle component
  const passwordToggleElement = (
    <button
      type="button"
      onClick={togglePasswordVisibility}
      className="password-toggle-btn"
      tabIndex="-1"
      aria-label={showPassword ? 'Hide password' : 'Show password'}
    >
      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  );

  return (
    <form onSubmit={handleSubmit} className="login-form-container">
      <div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Sign in to admin console</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          Enter your restaurant details below
        </p>
      </div>

      <Input
        label="Email address"
        type="email"
        placeholder="admin@saleiz.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
        }}
        error={errors.email}
        icon={Mail}
        disabled={authLoading}
        required
      />

      <Input
        label="Password"
        type={showPassword ? 'text' : 'password'}
        placeholder="••••••••"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
        }}
        error={errors.password}
        icon={Lock}
        rightElement={passwordToggleElement}
        disabled={authLoading}
        required
      />

      <div className="login-options-row">
        <label className="remember-me-checkbox">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={authLoading}
          />
          <span>Remember me</span>
        </label>
        <a href="#forgot" onClick={handleForgotPassword} className="forgot-password-link">
          Forgot password?
        </a>
      </div>

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        isLoading={authLoading}
        disabled={authLoading}
      >
        Sign In
      </Button>
    </form>
  );
};

export default Login;
