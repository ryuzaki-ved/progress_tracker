import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, UserPlus, User, Lock, Eye, EyeOff, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';

export const AuthForm: React.FC = () => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'admin'>('signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = mode === 'signup'
        ? await signUp(username, password)
        : await signIn(mode === 'admin' ? 'admin' : username, password);

      if (error) {
        setError(error.message);
      } else {
        if (mode === 'admin') navigate('/admin');
        else navigate('/');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (mode === 'admin') return 'Admin Portal';
    if (mode === 'signup') return 'Create your account';
    return 'Welcome back';
  };

  const getButtonText = () => {
    if (loading) return 'Loading...';
    if (mode === 'admin') return 'Access Admin Panel';
    if (mode === 'signup') return 'Create Account';
    return 'Sign In';
  };

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-gray-800 rounded-xl shadow-2xl p-8 relative overflow-hidden border border-gray-700">
          {mode === 'admin' && (
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
          )}
          <div className="text-center mb-8">
            <div className={`w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 ${mode === 'admin' ? 'bg-red-500/20 shadow-neon-sm border border-red-500/50' : 'bg-primary'}`}>
              <motion.div
                animate={{ rotate: mode === 'admin' ? 0 : 360 }}
                transition={{ duration: 2, repeat: mode === 'admin' ? 0 : Infinity, ease: "linear" }}
              >
                {mode === 'admin' ? <Shield className="w-8 h-8 text-red-500" /> : '📈'}
              </motion.div>
            </div>
            <h1 className="text-2xl font-bold text-white">LifeStock</h1>
            <p className="text-gray-300 mt-2">
              {getTitle()}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode !== 'admin' && (
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Username
                </label>
                <div className="relative">
                  <User className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    placeholder="Enter your username"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
              >
                {error}
              </motion.div>
            )}

            <Button
              type="submit"
              className={`w-full ${mode === 'admin' ? 'bg-red-600 hover:bg-red-700 text-white border border-red-600' : 'bg-violet-600 hover:bg-violet-700 text-white'}`}
              disabled={loading}
              variant="primary"
            >
              <div className="flex items-center justify-center">
                {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />}
                {!loading && mode === 'admin' && <Shield className="w-4 h-4 mr-2" />}
                {!loading && mode === 'signup' && <UserPlus className="w-4 h-4 mr-2" />}
                {!loading && mode === 'signin' && <LogIn className="w-4 h-4 mr-2" />}
                {getButtonText()}
              </div>
            </Button>
          </form>

          <div className="mt-6 flex flex-col space-y-3 text-center">
            {mode === 'signin' && (
              <>
                <button onClick={() => { setMode('signup'); setError(null); }} className="text-violet-400 hover:text-violet-300 text-sm font-medium">
                  Don't have an account? Sign up
                </button>
                <div className="pt-4 mt-4 border-t border-gray-700">
                  <button onClick={() => { setMode('admin'); setError(null); }} className="text-gray-400 hover:text-red-400 text-xs font-medium uppercase tracking-wider transition-colors flex items-center justify-center mx-auto space-x-1">
                    <Shield className="w-3 h-3" />
                    <span>Admin Login</span>
                  </button>
                </div>
              </>
            )}

            {mode === 'signup' && (
              <>
                <button onClick={() => { setMode('signin'); setError(null); }} className="text-violet-400 hover:text-violet-300 text-sm font-medium">
                  Already have an account? Sign in
                </button>
              </>
            )}

            {mode === 'admin' && (
              <button onClick={() => { setMode('signin'); setError(null); }} className="text-gray-400 hover:text-gray-200 text-sm font-medium transition-colors">
                &larr; Back to User Login
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
