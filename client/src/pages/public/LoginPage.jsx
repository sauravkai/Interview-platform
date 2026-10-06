import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, Sparkles, UserCheck, Video, Shield, Lock, Mail, ArrowRight, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

const navigateByRole = (user, navigate) => {
  if (user?.role === 'interviewer') navigate('/interviewer/welcome');
  else if (user?.role === 'admin') navigate('/admin/dashboard');
  else navigate('/candidate/welcome');
};

export const LoginPage = () => {
  const { login, loginAsDemoRole, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const res = await login(email, password);
    setIsLoading(false);
    if (res?.success) {
      navigateByRole(res.user, navigate);
    } else {
      setError(res?.message || 'Invalid email or password');
    }
  };

  const handleQuickDemo = (role) => {
    loginAsDemoRole(role);
    if (role === 'candidate') navigate('/dashboard');
    else if (role === 'interviewer') navigate('/interviewer/dashboard');
    else if (role === 'admin') navigate('/admin/dashboard');
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center py-6 relative overflow-hidden ${isDark ? 'bg-slate-950' : 'bg-slate-100'}`}>
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute -top-24 right-12 w-72 h-72 rounded-full blur-3xl ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-200/60'}`}></div>
        <div className={`absolute -bottom-24 left-12 w-72 h-72 rounded-full blur-3xl ${isDark ? 'bg-violet-500/10' : 'bg-violet-200/60'}`}></div>
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className={`w-full max-w-[25rem] p-5 rounded-[28px] border shadow-[0_18px_50px_rgba(15,23,42,0.08)] relative z-10 ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}
      >
        <motion.div variants={itemVariants} className="text-center space-y-3">
          <button
            onClick={() => setIsDark(!isDark)}
            className={`absolute top-4 right-4 p-2 rounded-lg border transition-colors ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'}`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <div className="flex justify-center pt-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-[1px] shadow-lg shadow-indigo-500/20">
              <div className={`w-full h-full rounded-[15px] flex items-center justify-center ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
                <LogIn className={`w-7 h-7 ${isDark ? 'text-violet-400' : 'text-violet-600'}`} />
              </div>
            </div>
          </div>

          <h2 className={`text-3xl font-bold tracking-[-0.05em] ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Welcome Back
          </h2>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Sign in to your AI Interview account</p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className={`mt-4 p-3.5 rounded-2xl border ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
        >
          <div className="mb-3 text-center">
            <span className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Quick access
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <motion.button
              type="button"
              onClick={() => handleQuickDemo('candidate')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm"
            >
              <div className="flex flex-col items-center gap-1.5">
                <UserCheck className="w-4 h-4" />
                <span>Candidate</span>
              </div>
            </motion.button>

            <motion.button
              type="button"
              onClick={() => handleQuickDemo('interviewer')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-sm"
            >
              <div className="flex flex-col items-center gap-1.5">
                <Video className="w-4 h-4" />
                <span>Interviewer</span>
              </div>
            </motion.button>
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${isDark ? 'bg-rose-950/50 border border-rose-800/50 text-rose-300' : 'bg-rose-50 border border-rose-200 text-rose-700'}`}
          >
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span>
            {error}
          </motion.div>
        )}

        <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-4">
          {/* Google sign-in removed */}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className={`w-full border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}></div>
            </div>
            <div className={`relative flex justify-center text-xs uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              <span className={`px-2 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>Or sign in with email</span>
            </div>
          </div>

          <div>
            <label className={`text-sm font-medium block mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Email Address</label>
            <div className="relative group">
              <Mail className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-violet-500 transition-colors ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className={`w-full rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 font-sans transition-all shadow-sm ${isDark ? 'bg-slate-950/60 border border-slate-700/60 text-slate-200 placeholder-slate-500' : 'bg-slate-50/80 border border-slate-200 text-slate-900 placeholder-slate-400'}`}
              />
            </div>
          </div>

          <div>
            <label className={`text-sm font-medium block mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Password</label>
            <div className="relative group">
              <Lock className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-violet-500 transition-colors ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full rounded-2xl pl-11 pr-12 py-3.5 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 font-sans transition-all shadow-sm ${isDark ? 'bg-slate-950/60 border border-slate-700/60 text-slate-200 placeholder-slate-500' : 'bg-slate-50/80 border border-slate-200 text-slate-900 placeholder-slate-400'}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <Link
              to="/forgot-password"
              className={`text-xs font-medium underline-offset-4 hover:underline ${isDark ? 'text-violet-400 hover:text-violet-300' : 'text-violet-600 hover:text-violet-700'}`}
            >
              Forgot password?
            </Link>
          </div>

          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 hover:from-indigo-500 hover:via-violet-500 hover:to-pink-500 text-sm font-bold text-white shadow-[0_18px_36px_rgba(99,102,241,0.35)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Signing in...
              </>
            ) : (
              <>
                Sign In <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </motion.form>

        <motion.div variants={itemVariants} className={`text-center text-sm pt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Don't have an account?{' '}
          <Link to="/register" className={`font-semibold underline decoration-violet-400/30 hover:decoration-violet-400 underline-offset-4 transition-all ${isDark ? 'text-violet-400 hover:text-violet-300' : 'text-violet-600 hover:text-violet-700'}`}>
            Register here
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};
