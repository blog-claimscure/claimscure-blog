export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  categoryId: string;
  tagIds: string[];
  authorId: string;
  featuredImage: string;
  imageAlt: string;
  publishedAt: string;
  updatedAt: string;
  readingTime: number; // in minutes
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  scheduledAt?: string;
  isFeatured: boolean;
  featuredOrder?: number;
  seoTitle?: string;
  seoDescription?: string;
  focusKeyword?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  views: number;
  shares: number;
}

export interface ArticleRevision {
  id: string;
  articleId: string;
  title: string;
  content: string;
  excerpt: string;
  savedAt: string;
  savedBy: string;
  versionNote: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image?: string;
  order: number;
  seoTitle?: string;
  seoDescription?: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Author {
  id: string;
  name: string;
  slug: string;
  title: string;
  bio: string;
  photo: string;
  credentials: string;
  linkedin?: string;
  website?: string;
}

export interface MediaItem {
  id: string;
  filename: string;
  url: string;
  alt: string;
  caption?: string;
  mimeType: string;
  fileSize: number;
  dimensions?: string;
  createdAt: string;
  publicId?: string;
  cloudinaryUrl?: string;
  format?: string;
  width?: number;
  height?: number;
  isCloudinary?: boolean;
}

export interface Subscriber {
  id: string;
  email: string;
  subscribedAt: string;
  source: string;
  status: 'active' | 'unsubscribed';
  unsubscribedAt?: string;
}

export interface EmailCampaign {
  id: string;
  title: string;
  subject: string;
  articleId?: string;
  sentAt: string;
  recipientsCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  bouncedCount: number;
  unsubscribedCount: number;
  status: 'draft' | 'sent' | 'scheduled' | 'failed';
}

export interface Lead {
  id: string;
  name: string;
  workEmail: string;
  phone: string;
  clinicName: string;
  estimatedOutstandingDenials: string;
  billingIssues: string;
  createdAt: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'meeting_scheduled' | 'converted' | 'lost';
  notes?: string;
}

export interface NavItem {
  label: string;
  url: string;
  category?: string;
  isExternal?: boolean;
}

export interface AnalyticsDashboard {
  totalViews: number;
  totalArticles: number;
  totalSubscribers: number;
  topArticles: Article[];
}

export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  logoUrl: string;
  contactEmail: string;
  contactPhone: string;
  companyAddress: string;
  mainWebsiteUrl: string;
  blogUrl: string;
  socialLinkedIn: string;
  socialFacebook: string;
  socialTwitter: string;
  socialInstagram: string;
  socialYoutube: string;
  defaultSeoTitle: string;
  defaultSeoDescription: string;
  defaultSeoImage: string;
  senderName: string;
  senderEmail: string;
  headerNav: NavItem[];
  footerNav: NavItem[];
}

export interface ActivityLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  adminEmail: string;
  ip?: string;
}

export interface UrlRedirect {
  id: string;
  fromSlug: string;
  toSlug: string;
  createdAt: string;
}

export interface AnalyticsEvent {
  id: string;
  type: 'pageview' | 'share' | 'subscriber_conversion' | 'lead_conversion';
  path: string;
  articleId?: string;
  referrer?: string;
  country?: string;
  device?: string;
  timestamp: string;
}

export interface AdminUser {
  email: string;
  lastLogin?: string;
}
