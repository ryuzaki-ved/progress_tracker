import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Eye, EyeOff, Shield, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { MotivationalBackground } from './MotivationalBackground';

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
    <div className="relative h-screen w-screen overflow-hidden flex items-center justify-center p-4 bg-black">
      <MotivationalBackground />
      
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-gray-900/40 backdrop-blur-3xl rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.8)] p-10 relative overflow-hidden border border-white/5">
          {/* Animated glow border */}
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 via-transparent to-red-500/5 pointer-events-none" />
          
          {mode === 'admin' && (
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-600 to-amber-600"></div>
          )}
          
          <div className="text-center mb-10 relative">
            <div className={`relative w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 transition-all duration-500 transform hover:rotate-12 ${mode === 'admin' ? 'bg-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.4)] border border-red-500/30' : 'bg-amber-500/20 shadow-[0_0_40px_rgba(245,158,11,0.4)] border border-amber-500/30'}`}>
              <motion.div
                className={`absolute inset-0 rounded-[2rem] border-2 ${mode === 'admin' ? 'border-red-500/30' : 'border-amber-500/30'}`}
                animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              {mode === 'admin' ? <Shield className="w-10 h-10 text-red-500" /> : <TrendingUp className="w-10 h-10 text-amber-500" />}
            </div>
            
            <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-orange-400 to-red-500 tracking-tight mb-2 drop-shadow-sm">
              LifeStock
            </h1>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] opacity-60">
              {getTitle()}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative">
            {mode !== 'admin' && (
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-amber-500/60 uppercase tracking-[0.2em] px-1">
                  Identity
                </label>
                <div className="relative group">
                  <User className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 group-focus-within:text-amber-500 transition-all duration-300" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border border-white/5 rounded-2xl bg-black/40 text-white placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/40 transition-all duration-300"
                    placeholder="Username"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-amber-500/60 uppercase tracking-[0.2em] px-1">
                Access Key
              </label>
              <div className="relative group">
                <Lock className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 group-focus-within:text-amber-500 transition-all duration-300" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 border border-white/5 rounded-2xl bg-black/40 text-white placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/40 transition-all duration-300"
                  placeholder="Password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-amber-400 transition-all"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-3"
              >
                <Shield className="w-4 h-4" />
                {error}
              </motion.div>
            )}

            <Button
              type="submit"
              className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.15em] transition-all duration-500 transform active:scale-[0.97] ${
                mode === 'admin' 
                  ? 'bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white shadow-[0_15px_30px_rgba(220,38,38,0.3)]' 
                  : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-[0_15px_30px_rgba(245,158,11,0.3)]'
              }`}
              disabled={loading}
            >
              <div className="flex items-center justify-center gap-3">
                {loading && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {!loading && (
                  <>
                    <span className="text-sm">{getButtonText()}</span>
                  </>
                )}
              </div>
            </Button>
          </form>

          <div className="mt-10 flex flex-col space-y-5 text-center relative">
            {mode === 'signin' && (
              <>
                <button onClick={() => { setMode('signup'); setError(null); }} className="text-amber-400/60 hover:text-amber-400 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300">
                  New here? Create Account
                </button>
                <div className="pt-6 border-t border-white/5">
                  <button onClick={() => { setMode('admin'); setError(null); }} className="text-gray-600 hover:text-red-500 text-[9px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center mx-auto space-x-2 opacity-50 hover:opacity-100">
                    <Shield className="w-3 h-3" />
                    <span>Admin Terminal</span>
                  </button>
                </div>
              </>
            )}

            {mode === 'signup' && (
              <>
                <button onClick={() => { setMode('signin'); setError(null); }} className="text-amber-400/60 hover:text-amber-400 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300">
                  Joined already? Sign In
                </button>
              </>
            )}

            {mode === 'admin' && (
              <button onClick={() => { setMode('signin'); setError(null); }} className="text-gray-600 hover:text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] transition-all">
                &larr; Back to login
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
