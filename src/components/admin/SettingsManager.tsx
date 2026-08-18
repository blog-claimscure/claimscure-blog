import React, { useState, useEffect } from 'react';
import { Settings, Lock, Download, Upload, Shield, RefreshCw, Key, Check, Database, Globe, Sparkles, Mail } from 'lucide-react';
import { SiteSettings, ActivityLog } from '../../types';
import { api } from '../../lib/api';

interface SettingsManagerProps {
  settings: SiteSettings;
  onRefresh: () => void;
}

export const SettingsManager: React.FC<SettingsManagerProps> = ({ settings, onRefresh }) => {
  const [formData, setFormData] = useState<SiteSettings>(settings);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [saving, setSaving] = useState(false);
  const [passMsg, setPassMsg] = useState('');
  const [passError, setPassError] = useState('');

  const [dbStatus, setDbStatus] = useState<{
    primaryDatabase?: string;
    mongoStatus?: { isConnected: boolean; dbName?: string; uriConfigured: boolean };
    collections?: Record<string, number>;
  }>({});
  const [syncingMongo, setSyncingMongo] = useState(false);

  const [googleStatus, setGoogleStatus] = useState<{
    analytics?: { enabled: boolean; measurementId: string };
    searchConsole?: { enabled: boolean; siteUrl: string };
    googleDrive?: { enabled: boolean; hasClientId: boolean };
  }>({});
  const [pingingSearchConsole, setPingingSearchConsole] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{
    configured?: boolean;
    host?: string;
    fromEmail?: string;
    fromName?: string;
  }>({});
  const [testingEmail, setTestingEmail] = useState(false);

  useEffect(() => {
    fetchLogs();
    fetchDbStatus();
    fetchGoogleStatus();
    fetchEmailStatus();
  }, []);

  const fetchEmailStatus = async () => {
    try {
      const res = await api.getEmailStatus();
      setEmailStatus(res);
    } catch (e) {
      //
    }
  };

  const handleTestEmail = async () => {
    setTestingEmail(true);
    try {
      const res = await api.sendTestEmail();
      alert(res.message);
    } catch (err: any) {
      alert(`Email test failed: ${err.message}`);
    } finally {
      setTestingEmail(false);
    }
  };

  const fetchDbStatus = async () => {
    try {
      const res = await api.getDatabaseStatus();
      setDbStatus(res);
    } catch (e) {
      //
    }
  };

  const fetchGoogleStatus = async () => {
    try {
      const res = await api.getGoogleServicesStatus();
      setGoogleStatus(res);
    } catch (e) {
      //
    }
  };

  const handleSyncMongo = async () => {
    setSyncingMongo(true);
    try {
      const res = await api.syncMongoDB();
      alert(res.message);
      fetchDbStatus();
    } catch (err: any) {
      alert(`MongoDB Atlas Sync failed: ${err.message}`);
    } finally {
      setSyncingMongo(false);
    }
  };

  const handlePingSearchConsole = async () => {
    setPingingSearchConsole(true);
    try {
      const res = await api.pingSearchConsoleSitemap();
      alert(res.message);
    } catch (err: any) {
      alert(`Search Console Ping failed: ${err.message}`);
    } finally {
      setPingingSearchConsole(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await api.getActivityLogs();
      setLogs(res.activityLogs || []);
    } catch (e) {
      //
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateSiteSettings(formData);
      alert('Site configuration saved.');
      onRefresh();
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) return;

    setPassMsg('');
    setPassError('');
    try {
      await api.changePassword(oldPassword, newPassword);
      setPassMsg('Password changed successfully.');
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPassError(err.message || 'Password update failed.');
    }
  };

  const handleDownloadBackup = async () => {
    try {
      await api.downloadBackup();
    } catch (err: any) {
      alert(`Backup download failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Site Metadata Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center">
          <Settings className="w-5 h-5 text-teal-600 mr-2" />
          ClaimsCure Publishing Portal Settings
        </h3>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          {/* Logo Management Section */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <label className="block text-xs font-bold text-slate-800">
              ClaimsCure Logo Image (Header & Brand Display)
            </label>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-24 h-16 bg-white border border-slate-200 rounded-xl p-2 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                {formData.logoUrl ? (
                  <img src={formData.logoUrl} alt="Logo Preview" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-[10px] text-slate-400 font-bold">No Logo</span>
                )}
              </div>

              <div className="flex-1 w-full space-y-2">
                <input
                  type="text"
                  placeholder="Paste Logo Image URL or Base64 Image Data..."
                  value={formData.logoUrl || ''}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#0B5FA5]"
                />
                
                <div className="flex flex-wrap items-center gap-2">
                  <label className="cursor-pointer px-3 py-1.5 bg-[#0B5FA5] hover:bg-[#084A83] text-white font-bold text-xs rounded-lg transition-colors flex items-center space-x-1 shadow-sm">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Logo File</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (typeof reader.result === 'string') {
                              setFormData({ ...formData, logoUrl: reader.result });
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>

                  {formData.logoUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, logoUrl: '' })}
                      className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-xs rounded-lg transition-colors border border-rose-200"
                    >
                      Remove Custom Logo
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="site-name" className="block text-xs font-bold text-slate-700 mb-1">
                Site Name
              </label>
              <input
                id="site-name"
                type="text"
                value={formData.siteName}
                onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label htmlFor="site-tagline" className="block text-xs font-bold text-slate-700 mb-1">
                Tagline
              </label>
              <input
                id="site-tagline"
                type="text"
                value={formData.siteTagline}
                onChange={(e) => setFormData({ ...formData, siteTagline: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contact-phone" className="block text-xs font-bold text-slate-700 mb-1">
                Contact Phone Number
              </label>
              <input
                id="contact-phone"
                type="text"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800"
              />
            </div>

            <div>
              <label htmlFor="contact-email" className="block text-xs font-bold text-slate-700 mb-1">
                Contact Email
              </label>
              <input
                id="contact-email"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-[#0B5FA5] hover:bg-[#084A83] text-white font-extrabold text-xs rounded-xl shadow transition-colors cursor-pointer"
          >
            Save Site Settings
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Security & Password Change */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-black text-slate-900 flex items-center">
            <Lock className="w-4 h-4 text-teal-600 mr-2" />
            Super Admin Password Security
          </h3>

          {passMsg && <p className="text-xs text-emerald-600 font-bold">{passMsg}</p>}
          {passError && <p className="text-xs text-rose-600 font-bold">{passError}</p>}

          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label htmlFor="current-password" className="block text-xs font-bold text-slate-700 mb-1">
                Current Password
              </label>
              <input
                id="current-password"
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label htmlFor="new-password" className="block text-xs font-bold text-slate-700 mb-1">
                New Password (Min 8 characters)
              </label>
              <input
                id="new-password"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-teal-600 text-white font-bold text-xs rounded-xl transition-colors"
            >
              Update Super Admin Password
            </button>
          </form>
        </div>

        {/* Database Backup & Restore */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-black text-slate-900 flex items-center">
            <Download className="w-4 h-4 text-teal-600 mr-2" />
            Database Backup & Migration
          </h3>

          <p className="text-xs text-slate-600 leading-relaxed">
            Export a full JSON snapshot of all articles, categories, subscribers, audit leads, and media metadata for safe offsite backup.
          </p>

          <button
            onClick={handleDownloadBackup}
            className="w-full py-3 bg-slate-900 hover:bg-teal-600 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Database JSON Backup</span>
          </button>
        </div>
      </div>

      {/* MongoDB Atlas & Google Services Integration Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Brevo Email Integration Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 flex items-center">
              <Mail className="w-4 h-4 text-teal-600 mr-2" />
              Brevo Email (Newsletters)
            </h3>
            <span
              className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                emailStatus.configured
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border-rose-300'
              }`}
            >
              {emailStatus.configured ? 'SMTP CONNECTED' : 'NOT CONFIGURED'}
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Sends welcome emails on subscribe, auto-newsletters on publish, and manual campaigns from the Subscribers tab.
          </p>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>SMTP Host:</span>
              <span className="font-bold text-slate-900">{emailStatus.host || '—'}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>From Address:</span>
              <span className="font-bold text-slate-900">{emailStatus.fromEmail || '—'}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Sender Name:</span>
              <span className="font-bold text-slate-900">{emailStatus.fromName || '—'}</span>
            </div>
          </div>

          {emailStatus.configured && (
            <button
              onClick={handleTestEmail}
              disabled={testingEmail}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs rounded-xl shadow transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Mail className={`w-4 h-4 ${testingEmail ? 'animate-pulse' : ''}`} />
              <span>{testingEmail ? 'Sending Test Email...' : 'Send Test Email to Admin'}</span>
            </button>
          )}
        </div>

        {/* MongoDB Atlas Integration Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 flex items-center">
              <Database className="w-4 h-4 text-emerald-600 mr-2" />
              MongoDB Atlas Production DB
            </h3>
            <span
              className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                dbStatus.mongoStatus?.isConnected
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}
            >
              {dbStatus.mongoStatus?.isConnected ? 'ATLAS CONNECTED' : 'JSON DB ACTIVE (FALLBACK)'}
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Active Data Engine: <strong className="text-slate-900">{dbStatus.primaryDatabase || 'Local JSON'}</strong>.
            Configure <code className="bg-slate-100 px-1 py-0.5 rounded text-teal-700">MONGODB_URI</code> in environment variables to link your primary MongoDB Atlas cluster.
          </p>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Articles Collection:</span>
              <span className="font-bold text-slate-900">{dbStatus.collections?.articles || 0} items</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Subscribers & Leads:</span>
              <span className="font-bold text-slate-900">
                {(dbStatus.collections?.subscribers || 0) + (dbStatus.collections?.leads || 0)} entries
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Media Assets:</span>
              <span className="font-bold text-slate-900">{dbStatus.collections?.media || 0} items</span>
            </div>
          </div>

          {dbStatus.mongoStatus?.isConnected && (
            <button
              onClick={handleSyncMongo}
              disabled={syncingMongo}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow transition-colors flex items-center justify-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${syncingMongo ? 'animate-spin' : ''}`} />
              <span>{syncingMongo ? 'Syncing Collections...' : 'Sync All Collections to MongoDB Atlas'}</span>
            </button>
          )}
        </div>

        {/* Google Workspace, Analytics & Search Console */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 flex items-center">
              <Globe className="w-4 h-4 text-blue-600 mr-2" />
              Google Services & SEO Integration
            </h3>
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-600" />
              INTEGRATIONS ACTIVE
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">Google Analytics 4 (GA4)</p>
                <p className="text-[11px] text-slate-500">ID: {googleStatus.analytics?.measurementId}</p>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                TRACKING ACTIVE
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">Google Search Console</p>
                <p className="text-[11px] text-slate-500">Site: {googleStatus.searchConsole?.siteUrl}</p>
              </div>
              <button
                type="button"
                onClick={handlePingSearchConsole}
                disabled={pingingSearchConsole}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
              >
                {pingingSearchConsole ? 'Pinging...' : 'Ping Sitemap'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Audit & Activity Logs */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-black text-slate-900">
          Super Admin Security & Audit Trail
        </h3>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {logs.map((l) => (
            <div key={l.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
              <span className="font-mono text-slate-500">{new Date(l.timestamp).toLocaleString()}</span>
              <span className="font-bold text-slate-900">{l.action}</span>
              <span className="text-slate-500 font-mono">IP: {l.ip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
