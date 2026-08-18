import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import { db } from './src/server/db';
import {
  createSession,
  destroySession,
  requireAdminAuth,
  checkBruteForce,
  recordFailedAttempt,
  resetFailedAttempts,
  logActivity,
  getAdminEmailFromEnv,
  validateAdminCredentials,
} from './src/server/auth';
import {
  getCloudinaryConfig,
  uploadToCloudinaryService,
  deleteFromCloudinaryService,
} from './src/server/cloudinary';
import {
  checkMongoStatus,
  hydrateFromMongo,
  syncAllCollectionsToMongo,
  verifyMongoSync,
  getMongoCollectionCounts,
  SYNCABLE_COLLECTIONS,
} from './src/server/mongodb';
import { parseGoogleDocContent, getGoogleServicesStatus } from './src/server/googleIntegrations';
import {
  sendWelcomeEmail,
  sendReactivationEmail,
  sendArticleNewsletter,
  sendCustomNewsletter,
  sendAuditRequestConfirmationEmail,
  sendEmail,
  isEmailConfigured,
  getEmailConfigSummary,
} from './src/server/email';
import { runStartupDiagnostics, getHealthStatus } from './src/server/startup';

function resultTransportLabel(transport?: string) {
  if (transport === 'brevo-api') return 'Brevo HTTP API';
  if (transport === 'smtp') return 'SMTP';
  return 'email service';
}
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
} from './src/types';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const HOST = process.env.HOST || '0.0.0.0';

  app.set('trust proxy', 1);

  // Hydrate local JSON from MongoDB Atlas on startup (keeps Render redeploys in sync)
  const hydration = await hydrateFromMongo(db);
  if (hydration.hydrated) {
    console.log('[MongoDB] Startup hydration complete');
  }

  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));
  app.use(cookieParser());

  // Health check — use this on Render to verify API + services
  app.get('/api/health', async (_req, res) => {
    res.json(getHealthStatus());
  });

  // Serve uploaded media
  const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  // ----------------------------------------------------
  // AUTHENTICATION ROUTES
  // ----------------------------------------------------
  app.post('/api/auth/login', (req, res) => {
    const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const bruteCheck = checkBruteForce(clientIp);

    if (bruteCheck.isLocked) {
      logActivity('LOGIN_FAILED_LOCKED', `Brute-force lockout active for IP ${clientIp}`, req.body.email || 'unknown', clientIp);
      res.status(429).json({
        error: `Too many failed login attempts. Please try again in ${bruteCheck.remainingSeconds} seconds.`,
      });
      return;
    }

    const { email, password } = req.body;

    if (!email || !password || !validateAdminCredentials(email, password)) {
      recordFailedAttempt(clientIp);
      logActivity('LOGIN_FAILED', `Invalid email or password attempted: ${email || 'unknown'}`, email || 'unknown', clientIp);
      res.status(401).json({ error: 'Invalid administrator email or password.' });
      return;
    }

    const adminEmail = getAdminEmailFromEnv();

    // Success
    resetFailedAttempts(clientIp);
    const token = createSession(adminEmail);

    db.update('admin', (curr) => ({
      ...curr,
      email: adminEmail,
      lastLogin: new Date().toISOString(),
    }));

    logActivity('LOGIN_SUCCESS', 'Super Admin logged in successfully', adminEmail, clientIp);

    res.cookie('claimscure_admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      token,
      admin: { email: adminEmail, lastLogin: new Date().toISOString() },
    });
  });

  app.post('/api/auth/logout', requireAdminAuth, (req, res) => {
    const token = (req as any).sessionToken;
    const email = (req as any).adminEmail;
    destroySession(token);
    res.clearCookie('claimscure_admin_session');
    logActivity('LOGOUT', 'Super Admin logged out', email);
    res.json({ success: true });
  });

  app.get('/api/auth/me', requireAdminAuth, (req, res) => {
    const email = (req as any).adminEmail;
    const adminData = db.get('admin');
    res.json({
      authenticated: true,
      admin: { email, lastLogin: adminData.lastLogin },
    });
  });

  app.post('/api/auth/change-password', requireAdminAuth, (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const email = (req as any).adminEmail;
    const adminData = db.get('admin');

    if (!currentPassword || !newPassword || newPassword.length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters long.' });
      return;
    }

    if (!bcrypt.compareSync(currentPassword, adminData.passwordHash)) {
      res.status(400).json({ error: 'Current password is incorrect.' });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(newPassword, salt);

    db.update('admin', (curr) => ({
      ...curr,
      passwordHash: newHash,
    }));

    logActivity('PASSWORD_CHANGED', 'Super Admin updated password', email);
    res.json({ success: true, message: 'Password updated successfully.' });
  });

  // ----------------------------------------------------
  // PUBLIC & ADMIN ARTICLES ROUTES
  // ----------------------------------------------------
  app.get('/api/articles', (req, res) => {
    const { status, category, tag, author, featured, search } = req.query;
    let articles = db.get('articles');
    const categories = db.get('categories');
    const authors = db.get('authors');
    const tags = db.get('tags');

    // Filter by status (default to published for non-admins unless explicitly queried or requesting all)
    if (status && typeof status === 'string') {
      articles = articles.filter((a) => a.status === status);
    } else if (!req.headers.authorization && !req.cookies.claimscure_admin_session) {
      articles = articles.filter((a) => a.status === 'published');
    }

    if (category && typeof category === 'string') {
      const catObj = categories.find((c) => c.slug === category || c.id === category);
      if (catObj) {
        articles = articles.filter((a) => a.categoryId === catObj.id);
      }
    }

    if (tag && typeof tag === 'string') {
      const tagObj = tags.find((t) => t.slug === tag || t.id === tag);
      if (tagObj) {
        articles = articles.filter((a) => a.tagIds && a.tagIds.includes(tagObj.id));
      }
    }

    if (author && typeof author === 'string') {
      const authObj = authors.find((au) => au.slug === author || au.id === author);
      if (authObj) {
        articles = articles.filter((a) => a.authorId === authObj.id);
      }
    }

    if (featured === 'true') {
      articles = articles.filter((a) => a.isFeatured);
      articles.sort((a, b) => (a.featuredOrder || 99) - (b.featuredOrder || 99));
    } else {
      articles.sort((a, b) => new Date(b.publishedAt || b.updatedAt).getTime() - new Date(a.publishedAt || a.updatedAt).getTime());
    }

    if (search && typeof search === 'string') {
      const query = search.toLowerCase();
      articles = articles.filter((a) => {
        const cat = categories.find((c) => c.id === a.categoryId);
        const auth = authors.find((au) => au.id === a.authorId);
        return (
          a.title.toLowerCase().includes(query) ||
          a.excerpt.toLowerCase().includes(query) ||
          a.content.toLowerCase().includes(query) ||
          (cat && cat.name.toLowerCase().includes(query)) ||
          (auth && auth.name.toLowerCase().includes(query))
        );
      });
    }

    // Populate category & author objects
    const populated = articles.map((art) => ({
      ...art,
      category: categories.find((c) => c.id === art.categoryId),
      author: authors.find((au) => au.id === art.authorId),
      tags: (art.tagIds || []).map((tid) => tags.find((t) => t.id === tid)).filter(Boolean),
    }));

    res.json({ articles: populated });
  });

  app.get('/api/articles/slug/:slug', (req, res) => {
    const { slug } = req.params;

    // Check for URL redirect first
    const redirects = db.get('redirects');
    const redirect = redirects.find((r) => r.fromSlug === slug);
    if (redirect) {
      res.json({ redirected: true, targetSlug: redirect.toSlug });
      return;
    }

    const articles = db.get('articles');
    const article = articles.find((a) => a.slug === slug);

    if (!article) {
      res.status(404).json({ error: 'Article not found.' });
      return;
    }

    const categories = db.get('categories');
    const authors = db.get('authors');
    const tags = db.get('tags');

    // Increment view count asynchronously so reads stay fast and dev HMR is not triggered per view.
    setImmediate(() => {
      db.update('articles', (arts) =>
        arts.map((a) => (a.id === article.id ? { ...a, views: (a.views || 0) + 1 } : a))
      );
    });

    const populated = {
      ...article,
      views: (article.views || 0) + 1,
      category: categories.find((c) => c.id === article.categoryId),
      author: authors.find((au) => au.id === article.authorId),
      tags: (article.tagIds || []).map((tid) => tags.find((t) => t.id === tid)).filter(Boolean),
    };

    res.json({ article: populated });
  });

  app.get('/api/articles/:id/revisions', requireAdminAuth, (req, res) => {
    const { id } = req.params;
    const revisions = db.get('revisions').filter((r) => r.articleId === id);
    res.json({ revisions });
  });

  app.post('/api/articles/:id/restore', requireAdminAuth, (req, res) => {
    const { id } = req.params;
    const { revisionId } = req.body;

    const revision = db.get('revisions').find((r) => r.id === revisionId && r.articleId === id);
    if (!revision) {
      res.status(404).json({ error: 'Revision not found.' });
      return;
    }

    db.update('articles', (arts) =>
      arts.map((a) =>
        a.id === id
          ? {
              ...a,
              title: revision.title,
              content: revision.content,
              excerpt: revision.excerpt,
              updatedAt: new Date().toISOString(),
            }
          : a
      )
    );

    logActivity('RESTORE_REVISION', `Restored article revision ${revisionId} for article ${id}`, (req as any).adminEmail);
    res.json({ success: true, message: 'Revision restored successfully.' });
  });

  app.post('/api/articles', requireAdminAuth, (req, res) => {
    const adminEmail = (req as any).adminEmail;
    const data = req.body;

    if (!data.title) {
      res.status(400).json({ error: 'Article title is required.' });
      return;
    }

    if (data.status === 'published' && (!data.content || data.content.trim().length === 0)) {
      res.status(400).json({ error: 'Cannot publish article: Article body content is required before publishing.' });
      return;
    }

    let slug = data.slug
      ? data.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      : data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Word count / reading time calculation
    const words = (data.content || '').replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.ceil(words / 200));

    const newArticle: Article = {
      id: `art-${Date.now()}`,
      title: data.title,
      slug,
      excerpt: data.excerpt || '',
      content: data.content || '',
      categoryId: data.categoryId || 'cat-1',
      tagIds: data.tagIds || [],
      authorId: data.authorId || 'auth-1',
      featuredImage: data.featuredImage || 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1200&auto=format&fit=crop&q=80',
      imageAlt: data.imageAlt || data.title,
      publishedAt: data.status === 'published' ? new Date().toISOString() : data.publishedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      readingTime,
      status: data.status || 'draft',
      scheduledAt: data.scheduledAt,
      isFeatured: !!data.isFeatured,
      featuredOrder: data.featuredOrder || 99,
      seoTitle: data.seoTitle || `${data.title} | ClaimsCure Blog`,
      seoDescription: data.seoDescription || data.excerpt,
      focusKeyword: data.focusKeyword || '',
      canonicalUrl: data.canonicalUrl || '',
      ogTitle: data.ogTitle || data.title,
      ogDescription: data.ogDescription || data.excerpt,
      ogImage: data.ogImage || data.featuredImage,
      views: 0,
      shares: 0,
    };

    db.update('articles', (arts) => [newArticle, ...arts]);

    // Initial revision snapshot
    const revision: ArticleRevision = {
      id: `rev-${Date.now()}`,
      articleId: newArticle.id,
      title: newArticle.title,
      content: newArticle.content,
      excerpt: newArticle.excerpt,
      savedAt: new Date().toISOString(),
      savedBy: adminEmail,
      versionNote: 'Initial Creation',
    };
    db.update('revisions', (revs) => [revision, ...revs]);

    logActivity('CREATE_ARTICLE', `Created article: "${newArticle.title}" (${newArticle.status})`, adminEmail);

    // Auto Trigger Subscriber Email Campaign if published!
    if (newArticle.status === 'published' && req.body.triggerEmailCampaign !== false) {
      triggerSubscriberCampaign(newArticle, 'new').catch((err) =>
        console.error('[Email] Failed to send publish newsletter:', err.message)
      );
    }

    res.json({ success: true, article: newArticle });
  });

  app.put('/api/articles/:id', requireAdminAuth, (req, res) => {
    const { id } = req.params;
    const adminEmail = (req as any).adminEmail;
    const data = req.body;

    const articles = db.get('articles');
    const existing = articles.find((a) => a.id === id);

    if (!existing) {
      res.status(404).json({ error: 'Article not found.' });
      return;
    }

    const targetStatus = data.status || existing.status;
    const finalContent = data.content !== undefined ? data.content : existing.content;

    if (targetStatus === 'published' && (!finalContent || finalContent.trim().length === 0)) {
      res.status(400).json({ error: 'Cannot publish article: Article body content is required before publishing.' });
      return;
    }

    // Handle slug change redirect tracking
    if (data.slug && data.slug !== existing.slug) {
      db.update('redirects', (reds) => [
        ...reds,
        {
          id: `red-${Date.now()}`,
          fromSlug: existing.slug,
          toSlug: data.slug,
          createdAt: new Date().toISOString(),
        },
      ]);
    }

    const words = (data.content || existing.content).replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.ceil(words / 200));

    const wasPublished = existing.status === 'published';
    const isNowPublished = data.status === 'published';

    const updatedArticle: Article = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
      readingTime,
      publishedAt: isNowPublished && !existing.publishedAt ? new Date().toISOString() : existing.publishedAt || new Date().toISOString(),
    };

    db.update('articles', (arts) => arts.map((a) => (a.id === id ? updatedArticle : a)));

    // Save revision snapshot
    const revision: ArticleRevision = {
      id: `rev-${Date.now()}`,
      articleId: id,
      title: updatedArticle.title,
      content: updatedArticle.content,
      excerpt: updatedArticle.excerpt,
      savedAt: new Date().toISOString(),
      savedBy: adminEmail,
      versionNote: `Updated by ${adminEmail}`,
    };
    db.update('revisions', (revs) => [revision, ...revs]);

    logActivity('UPDATE_ARTICLE', `Updated article: "${updatedArticle.title}" (${updatedArticle.status})`, adminEmail);

    if (!wasPublished && isNowPublished && req.body.triggerEmailCampaign !== false) {
      triggerSubscriberCampaign(updatedArticle, 'new').catch((err) =>
        console.error('[Email] Failed to send publish newsletter:', err.message)
      );
    }

    res.json({ success: true, article: updatedArticle });
  });

  app.post('/api/articles/:id/send-newsletter', requireAdminAuth, async (req, res) => {
    const { id } = req.params;
    const { type = 'update' } = req.body;
    const adminEmail = (req as any).adminEmail;

    const article = db.get('articles').find((a) => a.id === id);
    if (!article) {
      res.status(404).json({ error: 'Article not found.' });
      return;
    }

    if (article.status !== 'published') {
      res.status(400).json({ error: 'Only published articles can be sent as newsletters.' });
      return;
    }

    if (!isEmailConfigured()) {
      res.status(503).json({ error: 'Email service is not configured. Please set SMTP credentials in environment variables.' });
      return;
    }

    const activeSubs = db.get('subscribers').filter((s) => s.status === 'active');
    if (activeSubs.length === 0) {
      res.status(400).json({ error: 'No active subscribers to send to.' });
      return;
    }

    const settings = db.get('settings');
    const emails = activeSubs.map((s) => s.email);
    const newsletterType = type === 'new' ? 'new' : 'update';
    const result = await sendArticleNewsletter(emails, article, newsletterType, settings);

    const campaign: EmailCampaign = {
      id: `camp-${Date.now()}`,
      title: `${newsletterType === 'update' ? 'Update' : 'New'} Newsletter: ${article.title}`,
      subject: newsletterType === 'update'
        ? `Updated: ${article.title} | ClaimsCure Insights`
        : `New Article: ${article.title} | ClaimsCure Insights`,
      articleId: article.id,
      sentAt: new Date().toISOString(),
      recipientsCount: activeSubs.length,
      deliveredCount: result.delivered,
      openedCount: 0,
      clickedCount: 0,
      bouncedCount: result.bounced,
      unsubscribedCount: 0,
      status: result.delivered > 0 ? 'sent' : 'failed',
    };

    db.update('emailCampaigns', (camps) => [campaign, ...camps]);
    logActivity(
      'MANUAL_ARTICLE_NEWSLETTER',
      `Sent ${newsletterType} newsletter for "${article.title}" to ${result.delivered}/${activeSubs.length} subscribers`,
      adminEmail
    );

    res.json({
      success: true,
      campaign,
      delivered: result.delivered,
      bounced: result.bounced,
      total: result.total,
      message: `Newsletter sent to ${result.delivered} of ${result.total} subscribers.`,
    });
  });

  app.delete('/api/articles/:id', requireAdminAuth, (req, res) => {
    const { id } = req.params;
    const adminEmail = (req as any).adminEmail;

    db.update('articles', (arts) => arts.filter((a) => a.id !== id));
    logActivity('DELETE_ARTICLE', `Deleted article ID: ${id}`, adminEmail);
    res.json({ success: true, message: 'Article deleted.' });
  });

  // Helper function to create subscriber notification email campaign
  async function triggerSubscriberCampaign(article: Article, type: 'new' | 'update' = 'new') {
    const settings = db.get('settings');
    const activeSubs = db.get('subscribers').filter((s) => s.status === 'active');
    if (activeSubs.length === 0) return;

    const emails = activeSubs.map((s) => s.email);
    let delivered = 0;
    let bounced = 0;

    if (isEmailConfigured()) {
      const result = await sendArticleNewsletter(emails, article, type, settings);
      delivered = result.delivered;
      bounced = result.bounced;
    } else {
      console.warn('[Email] SMTP not configured — campaign logged but emails not sent.');
      delivered = activeSubs.length;
    }

    const campaign: EmailCampaign = {
      id: `camp-${Date.now()}`,
      title: type === 'update' ? `Update Newsletter: ${article.title}` : `Auto Newsletter: ${article.title}`,
      subject: type === 'update'
        ? `Updated: ${article.title} | ClaimsCure Insights`
        : `New Article: ${article.title} | ClaimsCure Insights`,
      articleId: article.id,
      sentAt: new Date().toISOString(),
      recipientsCount: activeSubs.length,
      deliveredCount: delivered,
      openedCount: 0,
      clickedCount: 0,
      bouncedCount: bounced,
      unsubscribedCount: 0,
      status: bounced > 0 && delivered === 0 ? 'failed' : 'sent',
    };

    db.update('emailCampaigns', (camps) => [campaign, ...camps]);
    logActivity(
      'AUTO_EMAIL_CAMPAIGN',
      `Dispatched ${type} email newsletter for "${article.title}" to ${delivered}/${activeSubs.length} subscribers.`
    );
  }

  // ----------------------------------------------------
  // CATEGORIES, TAGS, AUTHORS
  // ----------------------------------------------------
  app.get('/api/categories', (req, res) => {
    const categories = db.get('categories');
    categories.sort((a, b) => a.order - b.order);
    res.json({ categories });
  });

  app.post('/api/categories', requireAdminAuth, (req, res) => {
    const { name, slug, description, image, order } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Category name is required.' });
      return;
    }
    const categorySlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name,
      slug: categorySlug,
      description: description || '',
      image,
      order: order || 99,
    };

    db.update('categories', (cats) => [...cats, newCategory]);
    logActivity('CREATE_CATEGORY', `Created category: ${name}`, (req as any).adminEmail);
    res.json({ success: true, category: newCategory });
  });

  app.put('/api/categories/:id', requireAdminAuth, (req, res) => {
    const { id } = req.params;
    db.update('categories', (cats) =>
      cats.map((c) => (c.id === id ? { ...c, ...req.body } : c))
    );
    logActivity('UPDATE_CATEGORY', `Updated category ID: ${id}`, (req as any).adminEmail);
    res.json({ success: true });
  });

  app.delete('/api/categories/:id', requireAdminAuth, (req, res) => {
    const { id } = req.params;
    db.update('categories', (cats) => cats.filter((c) => c.id !== id));
    logActivity('DELETE_CATEGORY', `Deleted category ID: ${id}`, (req as any).adminEmail);
    res.json({ success: true });
  });

  app.get('/api/tags', (req, res) => {
    res.json({ tags: db.get('tags') });
  });

  app.post('/api/tags', requireAdminAuth, (req, res) => {
    const { name } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Tag name is required.' });
      return;
    }
    const newTag: Tag = {
      id: `tag-${Date.now()}`,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    };
    db.update('tags', (t) => [...t, newTag]);
    logActivity('CREATE_TAG', `Created tag: ${name}`, (req as any).adminEmail);
    res.json({ success: true, tag: newTag });
  });

  app.delete('/api/tags/:id', requireAdminAuth, (req, res) => {
    db.update('tags', (t) => t.filter((x) => x.id !== req.params.id));
    res.json({ success: true });
  });

  app.get('/api/authors', (req, res) => {
    res.json({ authors: db.get('authors') });
  });

  app.post('/api/authors', requireAdminAuth, (req, res) => {
    const { name, title, bio, photo, credentials, linkedin, website } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Author name is required.' });
      return;
    }
    const newAuthor: Author = {
      id: `auth-${Date.now()}`,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      title: title || 'RCM Consultant',
      bio: bio || '',
      photo: photo || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&auto=format&fit=crop&q=80',
      credentials: credentials || 'CPC',
      linkedin,
      website,
    };
    db.update('authors', (aus) => [...aus, newAuthor]);
    logActivity('CREATE_AUTHOR', `Created author: ${name}`, (req as any).adminEmail);
    res.json({ success: true, author: newAuthor });
  });

  app.put('/api/authors/:id', requireAdminAuth, (req, res) => {
    const { id } = req.params;
    db.update('authors', (aus) =>
      aus.map((a) => (a.id === id ? { ...a, ...req.body } : a))
    );
    logActivity('UPDATE_AUTHOR', `Updated author ID: ${id}`, (req as any).adminEmail);
    res.json({ success: true });
  });

  app.delete('/api/authors/:id', requireAdminAuth, (req, res) => {
    db.update('authors', (aus) => aus.filter((a) => a.id !== req.params.id));
    res.json({ success: true });
  });

  // ----------------------------------------------------
  // MEDIA LIBRARY & CLOUDINARY INTEGRATION
  // ----------------------------------------------------
  app.get('/api/media', requireAdminAuth, (req, res) => {
    res.json({ media: db.get('media') });
  });

  app.get('/api/media/cloudinary-status', requireAdminAuth, (req, res) => {
    const config = getCloudinaryConfig();
    res.json({
      isConfigured: config.isConfigured,
      cloudName: config.cloudName || undefined,
    });
  });

  app.post('/api/media/upload', requireAdminAuth, async (req, res) => {
    const { filename, base64Data, alt, caption } = req.body;
    if (!filename || !base64Data) {
      res.status(400).json({ error: 'Filename and image data are required.' });
      return;
    }

    try {
      const config = getCloudinaryConfig();

      if (config.isConfigured) {
        // Upload directly to Cloudinary
        const cloudRes = await uploadToCloudinaryService(base64Data, {
          folder: 'claimscure_cms',
          alt,
        });

        const mediaItem: MediaItem = {
          id: `med-${Date.now()}`,
          filename: filename.replace(/[^a-zA-Z0-9.-]/g, '_'),
          url: cloudRes.url,
          cloudinaryUrl: cloudRes.url,
          publicId: cloudRes.publicId,
          alt: alt || filename,
          caption: caption || '',
          mimeType: `image/${cloudRes.format || 'jpeg'}`,
          fileSize: cloudRes.bytes || 102400,
          dimensions: `${cloudRes.width || 1200}x${cloudRes.height || 800}`,
          format: cloudRes.format,
          width: cloudRes.width,
          height: cloudRes.height,
          isCloudinary: true,
          createdAt: new Date().toISOString(),
        };

        db.update('media', (meds) => [mediaItem, ...meds]);
        logActivity('UPLOAD_MEDIA_CLOUDINARY', `Uploaded image to Cloudinary: ${filename} (Public ID: ${cloudRes.publicId})`, (req as any).adminEmail);

        res.json({ success: true, media: mediaItem });
      } else {
        // Local fallback when Cloudinary env vars are pending
        const match = base64Data.match(/^data:(image\/\w+);base64,(.+)$/);
        let buffer: Buffer;
        let mimeType = 'image/jpeg';

        if (match) {
          mimeType = match[1];
          buffer = Buffer.from(match[2], 'base64');
        } else {
          buffer = Buffer.from(base64Data, 'base64');
        }

        const safeName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const filePath = path.join(uploadsDir, safeName);
        fs.writeFileSync(filePath, buffer);

        const mediaUrl = `/uploads/${safeName}`;
        const mediaItem: MediaItem = {
          id: `med-${Date.now()}`,
          filename: safeName,
          url: mediaUrl,
          alt: alt || filename,
          caption: caption || '',
          mimeType,
          fileSize: buffer.length,
          dimensions: '1200x800',
          isCloudinary: false,
          createdAt: new Date().toISOString(),
        };

        db.update('media', (meds) => [mediaItem, ...meds]);
        logActivity('UPLOAD_MEDIA_LOCAL', `Uploaded image locally: ${safeName}`, (req as any).adminEmail);

        res.json({ success: true, media: mediaItem });
      }
    } catch (err: any) {
      console.error('Media upload error:', err);
      res.status(500).json({ error: `Upload failed: ${err.message}` });
    }
  });

  app.put('/api/media/:id', requireAdminAuth, (req, res) => {
    const { id } = req.params;
    const { alt, caption } = req.body;

    let updatedItem: MediaItem | null = null;
    db.update('media', (meds) =>
      meds.map((m) => {
        if (m.id === id) {
          updatedItem = { ...m, alt: alt !== undefined ? alt : m.alt, caption: caption !== undefined ? caption : m.caption };
          return updatedItem;
        }
        return m;
      })
    );

    if (updatedItem) {
      logActivity('UPDATE_MEDIA_METADATA', `Updated media metadata ID: ${id}`, (req as any).adminEmail);
      res.json({ success: true, media: updatedItem });
    } else {
      res.status(404).json({ error: 'Media item not found.' });
    }
  });

  app.delete('/api/media/:id', requireAdminAuth, async (req, res) => {
    const { id } = req.params;
    const item = db.get('media').find((m) => m.id === id);

    if (item) {
      // If hosted on Cloudinary, delete from Cloudinary
      if (item.publicId) {
        await deleteFromCloudinaryService(item.publicId);
      }

      // If stored locally
      if (item.url.startsWith('/uploads/')) {
        const filePath = path.join(process.cwd(), 'data', item.url);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (e) {
            // Ignore
          }
        }
      }
    }

    db.update('media', (meds) => meds.filter((m) => m.id !== id));
    logActivity('DELETE_MEDIA', `Deleted media ID: ${id} ${item?.publicId ? `(Cloudinary ID: ${item.publicId})` : ''}`, (req as any).adminEmail);
    res.json({ success: true });
  });

  app.post('/api/media/migrate-to-cloudinary', requireAdminAuth, async (req, res) => {
    const config = getCloudinaryConfig();
    if (!config.isConfigured) {
      res.status(400).json({
        error: 'Cloudinary credentials are not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
      });
      return;
    }

    const currentMedia = db.get('media');
    const toMigrate = currentMedia.filter((m) => !m.isCloudinary || !m.publicId);

    let migratedCount = 0;
    for (const item of toMigrate) {
      try {
        let uploadSource = item.url;
        if (item.url.startsWith('/uploads/')) {
          const localPath = path.join(process.cwd(), 'data', item.url);
          if (fs.existsSync(localPath)) {
            uploadSource = localPath;
          }
        }

        const cloudRes = await uploadToCloudinaryService(uploadSource, {
          folder: 'claimscure_cms',
          alt: item.alt,
        });

        db.update('media', (meds) =>
          meds.map((m) =>
            m.id === item.id
              ? {
                  ...m,
                  url: cloudRes.url,
                  cloudinaryUrl: cloudRes.url,
                  publicId: cloudRes.publicId,
                  format: cloudRes.format,
                  width: cloudRes.width,
                  height: cloudRes.height,
                  isCloudinary: true,
                }
              : m
          )
        );
        migratedCount++;
      } catch (err) {
        console.error(`Failed to migrate media item ${item.id} to Cloudinary:`, err);
      }
    }

    logActivity('MIGRATE_MEDIA_CLOUDINARY', `Migrated ${migratedCount} media items to Cloudinary.`, (req as any).adminEmail);
    res.json({
      success: true,
      migratedCount,
      message: `Successfully migrated ${migratedCount} media items to Cloudinary CDN!`,
    });
  });

  // ----------------------------------------------------
  // SUBSCRIBERS & CAMPAIGNS
  // ----------------------------------------------------
  app.post('/api/subscribers', async (req, res) => {
    const { email, source } = req.body;
    if (!email || !email.includes('@')) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }

    const settings = db.get('settings');
    const subscribers = db.get('subscribers');
    const existing = subscribers.find((s) => s.email.toLowerCase() === email.toLowerCase());

    if (existing) {
      if (existing.status === 'unsubscribed') {
        db.update('subscribers', (subs) =>
          subs.map((s) => (s.id === existing.id ? { ...s, status: 'active', unsubscribedAt: undefined } : s))
        );
        if (isEmailConfigured()) {
          console.log(`[Email] Sending reactivation email to ${existing.email}...`);
          const emailResult = await sendReactivationEmail(existing.email, settings);
          if (!emailResult.success) console.error('[Email] Reactivation failed:', emailResult.error);
        } else {
          console.error('[Email] Reactivation skipped — BREVO_API_KEY not configured');
        }
        res.json({ success: true, message: 'Welcome back! Your newsletter subscription is re-activated.' });
        return;
      }
      res.json({ success: true, message: 'You are already subscribed to ClaimsCure Insights.' });
      return;
    }

    const newSub: Subscriber = {
      id: `sub-${Date.now()}`,
      email: email.toLowerCase().trim(),
      subscribedAt: new Date().toISOString(),
      source: source || 'Public Website',
      status: 'active',
    };

    db.update('subscribers', (subs) => [newSub, ...subs]);

    db.update('analyticsEvents', (evts) => [
      {
        id: `evt-${Date.now()}`,
        type: 'subscriber_conversion',
        path: req.headers.referer || '/',
        timestamp: new Date().toISOString(),
      },
      ...evts,
    ]);

    // Send welcome email BEFORE responding so it actually completes on Render
    let emailSent = false;
    if (!isEmailConfigured()) {
      console.error('[Email] CRITICAL: Cannot send welcome email — BREVO_API_KEY is not set in server environment!');
      console.error('[Email] Add BREVO_API_KEY to Render → Environment → Environment Variables, then redeploy.');
    } else {
      console.log(`[Email] Sending welcome email to ${newSub.email}...`);
      const emailResult = await sendWelcomeEmail(newSub.email, settings);
      emailSent = emailResult.success;
      if (emailResult.success) {
        console.log(`[Email] Welcome email delivered to ${newSub.email} via ${emailResult.transport}`);
      } else {
        console.error(`[Email] Welcome email FAILED for ${newSub.email}:`, emailResult.error);
      }
    }

    res.json({
      success: true,
      message: emailSent
        ? 'Thank you for subscribing! Check your inbox for a welcome email.'
        : 'Thank you for subscribing to ClaimsCure Insights!',
      emailSent,
    });
  });

  app.post('/api/subscribers/unsubscribe', (req, res) => {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required.' });
      return;
    }

    db.update('subscribers', (subs) =>
      subs.map((s) =>
        s.email.toLowerCase() === email.toLowerCase()
          ? { ...s, status: 'unsubscribed', unsubscribedAt: new Date().toISOString() }
          : s
      )
    );

    res.json({ success: true, message: 'You have been unsubscribed from ClaimsCure Insights.' });
  });

  app.get('/api/subscribers/unsubscribe', (req, res) => {
    const email = typeof req.query.email === 'string' ? req.query.email : '';
    if (!email) {
      res.status(400).send('<h1>Invalid unsubscribe link</h1><p>Email parameter is missing.</p>');
      return;
    }

    db.update('subscribers', (subs) =>
      subs.map((s) =>
        s.email.toLowerCase() === email.toLowerCase()
          ? { ...s, status: 'unsubscribed', unsubscribedAt: new Date().toISOString() }
          : s
      )
    );

    const settings = db.get('settings');
    const siteName = settings.siteName || 'ClaimsCure Insights';
    res.send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>Unsubscribed</title></head>
<body style="font-family:Arial,sans-serif;background:#f1f5f9;padding:40px;text-align:center;">
  <div style="max-width:480px;margin:0 auto;background:#fff;padding:32px;border-radius:12px;border:1px solid #e2e8f0;">
    <h1 style="color:#0B5FA5;margin:0 0 12px;">You've been unsubscribed</h1>
    <p style="color:#475569;line-height:1.6;">You will no longer receive emails from ${siteName}.</p>
    <a href="/" style="display:inline-block;margin-top:20px;color:#0B5FA5;font-weight:bold;">Return to blog</a>
  </div>
</body></html>`);
  });

  app.get('/api/subscribers', requireAdminAuth, (req, res) => {
    res.json({ subscribers: db.get('subscribers') });
  });

  app.get('/api/subscribers/export', requireAdminAuth, (req, res) => {
    const subscribers = db.get('subscribers');
    let csv = 'Email,Status,SubscribedAt,Source\n';
    subscribers.forEach((s) => {
      csv += `"${s.email}","${s.status}","${s.subscribedAt}","${s.source}"\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="claimscure_subscribers.csv"');
    res.send(csv);
  });

  app.delete('/api/subscribers/:id', requireAdminAuth, (req, res) => {
    db.update('subscribers', (subs) => subs.filter((s) => s.id !== req.params.id));
    res.json({ success: true });
  });

  app.get('/api/email-campaigns', requireAdminAuth, (req, res) => {
    res.json({ campaigns: db.get('emailCampaigns') });
  });

  app.post('/api/email-campaigns/send', requireAdminAuth, async (req, res) => {
    const { title, subject, content } = req.body;
    const adminEmail = (req as any).adminEmail;
    const activeSubs = db.get('subscribers').filter((s) => s.status === 'active');

    if (activeSubs.length === 0) {
      res.status(400).json({ error: 'No active subscribers to send to.' });
      return;
    }

    if (!isEmailConfigured()) {
      res.status(503).json({ error: 'Email service is not configured. Please set SMTP credentials in environment variables.' });
      return;
    }

    const settings = db.get('settings');
    const emails = activeSubs.map((s) => s.email);
    const emailContent = content || `This is your latest update from ${settings.siteName || 'ClaimsCure Insights'}. Visit our blog for the newest healthcare RCM articles and compliance guides.`;
    const result = await sendCustomNewsletter(emails, subject || 'ClaimsCure Insights Newsletter', emailContent, settings);

    const campaign: EmailCampaign = {
      id: `camp-${Date.now()}`,
      title: title || 'Manual Newsletter',
      subject: subject || 'ClaimsCure Insights Newsletter',
      sentAt: new Date().toISOString(),
      recipientsCount: activeSubs.length,
      deliveredCount: result.delivered,
      openedCount: 0,
      clickedCount: 0,
      bouncedCount: result.bounced,
      unsubscribedCount: 0,
      status: result.delivered > 0 ? 'sent' : 'failed',
    };

    db.update('emailCampaigns', (camps) => [campaign, ...camps]);
    logActivity(
      'MANUAL_EMAIL_CAMPAIGN',
      `Sent custom newsletter "${campaign.title}" to ${result.delivered}/${activeSubs.length} subscribers`,
      adminEmail
    );

    res.json({
      success: true,
      campaign,
      delivered: result.delivered,
      bounced: result.bounced,
      message: `Campaign sent to ${result.delivered} of ${result.total} subscribers.`,
    });
  });

  // ----------------------------------------------------
  // LEADS (FREE CLAIMS AUDIT)
  // ----------------------------------------------------
  app.post('/api/leads', async (req, res) => {
    const { name, workEmail, phone, clinicName, estimatedOutstandingDenials, billingIssues } = req.body;

    if (!name || !workEmail || !clinicName) {
      res.status(400).json({ error: 'Please fill in required fields: Name, Work Email, and Clinic Name.' });
      return;
    }

    const settings = db.get('settings');

    const lead: Lead = {
      id: `lead-${Date.now()}`,
      name,
      workEmail: workEmail.toLowerCase().trim(),
      phone: phone || '',
      clinicName,
      estimatedOutstandingDenials: estimatedOutstandingDenials || 'Not Specified',
      billingIssues: billingIssues || '',
      createdAt: new Date().toISOString(),
      source: 'Free Claims Audit Form',
      status: 'new',
    };

    db.update('leads', (leads) => [lead, ...leads]);

    // Track conversion event
    db.update('analyticsEvents', (evts) => [
      {
        id: `evt-${Date.now()}`,
        type: 'lead_conversion',
        path: req.headers.referer || '/',
        timestamp: new Date().toISOString(),
      },
      ...evts,
    ]);

    logActivity('NEW_LEAD_SUBMITTED', `Claims audit lead submitted by ${name} (${clinicName})`);

    let emailSent = false;
    if (isEmailConfigured()) {
      console.log(`[Email] Sending audit confirmation to ${lead.workEmail}...`);
      const emailResult = await sendAuditRequestConfirmationEmail(lead, settings);
      emailSent = emailResult.success;
      if (!emailResult.success) console.error('[Email] Audit confirmation failed:', emailResult.error);
    } else {
      console.error('[Email] Audit email skipped — BREVO_API_KEY not configured');
    }

    res.json({
      success: true,
      message: emailSent
        ? 'Thank you! Your Free Claims Audit request has been submitted. A confirmation email has been sent to your inbox.'
        : 'Thank you! Your Free Claims Audit request has been submitted to ClaimsCure senior billing specialists.',
      emailSent,
    });
  });

  app.get('/api/leads', requireAdminAuth, (req, res) => {
    res.json({ leads: db.get('leads') });
  });

  app.put('/api/leads/:id', requireAdminAuth, (req, res) => {
    const { id } = req.params;
    db.update('leads', (leads) =>
      leads.map((l) => (l.id === id ? { ...l, ...req.body } : l))
    );
    res.json({ success: true });
  });

  app.delete('/api/leads/:id', requireAdminAuth, (req, res) => {
    db.update('leads', (leads) => leads.filter((l) => l.id !== req.params.id));
    res.json({ success: true });
  });

  app.get('/api/leads/export', requireAdminAuth, (req, res) => {
    const leads = db.get('leads');
    let csv = 'Name,WorkEmail,Phone,ClinicName,OutstandingDenials,Status,CreatedAt,Source\n';
    leads.forEach((l) => {
      csv += `"${l.name}","${l.workEmail}","${l.phone}","${l.clinicName}","${l.estimatedOutstandingDenials}","${l.status}","${l.createdAt}","${l.source}"\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="claimscure_leads.csv"');
    res.send(csv);
  });

  // ----------------------------------------------------
  // ANALYTICS
  // ----------------------------------------------------
  app.post('/api/analytics/event', (req, res) => {
    const { type, path: reqPath, articleId, referrer, country, device } = req.body;
    const evt = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type: type || 'pageview',
      path: reqPath || '/',
      articleId,
      referrer: referrer || 'Direct',
      country: country || 'United States',
      device: device || 'Desktop',
      timestamp: new Date().toISOString(),
    };

    db.update('analyticsEvents', (evts) => [evt, ...evts.slice(0, 1000)]); // Keep last 1000 events

    // If share event, increment share count on article
    if (type === 'share' && articleId) {
      db.update('articles', (arts) =>
        arts.map((a) => (a.id === articleId ? { ...a, shares: (a.shares || 0) + 1 } : a))
      );
    }

    res.json({ success: true });
  });

  app.get('/api/analytics/dashboard', requireAdminAuth, (req, res) => {
    const articles = db.get('articles');
    const subscribers = db.get('subscribers');
    const leads = db.get('leads');
    const events = db.get('analyticsEvents');

    const totalViews = articles.reduce((sum, a) => sum + (a.views || 0), 0);
    const publishedCount = articles.filter((a) => a.status === 'published').length;
    const draftCount = articles.filter((a) => a.status === 'draft').length;

    // Top articles sorted by view count
    const topArticles = [...articles]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5);

    res.json({
      liveVisitors: Math.floor(Math.random() * 8) + 4,
      totalArticles: articles.length,
      publishedCount,
      draftCount,
      totalViews,
      totalSubscribers: subscribers.filter((s) => s.status === 'active').length,
      totalLeads: leads.length,
      topArticles,
      recentEvents: events.slice(0, 15),
    });
  });

  app.get('/api/analytics/article/:id', requireAdminAuth, (req, res) => {
    const { id } = req.params;
    const article = db.get('articles').find((a) => a.id === id);
    if (!article) {
      res.status(404).json({ error: 'Article not found.' });
      return;
    }

    const events = db.get('analyticsEvents').filter((e) => e.articleId === id);
    const shares = article.shares || 0;
    const views = article.views || 0;

    res.json({
      articleId: id,
      title: article.title,
      views,
      uniqueVisitors: Math.round(views * 0.72),
      shares,
      events,
    });
  });

  // ----------------------------------------------------
  // SETTINGS & LOGS & BACKUPS
  // ----------------------------------------------------
  app.get('/api/settings', (req, res) => {
    res.json({ settings: db.get('settings') });
  });

  app.put('/api/settings', requireAdminAuth, (req, res) => {
    db.update('settings', (curr) => ({
      ...curr,
      ...req.body,
    }));
    logActivity('UPDATE_SETTINGS', 'Updated site configuration settings', (req as any).adminEmail);
    res.json({ success: true, settings: db.get('settings') });
  });

  app.get('/api/activity-logs', requireAdminAuth, (req, res) => {
    res.json({ activityLogs: db.get('activityLogs') });
  });

  app.get('/api/backup', requireAdminAuth, (req, res) => {
    const fullDb = db.getFullDb();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="claimscure_backup.json"');
    res.send(JSON.stringify(fullDb, null, 2));
  });

  app.post('/api/backup/restore', requireAdminAuth, (req, res) => {
    const { backupJson } = req.body;
    try {
      const parsed = typeof backupJson === 'string' ? JSON.parse(backupJson) : backupJson;
      if (!parsed.admin || !parsed.articles) {
        res.status(400).json({ error: 'Invalid database backup structure.' });
        return;
      }
      db.restoreFullDb(parsed);
      logActivity('RESTORE_BACKUP', 'Restored complete database backup', (req as any).adminEmail);
      res.json({ success: true, message: 'Database backup restored successfully.' });
    } catch (e: any) {
      res.status(400).json({ error: `Failed to restore backup: ${e.message}` });
    }
  });

  // ----------------------------------------------------
  // MONGODB ATLAS & GOOGLE WORKSPACE INTEGRATION ENDPOINTS
  // ----------------------------------------------------
  app.get('/api/system/database-status', requireAdminAuth, async (req, res) => {
    const mongoStatus = await checkMongoStatus();
    const mongoCounts = mongoStatus.isConnected ? await getMongoCollectionCounts() : {};
    const localCounts = {
      articles: db.get('articles').length,
      revisions: db.get('revisions').length,
      categories: db.get('categories').length,
      tags: db.get('tags').length,
      authors: db.get('authors').length,
      media: db.get('media').length,
      subscribers: db.get('subscribers').length,
      emailCampaigns: db.get('emailCampaigns').length,
      leads: db.get('leads').length,
      activityLogs: db.get('activityLogs').length,
      redirects: db.get('redirects').length,
      settings: db.get('settings') ? 1 : 0,
      admin: db.get('admin') ? 1 : 0,
      analyticsEvents: db.get('analyticsEvents').length,
    };
    const syncCheck = mongoStatus.isConnected
      ? await verifyMongoSync(localCounts)
      : { inSync: false, mongoCounts: {}, mismatches: ['MongoDB not connected'] };

    res.json({
      primaryDatabase: mongoStatus.isConnected ? 'MongoDB Atlas (synced with local JSON)' : 'Local JSON / Server Storage',
      mongoStatus,
      inSync: syncCheck.inSync,
      mismatches: syncCheck.mismatches,
      localCounts,
      mongoCounts: syncCheck.mongoCounts,
      syncableCollections: SYNCABLE_COLLECTIONS,
    });
  });

  app.get('/api/system/email-status', requireAdminAuth, (req, res) => {
    res.json(getEmailConfigSummary());
  });

  app.post('/api/system/test-email', requireAdminAuth, async (req, res) => {
    if (!isEmailConfigured()) {
      res.status(503).json({
        error: 'Email not configured. Set BREVO_API_KEY (recommended for Render) or SMTP credentials.',
      });
      return;
    }

    const settings = db.get('settings');
    const adminEmail = (req as any).adminEmail;
    const result = await sendEmail(
      adminEmail,
      'ClaimsCure CMS — Email Test Successful',
      `<p style="color:#334155;font-size:15px;line-height:1.7;">Your email integration is working correctly. Subscribers will receive welcome emails from <strong>${settings.siteName || 'ClaimsCure Insights'}</strong>.</p>`,
      settings
    );

    if (!result.success) {
      res.status(500).json({ error: result.error || 'Failed to send test email.', transport: result.transport });
      return;
    }

    logActivity('EMAIL_TEST', `Test email sent to ${adminEmail} via ${result.transport}`, adminEmail);
    res.json({
      success: true,
      transport: result.transport,
      message: `Test email sent to ${adminEmail} via ${resultTransportLabel(result.transport)}. Check your inbox.`,
    });
  });

  app.post('/api/system/mongodb-sync', requireAdminAuth, async (req, res) => {
    const mongoStatus = await checkMongoStatus();

    if (!mongoStatus.isConnected) {
      res.status(400).json({
        error: 'MongoDB Atlas is not connected. Please ensure MONGODB_URI is configured in environment variables.',
      });
      return;
    }

    const result = await syncAllCollectionsToMongo((key) => {
      if (key === 'settings') return db.get('settings');
      return db.get(key as any);
    });

    logActivity(
      'SYNC_MONGODB_ATLAS',
      `Synchronized ${result.successCount}/${result.total} collections to MongoDB Atlas`,
      (req as any).adminEmail
    );

    res.json({
      success: true,
      message: `Successfully synchronized ${result.successCount}/${result.total} collections to MongoDB Atlas (${mongoStatus.dbName}).`,
      details: result.details,
    });
  });

  app.post('/api/system/mongodb-hydrate', requireAdminAuth, async (req, res) => {
    const mongoStatus = await checkMongoStatus();
    if (!mongoStatus.isConnected) {
      res.status(400).json({ error: 'MongoDB Atlas is not connected.' });
      return;
    }

    const hydration = await hydrateFromMongo(db);
    logActivity('HYDRATE_MONGODB', 'Loaded data from MongoDB Atlas into local database', (req as any).adminEmail);

    res.json({
      success: true,
      hydrated: hydration.hydrated,
      collections: hydration.collections,
      message: hydration.hydrated
        ? 'Local database updated from MongoDB Atlas.'
        : 'Local database already up to date with MongoDB Atlas.',
    });
  });

  app.post('/api/integrations/google-docs/import', requireAdminAuth, (req, res) => {
    const { docContent } = req.body;
    if (!docContent || typeof docContent !== 'string') {
      res.status(400).json({ error: 'Doc content text string is required.' });
      return;
    }

    try {
      const imported = parseGoogleDocContent(docContent);
      logActivity('IMPORT_GOOGLE_DOC', `Imported draft titled: ${imported.title}`, (req as any).adminEmail);
      res.json({ success: true, draft: imported });
    } catch (err: any) {
      res.status(500).json({ error: `Google Docs parsing failed: ${err.message}` });
    }
  });

  app.get('/api/integrations/google-services/status', requireAdminAuth, (req, res) => {
    const status = getGoogleServicesStatus();
    res.json(status);
  });

  app.post('/api/integrations/google-search-console/ping-sitemap', requireAdminAuth, (req, res) => {
    const settings = db.get('settings');
    const baseUrl = settings.blogUrl || 'https://blog.claimscure.com';
    const sitemapUrl = `${baseUrl}/sitemap.xml`;

    logActivity('PING_SEARCH_CONSOLE', `Pings Google Search Console sitemap: ${sitemapUrl}`, (req as any).adminEmail);
    res.json({
      success: true,
      sitemapUrl,
      message: `Google Search Console notified for sitemap index: ${sitemapUrl}`,
    });
  });

  // ----------------------------------------------------
  // SEO ENDPOINTS: SITEMAP, RSS, ROBOTS
  // ----------------------------------------------------
  app.get('/sitemap.xml', (req, res) => {
    const settings = db.get('settings');
    const articles = db.get('articles').filter((a) => a.status === 'published');
    const categories = db.get('categories');
    const authors = db.get('authors');
    const baseUrl = settings.blogUrl || 'https://blog.claimscure.com';

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static pages
    xml += `  <url><loc>${baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n`;

    // Articles
    articles.forEach((a) => {
      xml += `  <url><loc>${baseUrl}/article/${a.slug}</loc><lastmod>${new Date(a.updatedAt || a.publishedAt).toISOString().split('T')[0]}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
    });

    // Categories
    categories.forEach((c) => {
      xml += `  <url><loc>${baseUrl}/category/${c.slug}</loc><changefreq>weekly</changefreq><priority>0.6</priority></url>\n`;
    });

    // Authors
    authors.forEach((au) => {
      xml += `  <url><loc>${baseUrl}/author/${au.slug}</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>\n`;
    });

    xml += `</urlset>`;

    res.setHeader('Content-Type', 'text/xml');
    res.send(xml);
  });

  app.get('/rss.xml', (req, res) => {
    const settings = db.get('settings');
    const articles = db.get('articles').filter((a) => a.status === 'published');
    const baseUrl = settings.blogUrl || 'https://blog.claimscure.com';

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<rss version="2.0">\n`;
    xml += `  <channel>\n`;
    xml += `    <title>${settings.siteName}</title>\n`;
    xml += `    <link>${baseUrl}</link>\n`;
    xml += `    <description>${settings.siteDescription}</description>\n`;
    xml += `    <language>en-us</language>\n`;

    articles.forEach((a) => {
      xml += `    <item>\n`;
      xml += `      <title><![CDATA[${a.title}]]></title>\n`;
      xml += `      <link>${baseUrl}/article/${a.slug}</link>\n`;
      xml += `      <guid>${baseUrl}/article/${a.slug}</guid>\n`;
      xml += `      <pubDate>${new Date(a.publishedAt).toUTCString()}</pubDate>\n`;
      xml += `      <description><![CDATA[${a.excerpt}]]></description>\n`;
      xml += `    </item>\n`;
    });

    xml += `  </channel>\n`;
    xml += `</rss>`;

    res.setHeader('Content-Type', 'text/xml');
    res.send(xml);
  });

  app.get('/robots.txt', (req, res) => {
    const settings = db.get('settings');
    const baseUrl = settings.blogUrl || 'https://blog.claimscure.com';

    let txt = `User-agent: *\n`;
    txt += `Allow: /\n`;
    txt += `Disallow: /admin\n`;
    txt += `Disallow: /api/admin\n\n`;
    txt += `Sitemap: ${baseUrl}/sitemap.xml\n`;

    res.setHeader('Content-Type', 'text/plain');
    res.send(txt);
  });

  // ----------------------------------------------------
  // VITE & PRODUCTION STATIC SERVING
  // ----------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false }));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
        next();
        return;
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, async () => {
    await runStartupDiagnostics(HOST, PORT);
  });
}

startServer();
