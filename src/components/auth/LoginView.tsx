import React, { useState } from 'react';
import { GraduationCap, Lock, User, AlertCircle, CheckCircle2, Database } from 'lucide-react';
import { CONFIG } from '../../data/constants';
import { useSchool } from '../../context/SchoolContext';

interface LoginViewProps {
  onLogin?: (username: string, pass: string) => { success: boolean; message?: string };
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const { login: contextLogin, supabaseConnected, supabaseConfig } = useSchool();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const loginFn = onLogin || contextLogin;
      const res = loginFn(username, password);
      setIsLoading(false);
      if (!res.success) {
        setError(res.message || 'Invalid admin credentials.');
      }
    }, 200);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        {/* School branding */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
            <GraduationCap className="w-9 h-9" />
          </div>
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-2">
            CBSE Affiliated Senior Secondary School
          </span>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-snug">
            {CONFIG.SCHOOL_NAME}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Student & Examination Management System
          </p>
        </div>

        {/* Supabase backend status */}
        <div className="mb-4 p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <Database className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">Supabase Database:</span>
            <span className="font-mono text-[11px] text-emerald-800 font-bold">{supabaseConfig.projectId}</span>
          </div>
          <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
            <span className={`w-1.5 h-1.5 rounded-full ${supabaseConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {supabaseConnected ? 'Ready' : 'Checking'}
          </span>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
              Admin Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter admin username"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
              Admin Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                autoComplete="current-password"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Default Credentials:</span>
            </div>
            <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-300 text-slate-700">
              admin / admin123
            </span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? 'Signing in...' : 'Sign In to Management Panel'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-200 text-center">
          <p className="text-[11px] text-slate-400">
            Session: {CONFIG.DEFAULT_SESSION} • Examination: {CONFIG.DEFAULT_EXAM}
          </p>
        </div>
      </div>
    </div>
  );
};
