import React, { useState } from 'react';
import { Lock, Shield, ArrowRight, Eye, EyeOff, AlertCircle, X, ArrowLeft } from 'lucide-react';
import { api, setAdminToken } from '../../lib/api';

interface AdminLoginProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onCancel }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter administrator email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.login(email, password);
      if (res.token) {
        setAdminToken(res.token);
        onSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Close / Back to Website Button */}
        {onCancel && (
          <button
            onClick={onCancel}
            className="absolute top-5 right-5 p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition-colors cursor-pointer border border-slate-700 z-10"
            title="Close and return to website"
            aria-label="Close admin login"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="absolute top-0 right-0 w-32 h-32 bg-[#0B5FA5]/10 rounded-full blur-2xl pointer-events-none" />

        {onCancel && (
          <button
            onClick={onCancel}
            className="inline-flex items-center text-xs font-bold text-[#1E88E5] hover:text-white transition-colors cursor-pointer space-x-1 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Public Website</span>
          </button>
        )}

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#0B5FA5] text-white flex items-center justify-center mx-auto font-black shadow-lg">
            <Shield className="w-7 h-7" />
          </div>

          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Claims<span className="text-[#1E88E5]">Cure</span> CMS Portal
          </h2>

          <p className="text-xs text-slate-400">
            Protected Super Administrator Access Only
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-rose-950/80 border border-rose-800/80 text-rose-200 text-xs rounded-xl flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Administrator Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter administrator email"
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Super Admin password..."
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-teal-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-sm rounded-xl shadow-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Log In to Super Admin CMS</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="pt-4 border-t border-slate-800 text-center text-[11px] text-slate-500">
          <p>ClaimsCure LLC • Protected Publishing Infrastructure</p>
          <p className="mt-1">Administrator credentials are configured in server environment variables.</p>
        </div>
      </div>
    </div>
  );
};
