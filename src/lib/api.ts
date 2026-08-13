import {
  Article,
  ArticleRevision,
  Category,
  Tag,
  Author,
  MediaItem,
  Subscriber,
  EmailCampaign,
  Lead,
  SiteSettings,
  ActivityLog,
} from '../types';

let adminToken: string | null = localStorage.getItem('claimscure_admin_token');

export function setAdminToken(token: string | null) {
  adminToken = token;
  if (token) {
    localStorage.setItem('claimscure_admin_token', token);
  } else {
    localStorage.removeItem('claimscure_admin_token');
  }
}

export function clearAdminToken() {
  setAdminToken(null);
}

export function getAdminToken() {
  return adminToken;
}

async function downloadAuthenticatedFile(endpoint: string, filename: string) {
  const headers: Record<string, string> = {};
  if (adminToken) {
    headers['Authorization'] = `Bearer ${adminToken}`;
  }

  const response = await fetch(endpoint, { headers });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Download failed (HTTP ${response.status}).`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (adminToken) {
    headers['Authorization'] = `Bearer ${adminToken}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers,
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: Request failed.`);
    }

    return data as T;
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error('Request timed out. The server may be waking up — please try again in a moment.');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ success: boolean; token: string; admin: { email: string } }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () =>
    request<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),
  getMe: () =>
    request<{ authenticated: boolean; admin: { email: string; lastLogin?: string } }>('/api/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ success: boolean; message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  // Articles
  getArticles: (params: Record<string, string | number> = {}) => {
    const stringParams: Record<string, string> = {};
    Object.keys(params).forEach((k) => {
      stringParams[k] = String(params[k]);
    });
    const query = new URLSearchParams(stringParams).toString();
    return request<{ articles: (Article & { category?: Category; author?: Author; tags?: Tag[] })[] }>(
      `/api/articles${query ? `?${query}` : ''}`
    );
  },
  getArticleBySlug: async (slug: string, visited: string[] = []): Promise<
    Article & { category?: Category; author?: Author; tags?: Tag[] }
  > => {
    if (visited.includes(slug)) {
      throw new Error('Article redirect loop detected.');
    }

    const res = await request<{
      article?: Article & { category?: Category; author?: Author; tags?: Tag[] };
      redirected?: boolean;
      targetSlug?: string;
    }>(`/api/articles/slug/${encodeURIComponent(slug)}`);

    if (res.redirected && res.targetSlug) {
      return api.getArticleBySlug(res.targetSlug, [...visited, slug]);
    }

    if (!res.article) {
      throw new Error('Article not found.');
    }

    return res.article;
  },
  createArticle: (data: Partial<Article>) =>
    request<{ success: boolean; article: Article }>('/api/articles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateArticle: (id: string, data: Partial<Article>) =>
    request<{ success: boolean; article: Article }>(`/api/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteArticle: (id: string) =>
    request<{ success: boolean }>(`/api/articles/${id}`, { method: 'DELETE' }),
  getArticleRevisions: (id: string) =>
    request<{ revisions: ArticleRevision[] }>(`/api/articles/${id}/revisions`),
  restoreArticleRevision: (id: string, revisionId: string) =>
    request<{ success: boolean; message: string }>(`/api/articles/${id}/restore`, {
      method: 'POST',
      body: JSON.stringify({ revisionId }),
    }),

  // Categories & Tags & Authors
  getCategories: () =>
    request<{ categories: Category[] }>('/api/categories').then((res) =>
      Array.isArray(res) ? res : res?.categories || []
    ),
  createCategory: (data: Partial<Category>) =>
    request<{ success: boolean; category: Category }>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCategory: (id: string, data: Partial<Category>) =>
    request<{ success: boolean }>(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id: string) =>
    request<{ success: boolean }>(`/api/categories/${id}`, { method: 'DELETE' }),

  getTags: () =>
    request<{ tags: Tag[] }>('/api/tags').then((res) =>
      Array.isArray(res) ? res : res?.tags || []
    ),
  createTag: (name: string) =>
    request<{ success: boolean; tag: Tag }>('/api/tags', { method: 'POST', body: JSON.stringify({ name }) }),
  deleteTag: (id: string) => request<{ success: boolean }>(`/api/tags/${id}`, { method: 'DELETE' }),

  getAuthors: () =>
    request<{ authors: Author[] }>('/api/authors').then((res) =>
      Array.isArray(res) ? res : res?.authors || []
    ),
  createAuthor: (data: Partial<Author>) =>
    request<{ success: boolean; author: Author }>('/api/authors', { method: 'POST', body: JSON.stringify(data) }),
  updateAuthor: (id: string, data: Partial<Author>) =>
    request<{ success: boolean }>(`/api/authors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAuthor: (id: string) => request<{ success: boolean }>(`/api/authors/${id}`, { method: 'DELETE' }),

  // Media & Cloudinary Integration
  getMedia: () =>
    request<{ media: MediaItem[] }>('/api/media').then((res) =>
      Array.isArray(res) ? res : res?.media || []
    ),
  getCloudinaryStatus: () =>
    request<{ isConfigured: boolean; cloudName?: string }>('/api/media/cloudinary-status'),
  uploadMedia: (filename: string, base64Data: string, alt?: string, caption?: string) =>
    request<{ success: boolean; media: MediaItem }>('/api/media/upload', {
      method: 'POST',
      body: JSON.stringify({ filename, base64Data, alt, caption }),
    }),
  updateMedia: (id: string, alt?: string, caption?: string) =>
    request<{ success: boolean; media: MediaItem }>(`/api/media/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ alt, caption }),
    }),
  deleteMedia: (id: string) => request<{ success: boolean }>(`/api/media/${id}`, { method: 'DELETE' }),
  migrateToCloudinary: () =>
    request<{ success: boolean; migratedCount: number; message: string }>('/api/media/migrate-to-cloudinary', {
      method: 'POST',
    }),

  // Subscribers
  subscribe: (email: string, source?: string) =>
    request<{ success: boolean; message: string }>('/api/subscribers', {
      method: 'POST',
      body: JSON.stringify({ email, source }),
    }),
  subscribeNewsletter: (email: string, source?: string) =>
    request<{ success: boolean; message: string }>('/api/subscribers', {
      method: 'POST',
      body: JSON.stringify({ email, source }),
    }),
  unsubscribe: (email: string) =>
    request<{ success: boolean; message: string }>('/api/subscribers/unsubscribe', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  getSubscribers: () =>
    request<{ subscribers: Subscriber[] }>('/api/subscribers').then((res) =>
      Array.isArray(res) ? res : res?.subscribers || []
    ),
  deleteSubscriber: (id: string) => request<{ success: boolean }>(`/api/subscribers/${id}`, { method: 'DELETE' }),
  exportSubscribers: () => downloadAuthenticatedFile('/api/subscribers/export', 'claimscure_subscribers.csv'),
  downloadBackup: () => downloadAuthenticatedFile('/api/backup', 'claimscure_backup.json'),
  getEmailStatus: () =>
    request<{ configured: boolean; host: string; fromEmail: string; fromName: string }>('/api/system/email-status'),
  sendTestEmail: () =>
    request<{ success: boolean; message: string }>('/api/system/test-email', { method: 'POST' }),

  // Email Campaigns
  getCampaigns: () =>
    request<{ campaigns: EmailCampaign[] }>('/api/email-campaigns').then((res) =>
      Array.isArray(res) ? res : res?.campaigns || []
    ),
  sendCampaign: (title: string, subject: string, content?: string) =>
    request<{ success: boolean; campaign: EmailCampaign; delivered?: number; bounced?: number; message?: string }>(
      '/api/email-campaigns/send',
      {
        method: 'POST',
        body: JSON.stringify({ title, subject, content }),
      }
    ),
  sendArticleNewsletter: (id: string, type: 'new' | 'update' = 'update') =>
    request<{ success: boolean; delivered: number; bounced: number; total: number; message: string }>(
      `/api/articles/${id}/send-newsletter`,
      {
        method: 'POST',
        body: JSON.stringify({ type }),
      }
    ),

  // Leads
  submitAuditLead: (data: {
    name: string;
    workEmail: string;
    phone?: string;
    clinicName: string;
    estimatedOutstandingDenials?: string;
    billingIssues?: string;
  }) =>
    request<{ success: boolean; message: string }>('/api/leads', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getLeads: () =>
    request<{ leads: Lead[] }>('/api/leads').then((res) =>
      Array.isArray(res) ? res : res?.leads || []
    ),
  updateLead: (id: string, data: Partial<Lead>) =>
    request<{ success: boolean }>(`/api/leads/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLead: (id: string) => request<{ success: boolean }>(`/api/leads/${id}`, { method: 'DELETE' }),

  // Analytics
  trackEvent: (type: string, path: string, articleId?: string) =>
    request<{ success: boolean }>('/api/analytics/event', {
      method: 'POST',
      body: JSON.stringify({ type, path, articleId }),
    }),
  getAnalyticsDashboard: () =>
    request<{
      liveVisitors: number;
      totalArticles: number;
      publishedCount: number;
      draftCount: number;
      totalViews: number;
      totalSubscribers: number;
      totalLeads: number;
      topArticles: Article[];
    }>('/api/analytics/dashboard'),

  // System Database Status & MongoDB Atlas
  getDatabaseStatus: () =>
    request<{
      primaryDatabase: string;
      mongoStatus: { isConnected: boolean; dbName?: string; uriConfigured: boolean };
      collections: Record<string, number>;
    }>('/api/system/database-status'),
  syncMongoDB: () =>
    request<{ success: boolean; message: string }>('/api/system/mongodb-sync', { method: 'POST' }),

  // Google Integrations
  importGoogleDoc: (docContent: string) =>
    request<{
      success: boolean;
      draft: { title: string; excerpt: string; content: string; tags: string[] };
    }>('/api/integrations/google-docs/import', {
      method: 'POST',
      body: JSON.stringify({ docContent }),
    }),
  getGoogleServicesStatus: () =>
    request<{
      analytics: { enabled: boolean; measurementId: string };
      searchConsole: { enabled: boolean; siteUrl: string };
      googleDrive: { enabled: boolean; hasClientId: boolean };
    }>('/api/integrations/google-services/status'),
  pingSearchConsoleSitemap: () =>
    request<{ success: boolean; sitemapUrl: string; message: string }>(
      '/api/integrations/google-search-console/ping-sitemap',
      { method: 'POST' }
    ),

  // Settings & Activity
  getSettings: () => request<{ settings: SiteSettings }>('/api/settings'),
  getSiteSettings: () => request<{ settings: SiteSettings }>('/api/settings'),
  updateSettings: (settings: Partial<SiteSettings>) =>
    request<{ success: boolean; settings: SiteSettings }>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
  updateSiteSettings: (settings: Partial<SiteSettings>) =>
    request<{ success: boolean; settings: SiteSettings }>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
  getActivityLogs: () => request<{ activityLogs: ActivityLog[] }>('/api/activity-logs'),
  restoreBackup: (backupJson: string | object) =>
    request<{ success: boolean; message: string }>('/api/backup/restore', {
      method: 'POST',
      body: JSON.stringify({ backupJson }),
    }),
};
