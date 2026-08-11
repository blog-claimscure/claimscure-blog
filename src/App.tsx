import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { FeaturedHero } from './components/FeaturedHero';
import { ArticleCard } from './components/ArticleCard';
import { ArticleDetail } from './components/ArticleDetail';
import { CategoryDetail } from './components/CategoryDetail';
import { AuthorDetail } from './components/AuthorDetail';
import { AuditModal } from './components/AuditModal';
import { SearchModal } from './components/SearchModal';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminLayout } from './components/admin/AdminLayout';

import { Article, Category, Author, Tag, SiteSettings } from './types';
import { api, getAdminToken, clearAdminToken } from './lib/api';
import { ArrowRight, Shield, FileText, FolderOpen } from 'lucide-react';

type AppRoute =
  | { type: 'home' }
  | { type: 'admin' }
  | { type: 'article'; slug: string }
  | { type: 'category'; slug: string }
  | { type: 'author'; slug: string };

function parseRoute(pathname: string): AppRoute {
  if (pathname.startsWith('/admin')) return { type: 'admin' };
  const articleMatch = pathname.match(/^\/article\/([^/]+)\/?$/);
  if (articleMatch) return { type: 'article', slug: decodeURIComponent(articleMatch[1]) };
  const categoryMatch = pathname.match(/^\/category\/([^/]+)\/?$/);
  if (categoryMatch) return { type: 'category', slug: decodeURIComponent(categoryMatch[1]) };
  const authorMatch = pathname.match(/^\/author\/([^/]+)\/?$/);
  if (authorMatch) return { type: 'author', slug: decodeURIComponent(authorMatch[1]) };
  return { type: 'home' };
}

function navigateTo(path: string, replace = false) {
  if (window.location.pathname === path) return;
  if (replace) {
    window.history.replaceState({}, '', path);
  } else {
    window.history.pushState({}, '', path);
  }
}

