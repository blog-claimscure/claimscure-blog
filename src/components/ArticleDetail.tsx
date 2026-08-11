import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Share2,
  Linkedin,
  Facebook,
  Twitter,
  Mail,
  Link2,
  Check,
  ChevronRight,
  Shield,
  FileText,
  User,
  ArrowLeft,
} from 'lucide-react';
import { Article, Category, Author, Tag } from '../types';
import { ArticleCard } from './ArticleCard';
import { api } from '../lib/api';

interface ArticleDetailProps {
  article: Article & { category?: Category; author?: Author; tags?: Tag[] };
  relatedArticles: (Article & { category?: Category; author?: Author })[];
  onSelectArticle: (slug: string) => void;
  onOpenAudit: () => void;
  onNavigateBack: () => void;
}

export const ArticleDetail: React.FC<ArticleDetailProps> = ({
  article,
  relatedArticles,
  onSelectArticle,
  onOpenAudit,
  onNavigateBack,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const formattedPublished = new Date(article.publishedAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedUpdated = article.updatedAt
    ? new Date(article.updatedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const currentUrl = window.location.href;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedLink(true);
    // Track share event
    api.trackEvent('share', window.location.pathname, article.id);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const shareLinks = {
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(article.title)}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${article.title} - ${currentUrl}`)}`,
    email: `mailto:?subject=${encodeURIComponent(article.title)}&body=${encodeURIComponent(`Check out this publication from ClaimsCure: ${currentUrl}`)}`,
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Top Breadcrumb & Back Navigation Header */}
      <div className="bg-white border-b border-slate-200 py-3.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={onNavigateBack}
            className="flex items-center space-x-1.5 text-sm font-semibold text-slate-600 hover:text-teal-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Publications</span>
          </button>

          <nav className="hidden sm:flex items-center space-x-2 text-xs text-slate-500">
            <span className="hover:text-slate-800 cursor-pointer" onClick={() => onNavigateBack()}>
              ClaimsCure Blog
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
            {article.category && (
              <span className="hover:text-slate-800 cursor-pointer">
                {article.category.name}
              </span>
            )}
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-800 font-medium truncate max-w-[200px]">
              {article.title}
            </span>
          </nav>

          <button
            onClick={() => setShowShareModal(true)}
            className="px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 text-xs font-bold transition-colors flex items-center space-x-1"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Article</span>
          </button>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Category & Badge Header */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center space-x-2.5">
            {article.category && (
              <span className="bg-slate-900 text-teal-300 border border-slate-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {article.category.name}
              </span>
            )}
            {article.isFeatured && (
              <span className="bg-amber-500 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Featured Report
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-tight tracking-tight">
            {article.title}
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 leading-relaxed font-normal">
            {article.excerpt}
          </p>

          {/* Author & Timestamp Bar */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              {article.author?.photo ? (
                <img
                  src={article.author.photo}
                  alt={article.author.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-teal-500 shadow-sm"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold">
                  <User className="w-6 h-6" />
                </div>
              )}

              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  {article.author?.name || 'ClaimsCure RCM Team'}
                </h4>
                <p className="text-xs text-slate-500">
                  {article.author?.title} ({article.author?.credentials || 'RCM Consultant'})
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-xs text-slate-500">
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1 text-slate-400" />
                Published {formattedPublished}
              </span>
              {formattedUpdated && formattedUpdated !== formattedPublished && (
                <span>• Updated {formattedUpdated}</span>
              )}
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1 text-slate-400" />
                {article.readingTime} min read
              </span>
            </div>
          </div>
        </div>

        {/* Featured Image */}
        {article.featuredImage && (
          <div className="mb-10 rounded-2xl overflow-hidden shadow-lg border border-slate-200/80 bg-slate-900">
            <img
              src={article.featuredImage}
              alt={article.imageAlt || article.title}
              className="w-full max-h-[500px] object-cover"
            />
            {article.imageAlt && (
              <p className="p-3 text-center text-xs text-slate-400 bg-slate-950 font-medium">
                {article.imageAlt}
              </p>
            )}
          </div>
        )}

        {/* Sticky Social Share Sidebar / Floating bar */}
        <div className="flex flex-wrap items-center justify-between bg-white border border-slate-200 rounded-xl p-3.5 mb-8 shadow-sm">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center">
            <Share2 className="w-4 h-4 mr-1.5 text-teal-600" />
            Share Publication:
          </span>

          <div className="flex items-center space-x-2">
            <a
              href={shareLinks.linkedin}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 transition-colors"
              title="Share on LinkedIn"
            >
              <Linkedin className="w-4 h-4" />
            </a>
            <a
              href={shareLinks.facebook}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-colors"
              title="Share on Facebook"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a
              href={shareLinks.twitter}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-500 transition-colors"
              title="Share on X"
            >
              <Twitter className="w-4 h-4" />
            </a>
            <a
              href={shareLinks.whatsapp}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-600 transition-colors"
              title="Share on WhatsApp"
            >
              <Mail className="w-4 h-4" />
            </a>
            <button
              onClick={handleCopyLink}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 transition-colors ${
                copiedLink ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white hover:bg-teal-600'
              }`}
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* Article Body Content */}
        <div className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-200/90 shadow-sm leading-relaxed text-[#1A1A2E] text-base sm:text-lg space-y-6 article-content prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-[#1A1A2E] prose-a:text-[#0B5FA5]">
          {article.content && article.content.trim().length > 0 ? (
            /<[a-z][\s\S]*>/i.test(article.content) ? (
              <div dangerouslySetInnerHTML={{ __html: article.content }} />
            ) : (
              <div className="space-y-4">
                {article.content.split(/\n\n+/).map((para, i) => (
                  <p key={i} className="text-slate-800 leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
            )
          ) : (
            <div className="space-y-4 text-slate-800">
              <p className="text-lg leading-relaxed text-slate-800">
                {article.excerpt}
              </p>
            </div>
          )}
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-200 flex items-center space-x-2 flex-wrap gap-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">
              Tags:
            </span>
            {article.tags.map((t) => (
              <span
                key={t.id}
                className="bg-slate-200/80 text-slate-700 text-xs font-semibold px-3 py-1 rounded-full"
              >
                #{t.name}
              </span>
            ))}
          </div>
        )}

        {/* Author Bio Box */}
        {article.author && (
          <div className="mt-12 bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center gap-6 shadow-xl">
            <img
              src={article.author.photo}
              alt={article.author.name}
              className="w-20 h-20 rounded-full object-cover border-2 border-teal-500 shrink-0"
            />
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-white">{article.author.name}</h3>
                <span className="bg-teal-900 text-teal-300 text-[10px] font-bold px-2 py-0.5 rounded border border-teal-700">
                  {article.author.credentials}
                </span>
              </div>
              <p className="text-xs font-semibold text-teal-400">{article.author.title}</p>
              <p className="text-sm text-slate-300 leading-relaxed">{article.author.bio}</p>
            </div>
          </div>
        )}

        {/* Free Claims Audit Banner CTA */}
        <div className="mt-12 bg-gradient-to-r from-teal-900 via-slate-900 to-slate-950 rounded-2xl p-8 border border-teal-700/50 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-8 space-y-3">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-teal-400" />
                <span className="text-xs font-bold text-teal-300 uppercase tracking-wider">
                  ClaimsCure Audit Services
                </span>
              </div>
              <h3 className="text-2xl font-black text-white leading-snug">
                Is Your Practice Losing Revenue to Unresolved Claim Denials?
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Our certified medical billing auditors will review your practice’s denial logs for free and deliver a detailed 24-hour financial recovery plan.
              </p>
            </div>
            <div className="md:col-span-4 flex justify-start md:justify-end">
              <button
                onClick={onOpenAudit}
                className="w-full sm:w-auto px-6 py-3.5 bg-teal-400 hover:bg-teal-300 text-slate-950 font-black text-sm rounded-xl shadow-lg transition-colors flex items-center justify-center space-x-2"
              >
                <FileText className="w-4 h-4" />
                <span>Request Free Audit</span>
              </button>
            </div>
          </div>
        </div>

        {/* Related Articles Section */}
        {relatedArticles && relatedArticles.length > 0 && (
          <div className="mt-16 space-y-6">
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Related Revenue & Compliance Insights
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedArticles.slice(0, 3).map((art) => (
                <ArticleCard key={art.id} article={art} onSelect={onSelectArticle} />
              ))}
            </div>
          </div>
        )}
      </article>

      {/* Share Modal Dialog */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center">
                <Share2 className="w-5 h-5 text-teal-600 mr-2" />
                Share Article
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <p className="text-sm text-slate-600">
              Share "{article.title}" with your medical billing team or executive network:
            </p>

            <div className="grid grid-cols-2 gap-3">
              <a
                href={shareLinks.linkedin}
                target="_blank"
                rel="noreferrer"
                className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold text-xs flex items-center justify-center space-x-2"
              >
                <Linkedin className="w-4 h-4" />
                <span>LinkedIn</span>
              </a>
              <a
                href={shareLinks.facebook}
                target="_blank"
                rel="noreferrer"
                className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl font-bold text-xs flex items-center justify-center space-x-2"
              >
                <Facebook className="w-4 h-4" />
                <span>Facebook</span>
              </a>
              <a
                href={shareLinks.twitter}
                target="_blank"
                rel="noreferrer"
                className="p-3 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl font-bold text-xs flex items-center justify-center space-x-2"
              >
                <Twitter className="w-4 h-4" />
                <span>X / Twitter</span>
              </a>
              <a
                href={shareLinks.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold text-xs flex items-center justify-center space-x-2"
              >
                <Mail className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <button
                onClick={handleCopyLink}
                className="w-full py-3 bg-slate-900 hover:bg-teal-600 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center space-x-2"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Link2 className="w-4 h-4" />}
                <span>{copiedLink ? 'Link Copied to Clipboard!' : 'Copy Article Link'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
