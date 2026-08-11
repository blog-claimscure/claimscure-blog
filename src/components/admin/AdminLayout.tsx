import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  UserCheck,
  Image as ImageIcon,
  Users,
  CheckCircle2,
  BarChart3,
  Settings,
  LogOut,
  Shield,
  Plus,
  ArrowLeft,
} from 'lucide-react';
import { Article, Category, Author, Tag, MediaItem, Subscriber, EmailCampaign, Lead, AnalyticsDashboard, SiteSettings } from '../../types';
import { api, clearAdminToken } from '../../lib/api';

import { OverviewPanel } from './OverviewPanel';
import { ArticleEditor } from './ArticleEditor';
import { CategoriesManager } from './CategoriesManager';
import { AuthorsManager } from './AuthorsManager';
import { MediaManager } from './MediaManager';
import { SubscribersManager } from './SubscribersManager';
import { LeadsManager } from './LeadsManager';
import { AnalyticsManager } from './AnalyticsManager';
import { SettingsManager } from './SettingsManager';

interface AdminLayoutProps {
  onLogout: () => void;
  onGoToPublicSite: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ onLogout, onGoToPublicSite }) => {
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'articles'
    | 'categories'
    | 'authors'
    | 'media'
    | 'subscribers'
    | 'leads'
    | 'analytics'
    | 'settings'
  >('overview');

  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsDashboard | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  const [editingArticle, setEditingArticle] = useState<Partial<Article> | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [artRes, catRes, authRes, tagRes, medRes, subRes, campRes, leadRes, anaRes, setRes] =
        await Promise.all([
          api.getArticles({ limit: 100 }),
          api.getCategories(),
          api.getAuthors(),
          api.getTags(),
          api.getMedia(),
          api.getSubscribers(),
          api.getCampaigns(),
          api.getLeads(),
          api.getAnalyticsDashboard(),
          api.getSiteSettings(),
        ]);

      setArticles(Array.isArray(artRes) ? artRes : artRes?.articles || []);
      setCategories(Array.isArray(catRes) ? catRes : (catRes as any)?.categories || []);
      setAuthors(Array.isArray(authRes) ? authRes : (authRes as any)?.authors || []);
      setTags(Array.isArray(tagRes) ? tagRes : (tagRes as any)?.tags || []);
      setMedia(Array.isArray(medRes) ? medRes : (medRes as any)?.media || []);
      setSubscribers(Array.isArray(subRes) ? subRes : (subRes as any)?.subscribers || []);
      setCampaigns(Array.isArray(campRes) ? campRes : (campRes as any)?.campaigns || []);
      setLeads(Array.isArray(leadRes) ? leadRes : (leadRes as any)?.leads || []);
      setAnalytics(anaRes || null);
      setSettings(setRes?.settings || setRes || null);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
      if (err.message && err.message.includes('401')) {
        clearAdminToken();
        onLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAdminToken();
    onLogout();
  };

  const handleCreateNewArticle = () => {
    setEditingArticle(null);
    setIsComposing(true);
    setActiveTab('articles');
  };

  const handleEditArticle = (art: Article) => {
    setEditingArticle(art);
    setIsComposing(true);
    setActiveTab('articles');
  };

  const handleDeleteArticle = async (id: string) => {
    if (confirm('Delete article permanently?')) {
      await api.deleteArticle(id);
      loadAllAdminData();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      {/* Super Admin Navbar */}
      <header className="bg-[#1A1A2E] text-white border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-[#0B5FA5] text-white flex items-center justify-center font-black">
                <Shield className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-white">
                Claims<span className="text-[#1E88E5]">Cure</span> Admin CMS
              </span>
              <span className="hidden sm:inline bg-[#0B5FA5]/30 text-[#1E88E5] text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-[#0B5FA5]">
                v2.4 Production
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={onGoToPublicSite}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-800 transition-colors flex items-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>View Live Blog</span>
              </button>

              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 text-xs font-bold border border-rose-800/80 transition-colors flex items-center space-x-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* CMS Submenu Navigation Tabs */}
          <div className="flex items-center space-x-1 overflow-x-auto py-2 text-xs font-bold no-scrollbar border-t border-slate-900">
            <button
              onClick={() => {
                setActiveTab('overview');
                setIsComposing(false);
              }}
              className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'overview' && !isComposing
                  ? 'bg-[#0B5FA5] text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('articles');
                setIsComposing(false);
              }}
              className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'articles'
                  ? 'bg-[#0B5FA5] text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Articles CMS ({articles.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('categories');
                setIsComposing(false);
              }}
              className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'categories'
                  ? 'bg-[#0B5FA5] text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              <span>Categories & Tags</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('authors');
                setIsComposing(false);
              }}
              className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'authors'
                  ? 'bg-[#0B5FA5] text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Authors</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('media');
                setIsComposing(false);
              }}
              className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'media'
                  ? 'bg-[#0B5FA5] text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Media Library</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('subscribers');
                setIsComposing(false);
              }}
              className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'subscribers'
                  ? 'bg-[#0B5FA5] text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Subscribers ({subscribers.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('leads');
                setIsComposing(false);
              }}
              className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'leads'
                  ? 'bg-[#0B5FA5] text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Audit Leads ({leads.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('analytics');
                setIsComposing(false);
              }}
              className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-[#0B5FA5] text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('settings');
                setIsComposing(false);
              }}
              className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-[#0B5FA5] text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin View Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Loading ClaimsCure Admin Database...
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && !isComposing && (
              <OverviewPanel
                stats={{
                  liveVisitors: 8,
                  totalArticles: articles.length,
                  publishedCount: articles.filter((a) => a.status === 'published').length,
                  draftCount: articles.filter((a) => a.status === 'draft').length,
                  totalViews: articles.reduce((sum, a) => sum + (a.views || 0), 0),
                  totalSubscribers: subscribers.length,
                  totalLeads: leads.length,
                  topArticles: articles.slice(0, 5),
                }}
                onNewArticle={handleCreateNewArticle}
                onSendCampaign={() => setActiveTab('subscribers')}
                onExportLeads={() => setActiveTab('leads')}
                onSelectArticle={(id) => {
                  const art = articles.find((a) => a.id === id);
                  if (art) handleEditArticle(art);
                }}
              />
            )}

            {activeTab === 'articles' && (
              <>
                {isComposing ? (
                  <ArticleEditor
                    article={editingArticle}
                    categories={categories}
                    authors={authors}
                    tags={tags}
                    onSaveSuccess={() => {
                      setIsComposing(false);
                      loadAllAdminData();
                    }}
                    onCancel={() => setIsComposing(false)}
                  />
                ) : (
                  <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="text-lg font-black text-slate-900">
                          Articles & Healthcare Publications ({articles.length})
                        </h3>
                        <p className="text-xs text-slate-500">
                          Manage, edit, or publish articles in the ClaimsCure repository.
                        </p>
                      </div>

                      <button
                        onClick={handleCreateNewArticle}
                        className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs rounded-xl shadow transition-colors flex items-center space-x-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Compose Article</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 uppercase tracking-wider text-slate-500 font-bold bg-slate-50">
                            <th className="py-3 px-4">Publication Title</th>
                            <th className="py-3 px-4">Category</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4">Featured</th>
                            <th className="py-3 px-4">Views</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {articles.map((art) => (
                            <tr key={art.id} className="hover:bg-slate-50">
                              <td className="py-3.5 px-4 font-bold text-slate-900">
                                <p className="line-clamp-1">{art.title}</p>
                                <p className="text-[10px] text-slate-400 font-normal">/{art.slug}</p>
                              </td>
                              <td className="py-3.5 px-4 font-semibold text-teal-700">
                                {categories.find((c) => c.id === art.categoryId)?.name || art.categoryId}
                              </td>
                              <td className="py-3.5 px-4">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    art.status === 'published'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {art.status}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 font-bold">
                                {art.isFeatured ? (
                                  <span className="text-teal-600">Yes</span>
                                ) : (
                                  <span className="text-slate-400">No</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 font-bold text-slate-800">{art.views || 0}</td>
                              <td className="py-3.5 px-4 text-right space-x-2">
                                <button
                                  onClick={() => handleEditArticle(art)}
                                  className="px-3 py-1 bg-slate-900 text-white hover:bg-teal-600 rounded text-xs font-bold transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteArticle(art.id)}
                                  className="px-2 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded text-xs font-bold transition-colors"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'categories' && (
              <CategoriesManager
                categories={categories}
                tags={tags}
                onRefresh={loadAllAdminData}
              />
            )}

            {activeTab === 'authors' && (
              <AuthorsManager authors={authors} onRefresh={loadAllAdminData} />
            )}

            {activeTab === 'media' && (
              <MediaManager media={media} onRefresh={loadAllAdminData} />
            )}

            {activeTab === 'subscribers' && (
              <SubscribersManager
                subscribers={subscribers}
                campaigns={campaigns}
                onRefresh={loadAllAdminData}
              />
            )}

            {activeTab === 'leads' && (
              <LeadsManager leads={leads} onRefresh={loadAllAdminData} />
            )}

            {activeTab === 'analytics' && <AnalyticsManager analytics={analytics} />}

            {activeTab === 'settings' && settings && (
              <SettingsManager settings={settings} onRefresh={loadAllAdminData} />
            )}
          </>
        )}
      </main>
    </div>
  );
};
