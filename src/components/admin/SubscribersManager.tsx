import React, { useState } from 'react';
import { Mail, Download, Trash2, Send, CheckCircle2, Search, SendHorizontal } from 'lucide-react';
import { Subscriber, EmailCampaign } from '../../types';
import { api } from '../../lib/api';

interface SubscribersManagerProps {
  subscribers: Subscriber[];
  campaigns: EmailCampaign[];
  onRefresh: () => void;
}

export const SubscribersManager: React.FC<SubscribersManagerProps> = ({
  subscribers,
  campaigns,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'subscribers' | 'campaigns'>('subscribers');
  const [searchTerm, setSearchTerm] = useState('');
  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignSubject, setCampaignSubject] = useState('');
  const [campaignContent, setCampaignContent] = useState('');
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState('');

  const handleExportCSV = async () => {
    try {
      await api.exportSubscribers();
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    }
  };

  const handleDeleteSub = async (id: string) => {
    if (confirm('Delete subscriber from list?')) {
      await api.deleteSubscriber(id);
      onRefresh();
    }
  };

  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignTitle || !campaignSubject) return;

    setSending(true);
    setSendSuccess('');
    try {
      await api.sendCampaign(campaignTitle, campaignSubject, campaignContent);
      setSendSuccess(`Campaign dispatched successfully to ${subscribers.filter((s) => s.status === 'active').length} active subscribers!`);
      setCampaignTitle('');
      setCampaignSubject('');
      setCampaignContent('');
      onRefresh();
    } catch (err: any) {
      alert(`Campaign dispatch failed: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  const filteredSubs = subscribers.filter((s) =>
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Tab Controls */}
      <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-2xl max-w-sm">
        <button
          onClick={() => setActiveTab('subscribers')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'subscribers' ? 'bg-white text-slate-900 shadow' : 'text-slate-600'
          }`}
        >
          Active Subscribers ({subscribers.length})
        </button>
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'campaigns' ? 'bg-white text-slate-900 shadow' : 'text-slate-600'
          }`}
        >
          Email Campaigns ({campaigns.length})
        </button>
      </div>

      {activeTab === 'subscribers' ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search subscriber email..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs"
              />
            </div>

            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-slate-900 hover:bg-teal-600 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export Subscribers CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 uppercase tracking-wider text-slate-500 font-bold bg-slate-50">
                  <th className="py-3 px-4">Subscriber Email</th>
                  <th className="py-3 px-4">Subscription Date</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubs.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{s.email}</td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(s.subscribedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{s.source}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          s.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteSub(s.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Dispatch Form */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center">
              <SendHorizontal className="w-4 h-4 text-teal-600 mr-2" />
              Dispatch Email Newsletter
            </h3>

            {sendSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{sendSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSendCampaign} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Campaign Title
                </label>
                <input
                  type="text"
                  required
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  placeholder="e.g. August 2026 RCM Insights Digest"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Subject Line
                </label>
                <input
                  type="text"
                  required
                  value={campaignSubject}
                  onChange={(e) => setCampaignSubject(e.target.value)}
                  placeholder="ClaimsCure Insights: 2026 CMS Outpatient Billing Changes"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Body
                </label>
                <textarea
                  required
                  rows={5}
                  value={campaignContent}
                  onChange={(e) => setCampaignContent(e.target.value)}
                  placeholder="Write your newsletter message here. Subscribers will receive a branded email with this content."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 resize-y"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs rounded-xl shadow transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>Dispatch Campaign Now</span>
              </button>
            </form>
          </div>

          {/* Campaign Logs */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900">
              Email Campaign Dispatch History
            </h3>

            <div className="space-y-3">
              {campaigns.map((c) => (
                <div key={c.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-900 text-sm">{c.title}</p>
                    <span className="text-[10px] font-bold uppercase bg-teal-100 text-teal-800 px-2 py-0.5 rounded">
                      {c.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600">{c.subject}</p>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Sent: {new Date(c.sentAt).toLocaleString()}</span>
                    <span>
                      Recipients: <strong>{c.recipientsCount}</strong> | Opens: <strong>{c.openedCount}</strong> | Clicks: <strong>{c.clickedCount}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
