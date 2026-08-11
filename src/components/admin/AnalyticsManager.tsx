import React from 'react';
import { BarChart3, TrendingUp, Eye, Globe, Smartphone, Monitor } from 'lucide-react';
import { AnalyticsDashboard } from '../../types';

interface AnalyticsManagerProps {
  analytics: AnalyticsDashboard | null;
}

export const AnalyticsManager: React.FC<AnalyticsManagerProps> = ({ analytics }) => {
  if (!analytics) return <p className="text-xs text-slate-500">Loading analytics...</p>;

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center">
              <BarChart3 className="w-5 h-5 text-teal-600 mr-2" />
              ClaimsCure Audience & Content Analytics
            </h3>
            <p className="text-xs text-slate-500">
              Real-time traffic metrics, top-read healthcare publications, and device breakdown.
            </p>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Reader Pageviews</span>
            <p className="text-3xl font-black text-slate-900">{analytics.totalViews}</p>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase">Unique Articles Read</span>
            <p className="text-3xl font-black text-slate-900">{analytics.totalArticles}</p>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase">Subscribers Converted</span>
            <p className="text-3xl font-black text-slate-900">{analytics.totalSubscribers}</p>
          </div>
        </div>

        {/* Top Publications Bar */}
        <div className="space-y-4 pt-4">
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            Most Viewed Publications
          </h4>

          <div className="space-y-3">
            {(analytics?.topArticles || []).map((art) => (
              <div
                key={art.id}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-slate-900 text-sm">{art.title}</p>
                  <p className="text-xs text-slate-500 font-mono">/{art.slug}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-teal-700 text-base">{art.views} views</p>
                  <p className="text-[10px] text-slate-400">Category: {art.categoryId}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
