import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '~/contexts/AuthContext';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : { name: formData.name, email: formData.email, password: formData.password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.token) {
          login(data.token, data.user);
          setMessage(data.message || 'Success!');
        }
        setTimeout(() => navigate('/'), 1000);
      } else {
        setError(data.error || 'An error occurred');
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center p-4 min-h-screen bg-cover bg-gradient-two opacity-0 animate-fadeIn">
      <Link to="/" className="mb-6 sm:mb-10">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gradient tracking-wide">
          RESUMIND
        </h1>
      </Link>
      
      <div className="bg-white rounded-2xl sm:rounded-3xl p-10 sm:p-8 shadow-2xl w-full max-w-sm sm:max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-semibold text-dark-200">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            {isLogin ? 'Sign in to your account' : 'Join us to optimize your resume'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="opacity-0 animate-fadeIn">
          {!isLogin && (
            <div className="form-div">
              <label htmlFor="name" className="text-sm font-medium">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required={!isLogin}
                placeholder="Enter your full name"
                className="mt-1"
              />
            </div>
          )}

          <div className="form-div">
            <label htmlFor="email" className="text-sm font-medium">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="Enter your email"
              className="mt-1"
            />
          </div>

          <div className="form-div">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              placeholder="Enter your password"
              className="mt-1"
            />
          </div>

          {!isLogin && (
            <div className="form-div">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required={!isLogin}
                placeholder="Confirm your password"
                className="mt-1"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="primary-button w-full text-xs sm:text-sm md:text-base px-3 sm:px-4 py-3 button-hover "
          >
            {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-4 sm:mt-6 text-center">
          <p className="text-gray-600 text-sm sm:text-base">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setFormData({ name: '', email: '', password: '', confirmPassword: '' });
              }}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm sm:text-base">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm sm:text-base">
            {message}
          </div>
        )}
      </div>
    </main>
  );
};

export default Auth;