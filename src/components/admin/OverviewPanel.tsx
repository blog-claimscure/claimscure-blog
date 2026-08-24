import React from 'react';
import {
  FileText,
  Users,
  CheckCircle2,
  TrendingUp,
  Plus,
  Send,
  Download,
  Activity,
  ArrowUpRight,
} from 'lucide-react';
import { Article } from '../../types';

interface OverviewPanelProps {
  stats: {
    liveVisitors: number;
    totalArticles: number;
    publishedCount: number;
    draftCount: number;
    totalViews: number;
    totalSubscribers: number;
    totalLeads: number;
    topArticles: Article[];
  };
  onNewArticle: () => void;
  onSendCampaign: () => void;
  onExportLeads: () => void;
  onSelectArticle: (articleId: string) => void;
}

export const OverviewPanel: React.FC<OverviewPanelProps> = ({
  stats,
  onNewArticle,
  onSendCampaign,
  onExportLeads,
  onSelectArticle,
}) => {
  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Shortcuts */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
              ClaimsCure Super Admin Dashboard
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Publishing & Revenue Cycle Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Monitor article performance, active audience subscribers, claims audit leads, and real-time portal metrics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onNewArticle}
            className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs rounded-xl shadow transition-colors flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Compose Article</span>
          </button>

          <button
            onClick={onSendCampaign}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors flex items-center space-x-1.5"
          >
            <Send className="w-3.5 h-3.5 text-teal-400" />
            <span>Newsletter Campaign</span>
          </button>

          <button
            onClick={onExportLeads}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5 text-teal-400" />
            <span>Export Leads</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Total Articles</span>
            <FileText className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">
            {stats.totalArticles || 0}
          </p>
          <p className="text-[11px] text-slate-500">
            {stats.publishedCount} Published • {stats.draftCount} Drafts
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Subscribers</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">
            {stats.totalSubscribers || 0}
          </p>
          <p className="text-[11px] text-blue-600 font-medium">Active email list</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Claims Leads</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">
            {stats.totalLeads || 0}
          </p>
          <p className="text-[11px] text-indigo-600 font-medium">Audit requests</p>
        </div>
      </div>

      {/* Top Performing Articles Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center">
            <TrendingUp className="w-5 h-5 text-teal-600 mr-2" />
            Top Performing Publications
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 px-4">Publication Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(stats?.topArticles || []).map((art) => (
                <tr key={art.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <p className="line-clamp-1">{art.title}</p>
                    <p className="text-xs text-slate-400 font-normal">/{art.slug}</p>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-semibold text-teal-700">
                    {art.categoryId}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                        art.status === 'published'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {art.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onSelectArticle(art.id)}
                      className="px-3 py-1 rounded bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-700 text-xs font-bold transition-colors inline-flex items-center space-x-1"
                    >
                      <span>Edit</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
