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

  // Handle redirect back from Google OAuth
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hasGoogle = params.get('googleLogin');
    const token = params.get('token');
    const name = params.get('name');
    const email = params.get('email');
    if (hasGoogle && token) {
      // Clear params from URL after processing
      window.history.replaceState({}, document.title, window.location.pathname);
      login(token, { id: 'google', name: name || 'Google User', email: email || '' } as any);
      navigate('/');
    }
  }, [login, navigate]);

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

        {/* Or divider */}
        <div className="my-4 sm:my-6 flex items-center">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="px-3 text-gray-500 text-xs sm:text-sm">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Google Sign-In */}
        <div>
          <a href="/api/auth/google" className="w-full inline-flex items-center justify-center gap-2 border border-gray-300 rounded-full px-4 py-3 text-sm sm:text-base hover:bg-gray-50 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C33.26,6.053,28.884,4,24,4C12.955,4,4,12.955,4,24 s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,16.131,18.961,13,24,13c3.059,0,5.842,1.154,7.961,3.039 l5.657-5.657C33.26,6.053,28.884,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
              <path fill="#4CAF50" d="M24,44c4.798,0,9.183-1.836,12.522-4.826l-5.786-4.882C28.648,35.554,26.429,36,24,36 c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.106,5.574 c0.001-0.001,0.002-0.001,0.003-0.002l5.786,4.882C36.671,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
            </svg>
            Continue with Google
          </a>
        </div>

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

        <div className="mt-3 sm:mt-4 text-center">
          <Link to="/" className="text-gray-600 hover:text-gray-800 underline text-sm sm:text-base">
            Back to Home
          </Link>
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