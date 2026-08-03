'use client';

import React, { useState } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, User, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const quickRoles = [
    { label: 'Super Admin', email: 'admin@aura.com' },
    { label: 'Store Manager', email: 'manager@aura.com' },
    { label: 'Cashier', email: 'cashier@aura.com' },
    { label: 'Head Chef', email: 'chef@aura.com' }
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', { email, password });
      const { accessToken, refreshToken, user, serverBootId } = res.data;

      // Store in sessionStorage so closing the browser/tab clears the session
      sessionStorage.setItem('erms_access_token', accessToken);
      sessionStorage.setItem('erms_user', JSON.stringify(user));
      if (serverBootId) {
        sessionStorage.setItem('erms_server_boot_id', serverBootId);
      }
      if (refreshToken) {
        sessionStorage.setItem('erms_refresh_token', refreshToken);
      }

      // Clear legacy localStorage keys to ensure clean session
      localStorage.removeItem('erms_access_token');
      localStorage.removeItem('erms_refresh_token');
      localStorage.removeItem('erms_user');

      window.location.href = '/my-attendance';
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check backend API.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Dynamic Background Glow Blobs */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl relative z-10"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center mx-auto mb-3 shadow-xl shadow-blue-500/25">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Enterprise ERMS</h1>
          <p className="text-xs text-zinc-400 mt-1">Aura Hospitality SaaS Platform</p>
        </div>

        {/* Quick Demo Role Selectors */}
        <div className="mb-6">
          <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
            ⚡ Quick Demo Persona Select:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {quickRoles.map((role) => (
              <button
                key={role.email}
                type="button"
                onClick={() => {
                  setEmail(role.email);
                  setPassword('Password123!');
                }}
                className={`py-1.5 px-3 rounded-xl text-xs font-medium border transition-all text-left ${
                  email === role.email
                    ? 'bg-blue-600/30 border-blue-500 text-blue-200'
                    : 'bg-white/5 border-white/10 text-zinc-400 hover:border-white/20'
                }`}
              >
                {role.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs text-zinc-300 font-medium block mb-1.5">Email Address</label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="name@aura.com"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-300 font-medium block mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all mt-6 disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-4 border-t border-white/10 text-center">
          <p className="text-[11px] text-zinc-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Protected by JWT RS256 & Enterprise RBAC</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