export default function App() {
  const [isAdminRoute, setIsAdminRoute] = useState(
    window.location.pathname.startsWith('/admin')
  );
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(!!getAdminToken());

  // Public state
  const [view, setView] = useState<'home' | 'article' | 'category' | 'author'>('home');
  const [articles, setArticles] = useState<(Article & { category?: Category; author?: Author })[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  // Active selections
  const [activeArticleSlug, setActiveArticleSlug] = useState<string | null>(null);
  const [activeArticle, setActiveArticle] = useState<
    (Article & { category?: Category; author?: Author; tags?: Tag[] }) | null
  >(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [activeAuthorId, setActiveAuthorId] = useState<string | null>(null);

  // Filters & Modals
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);

  const [loading, setLoading] = useState(true);
  const [articleLoading, setArticleLoading] = useState(false);

  const categoriesRef = useRef(categories);
  const authorsRef = useRef(authors);
  categoriesRef.current = categories;
  authorsRef.current = authors;

  const applyRoute = useCallback(async (route: AppRoute, skipUrlUpdate = true) => {
    if (route.type === 'admin') {
      setIsAdminRoute(true);
      return;
    }

    setIsAdminRoute(false);

    if (route.type === 'article') {
      setArticleLoading(true);
      try {
        const art = await api.getArticleBySlug(route.slug);
        setActiveArticle(art);
        setActiveArticleSlug(route.slug);
        setView('article');
        setActiveCategoryId(null);
        setActiveAuthorId(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (err) {
        console.error('Error fetching article from URL:', err);
        setView('home');
        setActiveArticle(null);
        setActiveArticleSlug(null);
        if (!skipUrlUpdate) navigateTo('/', true);
      } finally {
        setArticleLoading(false);
      }
      return;
    }

    if (route.type === 'category') {
      const cat = categoriesRef.current.find((c) => c.slug === route.slug || c.id === route.slug);
      if (cat) {
        setActiveCategoryId(cat.id);
        setView('category');
        setActiveArticle(null);
        setActiveArticleSlug(null);
        setActiveAuthorId(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setView('home');
        if (!skipUrlUpdate) navigateTo('/', true);
      }
      return;
    }

    if (route.type === 'author') {
      const auth = authorsRef.current.find((a) => a.slug === route.slug || a.id === route.slug);
      if (auth) {
        setActiveAuthorId(auth.id);
        setView('author');
        setActiveArticle(null);
        setActiveArticleSlug(null);
        setActiveCategoryId(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setView('home');
        if (!skipUrlUpdate) navigateTo('/', true);
      }
      return;
    }

    setView('home');
    setActiveArticle(null);
    setActiveArticleSlug(null);
    setActiveCategoryId(null);
    setActiveAuthorId(null);
  }, []);

  // Listen to browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      applyRoute(parseRoute(window.location.pathname), false);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [applyRoute]);

  // Restore admin session on page load if token is still valid
  const [checkingAuth, setCheckingAuth] = useState(
    window.location.pathname.startsWith('/admin') && !!getAdminToken()
  );

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      setIsAdminAuthenticated(false);
      setCheckingAuth(false);
      return;
    }

    api
      .getMe()
      .then((res) => {
        if (res.authenticated) {
          setIsAdminAuthenticated(true);
        } else {
          clearAdminToken();
          setIsAdminAuthenticated(false);
        }
      })
      .catch(() => {
        clearAdminToken();
        setIsAdminAuthenticated(false);
      })
      .finally(() => setCheckingAuth(false));
  }, []);

  // Fetch initial data
  useEffect(() => {
    loadPublicData();
  }, []);

  const loadPublicData = async () => {
    setLoading(true);
    try {
      const [artRes, catRes, authRes, setRes] = await Promise.all([
        api.getArticles({ status: 'published', limit: 50 }),
        api.getCategories(),
        api.getAuthors(),
        api.getSiteSettings(),
      ]);

      const loadedArticles = Array.isArray(artRes) ? artRes : artRes?.articles || [];
      const loadedCategories = Array.isArray(catRes) ? catRes : (catRes as any)?.categories || [];
      const loadedAuthors = Array.isArray(authRes) ? authRes : (authRes as any)?.authors || [];

      setArticles(loadedArticles);
      setCategories(loadedCategories);
      setAuthors(loadedAuthors);
      setSettings(setRes?.settings || setRes || null);

      const initialRoute = parseRoute(window.location.pathname);
      if (initialRoute.type !== 'home') {
        await applyRoute(initialRoute, true);
      }
    } catch (err) {
      console.error('Failed to load public blog data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Open article by slug
  const handleSelectArticle = async (slug: string) => {
    if (slug === activeArticleSlug && activeArticle) return;
    navigateTo(`/article/${slug}`);
    await applyRoute({ type: 'article', slug }, true);
  };

  const handleSelectCategory = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    setActiveCategoryId(catId);
    setView('category');
    navigateTo(cat ? `/category/${cat.slug}` : '/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectAuthor = (authId: string) => {
    const auth = authors.find((a) => a.id === authId);
    setActiveAuthorId(authId);
    setView('author');
    navigateTo(auth ? `/author/${auth.slug}` : '/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoHome = () => {
    setView('home');
    setActiveArticle(null);
    setActiveArticleSlug(null);
    setActiveCategoryId(null);
    setActiveAuthorId(null);
    navigateTo('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewsletterSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    try {
      await api.subscribeNewsletter(newsletterEmail, 'footer');
      setNewsletterSuccess(true);
      setNewsletterEmail('');
      setTimeout(() => setNewsletterSuccess(false), 4000);
    } catch (err) {
      //
    }
  };

  // If in /admin route
  if (isAdminRoute) {
    if (checkingAuth) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Verifying admin session...</p>
          </div>
        </div>
      );
    }

    if (!isAdminAuthenticated) {
      return (
        <AdminLogin
          onSuccess={() => {
            setIsAdminAuthenticated(true);
          }}
          onCancel={() => {
            window.history.pushState({}, '', '/');
            setIsAdminRoute(false);
          }}
        />
      );
    }

    return (
      <AdminLayout
        onLogout={() => setIsAdminAuthenticated(false)}
        onGoToPublicSite={() => {
          window.history.pushState({}, '', '/');
          setIsAdminRoute(false);
        }}
      />
    );
  }

  // Filtered public articles
  const featuredArticles = articles.filter((a) => a.isFeatured);
  const filteredArticles =
    selectedCategoryFilter === 'all'
      ? articles
      : articles.filter((a) => a.categoryId === selectedCategoryFilter);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-teal-500 selection:text-slate-950">
      <Header
        settings={settings}
        categories={categories}
        onSelectCategory={handleSelectCategory}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAudit={() => setIsAuditOpen(true)}
        onOpenAdmin={() => {
          window.history.pushState({}, '', '/admin');
          setIsAdminRoute(true);
        }}
        onGoHome={handleGoHome}
        canGoBack={view !== 'home'}
        onGoBack={handleGoHome}
      />

      <main className="flex-1 relative">
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Loading ClaimsCure Healthcare Publications...
            </p>
          </div>
        ) : (
          <>
            {articleLoading && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-white/95 border border-slate-200 shadow-md rounded-full px-4 py-2">
                <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-bold text-slate-600">Loading article...</span>
              </div>
            )}
            {/* VIEW: HOME */}
            {view === 'home' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
                {/* Hero Featured Publications Section */}
                <FeaturedHero
                  featuredArticles={featuredArticles.length > 0 ? featuredArticles : articles.slice(0, 3)}
                  onSelectArticle={handleSelectArticle}
                  onOpenAudit={() => setIsAuditOpen(true)}
                />

                {/* Main Category Cards Grid */}
                <section className="mb-12 font-sans">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-2">
                      <FolderOpen className="w-5 h-5 text-[#0B5FA5] shrink-0" />
                      <h2 className="text-xl sm:text-2xl font-extrabold text-[#1A1A2E] tracking-tight">
                        Explore Topics & Categories
                      </h2>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">
                      Select a category to view specialized publications
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {categories.map((c) => {
                      const count = articles.filter((a) => a.categoryId === c.id).length;
                      return (
                        <div
                          key={c.id}
                          onClick={() => handleSelectCategory(c.id)}
                          className="group bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs hover:shadow-md hover:border-[#1E88E5] transition-all cursor-pointer flex flex-col justify-between space-y-3"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="w-9 h-9 rounded-xl bg-[#E3F2FD] text-[#0B5FA5] group-hover:bg-[#0B5FA5] group-hover:text-white flex items-center justify-center font-extrabold text-sm transition-colors">
                                {c.name.charAt(0)}
                              </span>
                              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                {count} {count === 1 ? 'Article' : 'Articles'}
                              </span>
                            </div>

                            <h3 className="font-extrabold text-sm text-[#1A1A2E] group-hover:text-[#0B5FA5] transition-colors leading-snug">
                              {c.name}
                            </h3>

                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-normal">
                              {c.description || `Read expert reports on ${c.name}.`}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-[#0B5FA5]">
                            <span>Read Category</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Category Pills Filter Bar */}
                <div className="mb-8 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs font-sans">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black uppercase tracking-wider text-[#0B5FA5] flex items-center">
                      <FolderOpen className="w-3.5 h-3.5 mr-1.5 text-[#0B5FA5]" /> Browse Topics & Categories
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      Showing {filteredArticles.length} publication{filteredArticles.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1 text-xs">
                    <button
                      onClick={() => setSelectedCategoryFilter('all')}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer focus:outline-none ${
                        selectedCategoryFilter === 'all'
                          ? 'bg-[#0B5FA5] text-white shadow-sm'
                          : 'bg-[#F8FAFC] text-[#1A1A2E] hover:bg-[#E3F2FD] hover:text-[#0B5FA5] border border-slate-200'
                      }`}
                    >
                      All Topics ({articles.length})
                    </button>

                    {categories.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCategoryFilter(c.id)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer focus:outline-none ${
                          selectedCategoryFilter === c.id
                            ? 'bg-[#0B5FA5] text-white shadow-sm'
                            : 'bg-[#F8FAFC] text-[#1A1A2E] hover:bg-[#E3F2FD] hover:text-[#0B5FA5] border border-slate-200'
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Articles Feed Grid */}
                <div className="space-y-6 font-sans">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                      Latest Healthcare & RCM Articles
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {filteredArticles.map((art) => (
                      <ArticleCard
                        key={art.id}
                        article={art}
                        onSelect={handleSelectArticle}
                      />
                    ))}
                  </div>
                </div>

                {/* Free Claims Audit Banner Callout */}
                <section className="mt-16 bg-[#1A1A2E] text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-xl relative overflow-hidden font-sans">
                  <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    <div className="md:col-span-8 space-y-3">
                      <div className="inline-flex items-center space-x-2 bg-[#0B5FA5]/30 border border-[#1E88E5]/40 px-3 py-1 rounded-full">
                        <Shield className="w-4 h-4 text-[#1E88E5]" />
                        <span className="text-xs font-extrabold text-[#E3F2FD] uppercase tracking-wider">
                          ClaimsCure Revenue Services
                        </span>
                      </div>

                      <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight tracking-tight">
                        Transform Practice Denials into Clean Cash Flow
                      </h3>

                      <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-normal">
                        ClaimsCure LLC provides end-to-end medical billing, commercial payer appeals, credentialing, and revenue cycle optimization for U.S. healthcare practices.
                      </p>
                    </div>

                    <div className="md:col-span-4 flex flex-col justify-center items-start md:items-end space-y-3">
                      <button
                        onClick={() => setIsAuditOpen(true)}
                        className="w-full sm:w-auto px-6 py-3.5 bg-[#0B5FA5] hover:bg-[#1E88E5] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-2 active:scale-[0.98]"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Request Free Claims Audit</span>
                      </button>
                      <span className="text-[11px] text-slate-400 font-medium">
                        24-Hour Confidential Denial Analysis
                      </span>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* VIEW: ARTICLE DETAIL */}
            {view === 'article' && activeArticle && (
              <ArticleDetail
                article={activeArticle}
                relatedArticles={articles.filter((a) => a.id !== activeArticle.id)}
                onSelectArticle={handleSelectArticle}
                onOpenAudit={() => setIsAuditOpen(true)}
                onNavigateBack={handleGoHome}
              />
            )}

            {/* VIEW: CATEGORY DETAIL */}
            {view === 'category' && activeCategoryId && (
              <CategoryDetail
                category={categories.find((c) => c.id === activeCategoryId) || { id: activeCategoryId, name: 'Category', slug: 'cat' }}
                articles={articles.filter((a) => a.categoryId === activeCategoryId)}
                onSelectArticle={handleSelectArticle}
                onNavigateBack={handleGoHome}
              />
            )}

            {/* VIEW: AUTHOR DETAIL */}
            {view === 'author' && activeAuthorId && (
              <AuthorDetail
                author={authors.find((a) => a.id === activeAuthorId) || { id: activeAuthorId, name: 'Author', title: 'Consultant', credentials: 'CPC', bio: '', photo: '' }}
                articles={articles.filter((a) => a.authorId === activeAuthorId)}
                onSelectArticle={handleSelectArticle}
                onNavigateBack={handleGoHome}
              />
            )}
          </>
        )}
      </main>

      <Footer
        settings={settings}
        categories={categories}
        onSelectCategory={handleSelectCategory}
        onOpenAudit={() => setIsAuditOpen(true)}
        onOpenAdmin={() => {
          window.history.pushState({}, '', '/admin');
          setIsAdminRoute(true);
        }}
      />

      {/* Global Modals */}
      <AuditModal isOpen={isAuditOpen} onClose={() => setIsAuditOpen(false)} />
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectArticle={handleSelectArticle}
      />

      {/* Floating CMS Portal Button (Only visible when logged into Admin Panel) */}
      {isAdminAuthenticated && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => {
              window.history.pushState({}, '', '/admin');
              setIsAdminRoute(true);
            }}
            className="px-4 py-2.5 rounded-full shadow-2xl border transition-all flex items-center space-x-2 text-xs font-black cursor-pointer hover:scale-105 active:scale-95 bg-emerald-700 hover:bg-emerald-600 text-white border-emerald-400"
            title="Active Super Admin CMS Session"
            aria-label="Active Super Admin CMS Session"
          >
            <Shield className="w-4 h-4 text-emerald-200" />
            <span className="tracking-wider uppercase">CMS Active</span>
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
          </button>
        </div>
      )}
    </div>
  );
}
