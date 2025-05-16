import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { login, clearError } from '../../store/slices/authSlice';
import Notification from '../../components/common/Notification';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      setShowNotification(true);
      const timer = setTimeout(() => {
        setShowNotification(false);
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(login({ email, password, rememberMe }));
    if (!result.error) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1c2e]">
      {showNotification && error && (
        <Notification
          type="error"
          message={error}
          onClose={() => {
            setShowNotification(false);
            dispatch(clearError());
          }}
        />
      )}
      <div className="container mx-auto px-6 min-h-screen flex items-center">
        <div className="w-full flex flex-col lg:flex-row items-start lg:items-center justify-between gap-16">
          {/* Left Section */}
          <div className="lg:max-w-[600px] pt-10 lg:pt-0">
            <div className="flex items-center space-x-3 mb-16">
              <div className="bg-[#7857FF] p-3 rounded-2xl">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white">
                Workflow Manager
              </h1>
            </div>

            <h2 className="text-[56px] leading-[1.1] font-bold mb-8">
              <span className="bg-gradient-to-r from-[#7857FF] via-[#B557FF] to-[#FF7AC6] bg-clip-text text-transparent">
                Streamline your work<br />process efficiently!
              </span>
            </h2>

            <p className="text-gray-400 text-lg mb-16">
              Manage your tasks, collaborate with team members, and track progress all in one place. Boost your productivity with our comprehensive workflow management solution.
            </p>

            <button className="flex items-center space-x-4 text-white hover:opacity-90 transition-opacity">
              <div className="bg-[#7857FF] p-3 rounded-2xl">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-lg font-medium">Watch demo</span>
            </button>
          </div>

          {/* Right Section - Login Form */}
          <div className="w-full lg:w-[460px]">
            <div className="bg-[#1E2237] rounded-3xl p-8 lg:p-10">
              <h3 className="text-2xl font-bold text-white mb-2">
                Welcome back to Workflow
              </h3>
              
              <div className="relative text-center mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative">
                  <span className="px-4 text-sm text-gray-400 bg-[#1E2237]">Sign in to continue</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-[#1a1c2e] border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-[#7857FF] focus:ring-1 focus:ring-[#7857FF] transition-all"
                    placeholder="Your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />

                  <input
                    type="password"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-[#1a1c2e] border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-[#7857FF] focus:ring-1 focus:ring-[#7857FF] transition-all"
                    placeholder="Pick a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-700 text-[#7857FF] focus:ring-[#7857FF] bg-[#1a1c2e]"
                    />
                    <label htmlFor="remember-me" className="ml-2 text-sm text-gray-400">
                      Remember me
                    </label>
                  </div>

                  <Link
                    to="/forgot-password"
                    className="text-sm text-[#7857FF] hover:text-[#8E75FF] transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#7857FF] to-[#FF7AC6] text-white font-medium hover:opacity-90 transition-opacity"
                >
                  Sign In
                </button>

                <div className="text-center space-y-4">
                  <p className="text-sm text-gray-400">
                    Use at least one letter, one numeral, and seven characters.
                  </p>
                  
                  <p className="text-sm text-gray-400">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-[#7857FF] hover:text-[#8E75FF] transition-colors font-medium">
                      Sign up
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
