import React, { useState, useEffect } from 'react';
import {
  Save,
  Eye,
  Edit3,
  History,
  Sparkles,
  ArrowLeft,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Globe,
  Smartphone,
  Tablet,
  Monitor,
  Search,
  RotateCcw,
  Upload,
  FileText,
  X,
  Mail,
} from 'lucide-react';
import { Article, Category, Author, Tag, ArticleRevision } from '../../types';
import { api } from '../../lib/api';
import { RichTextEditor } from './RichTextEditor';
import { MediaSelectorModal } from './MediaSelectorModal';

interface ArticleEditorProps {
  article: Partial<Article> | null;
  categories: Category[];
  authors: Author[];
  tags: Tag[];
  onSaveSuccess: () => void;
  onCancel: () => void;
}

export const ArticleEditor: React.FC<ArticleEditorProps> = ({
  article,
  categories,
  authors,
  tags,
  onSaveSuccess,
  onCancel,
}) => {
  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeAuthors = Array.isArray(authors) ? authors : [];
  const safeTags = Array.isArray(tags) ? tags : [];

  const [formData, setFormData] = useState<Partial<Article>>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    categoryId: safeCategories[0]?.id || 'cat-1',
    authorId: safeAuthors[0]?.id || 'auth-1',
    tagIds: [],
    featuredImage: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1200&auto=format&fit=crop&q=80',
    imageAlt: '',
    status: 'draft',
    isFeatured: false,
    seoTitle: '',
    seoDescription: '',
    focusKeyword: '',
  });

  const [activeTab, setActiveTab] = useState<'write' | 'preview' | 'seo' | 'revisions'>('write');
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [revisions, setRevisions] = useState<ArticleRevision[]>([]);
  const [mediaModalTarget, setMediaModalTarget] = useState<'featured' | 'og' | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [docImportModalOpen, setDocImportModalOpen] = useState(false);
  const [docRawText, setDocRawText] = useState('');
  const [importingDoc, setImportingDoc] = useState(false);
  const [loadingRevisions, setLoadingRevisions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingNewsletter, setSendingNewsletter] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleImportDoc = async () => {
    if (!docRawText.trim()) return;
    setImportingDoc(true);
    try {
      const res = await api.importGoogleDoc(docRawText);
      if (res.draft) {
        setFormData((prev) => ({
          ...prev,
          title: res.draft.title || prev.title,
          excerpt: res.draft.excerpt || prev.excerpt,
          content: res.draft.content || prev.content,
        }));
        setSuccessMsg('Google Doc draft imported and formatted into article editor successfully.');
        setDocImportModalOpen(false);
        setDocRawText('');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to import Google Doc draft.');
    } finally {
      setImportingDoc(false);
    }
  };

  useEffect(() => {
    if (article) {
      setFormData({
        ...article,
        tagIds: article.tagIds || [],
      });

      if (article.id) {
        fetchRevisions(article.id);
      }
    }
  }, [article]);

  const fetchRevisions = async (id: string) => {
    setLoadingRevisions(true);
    try {
      const res = await api.getArticleRevisions(id);
      setRevisions(res.revisions || []);
    } catch (e) {
      // Ignore
    } finally {
      setLoadingRevisions(false);
    }
  };

  // Auto-generate slug when title changes
  const handleTitleChange = (val: string) => {
    const autoSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setFormData((prev) => ({
      ...prev,
      title: val,
      slug: prev.slug && prev.slug !== '' ? prev.slug : autoSlug,
      seoTitle: prev.seoTitle || `${val} | ClaimsCure Blog`,
    }));
  };

  const handleSave = async (statusOverride?: 'draft' | 'published') => {
    if (!formData.title || formData.title.trim() === '') {
      setErrorMsg('Please enter an article title.');
      return;
    }

    const targetStatus = statusOverride || formData.status || 'draft';

    if (targetStatus === 'published' && (!formData.content || formData.content.trim().length === 0)) {
      setErrorMsg('Cannot publish article: Article body content is required before publishing.');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    const payload = {
      ...formData,
      status: targetStatus,
    };

    try {
      if (formData.id) {
        await api.updateArticle(formData.id, payload);
        setSuccessMsg('Article updated successfully.');
      } else {
        const res = await api.createArticle(payload);
        setFormData(res.article);
        setSuccessMsg('Article created successfully.');
      }
      setTimeout(() => {
        onSaveSuccess();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save article.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendNewsletter = async () => {
    if (!formData.id || formData.status !== 'published') {
      setErrorMsg('Save and publish the article before sending a newsletter.');
      return;
    }

    if (!confirm('Send this article as a newsletter to all active subscribers?')) return;

    setSendingNewsletter(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.sendArticleNewsletter(formData.id, 'update');
      setSuccessMsg(res.message || `Newsletter sent to ${res.delivered} subscribers.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send newsletter.');
    } finally {
      setSendingNewsletter(false);
    }
  };

  const insertContentBlock = (htmlSnippet: string) => {
    setFormData((prev) => ({
      ...prev,
      content: (prev.content || '') + '\n' + htmlSnippet,
    }));
  };

  const handleRestoreRevision = async (revId: string) => {
    if (!formData.id) return;
    try {
      await api.restoreArticleRevision(formData.id, revId);
      const rev = revisions.find((r) => r.id === revId);
      if (rev) {
        setFormData((prev) => ({
          ...prev,
          title: rev.title,
          content: rev.content,
          excerpt: rev.excerpt,
        }));
      }
      setSuccessMsg('Revision restored successfully.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to restore revision.');
    }
  };

  // Calculate SEO Score
  const getSeoScore = () => {
    let score = 0;
    if (formData.title && formData.title.length > 20) score += 25;
    if (formData.seoDescription && formData.seoDescription.length > 50) score += 25;
    if (formData.focusKeyword && (formData.title || '').toLowerCase().includes(formData.focusKeyword.toLowerCase())) score += 25;
    if (formData.featuredImage) score += 25;
    return score;
  };

  const seoScore = getSeoScore();

  return (
    <div className="space-y-6">
      {/* Top Header Controls Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-16 z-30">
        <div className="flex items-center space-x-3">
          <button
            onClick={onCancel}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-black text-slate-900 leading-none">
              {formData.id ? 'Edit Article' : 'Compose New Article'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Status: <span className="font-bold text-teal-700 uppercase">{formData.status}</span>
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('write')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
              activeTab === 'write' ? 'bg-white text-slate-900 shadow' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Write</span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
              activeTab === 'preview' ? 'bg-white text-slate-900 shadow' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Live Preview</span>
          </button>

          <button
            onClick={() => setActiveTab('seo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
              activeTab === 'seo' ? 'bg-white text-slate-900 shadow' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>SEO Engine ({seoScore}%)</span>
          </button>

          {formData.id && (
            <button
              onClick={() => setActiveTab('revisions')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                activeTab === 'revisions' ? 'bg-white text-slate-900 shadow' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Revisions</span>
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setDocImportModalOpen(true)}
            className="px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-xs font-bold rounded-xl transition-colors flex items-center space-x-1 cursor-pointer"
            title="Import draft text or exported HTML from Google Docs"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Import Google Doc</span>
          </button>

          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors"
          >
            Save Draft
          </button>

          <button
            onClick={() => handleSave('published')}
            disabled={saving}
            className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black rounded-xl shadow transition-colors flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>Publish Article</span>
          </button>

          {formData.id && formData.status === 'published' && (
            <button
              type="button"
              onClick={handleSendNewsletter}
              disabled={sendingNewsletter}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow transition-colors flex items-center space-x-1.5 disabled:opacity-50"
              title="Email this article to all active subscribers"
            >
              <Mail className="w-4 h-4" />
              <span>{sendingNewsletter ? 'Sending...' : 'Send Newsletter'}</span>
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-2xl flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-2xl flex items-center space-x-2">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* WRITE TAB */}
      {activeTab === 'write' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content Fields */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Article Title *
              </label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="2026 CMS Outpatient Billing: Complete Compliance Guide"
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-lg font-black text-slate-900 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  URL Slug
                </label>
                <input
                  type="text"
                  value={formData.slug || ''}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="2026-cms-outpatient-billing-guide"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={formData.categoryId || ''}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-500"
                >
                  {safeCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Short Excerpt
              </label>
              <textarea
                rows={2}
                value={formData.excerpt || ''}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="Concise overview of the publication for homepage cards and meta snippets..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Quick Content Insert Toolbar */}
            <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Rich Content Snippet Generators
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => insertContentBlock('<h2>Section Heading</h2>')}
                  className="px-2.5 py-1 bg-white border border-slate-300 text-xs font-bold rounded hover:bg-teal-50"
                >
                  + Heading 2
                </button>

                <button
                  type="button"
                  onClick={() => insertContentBlock('<h3>Subheading</h3>')}
                  className="px-2.5 py-1 bg-white border border-slate-300 text-xs font-bold rounded hover:bg-teal-50"
                >
                  + Heading 3
                </button>

                <button
                  type="button"
                  onClick={() => insertContentBlock('<div class="callout callout-info"><strong>Policy Note:</strong> Add crucial compliance notice here.</div>')}
                  className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold rounded hover:bg-blue-100"
                >
                  + Info Callout Box
                </button>

                <button
                  type="button"
                  onClick={() => insertContentBlock('<blockquote>"Compliant medical billing relies on proactive documentation established before submission."</blockquote>')}
                  className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded hover:bg-amber-100"
                >
                  + Blockquote
                </button>

                <button
                  type="button"
                  onClick={() => insertContentBlock('<ul>\n  <li>Action item 1</li>\n  <li>Action item 2</li>\n</ul>')}
                  className="px-2.5 py-1 bg-white border border-slate-300 text-xs font-bold rounded hover:bg-teal-50"
                >
                  + Bullet List
                </button>

                <button
                  type="button"
                  onClick={() => insertContentBlock('<table>\n  <thead>\n    <tr><th>Metric</th><th>Value</th></tr>\n  </thead>\n  <tbody>\n    <tr><td>Clean Claim Rate</td><td>97.8%</td></tr>\n  </tbody>\n</table>')}
                  className="px-2.5 py-1 bg-white border border-slate-300 text-xs font-bold rounded hover:bg-teal-50"
                >
                  + Comparison Table
                </button>
              </div>
            </div>

            <RichTextEditor
              label="Article Body Content (Word Processor / WYSIWYG) *"
              value={formData.content || ''}
              onChange={(val) => setFormData((prev) => ({ ...prev, content: val }))}
            />
          </div>

          {/* Publishing Settings Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
                Publishing Attributes
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Author
                </label>
                <select
                  value={formData.authorId || ''}
                  onChange={(e) => setFormData({ ...formData, authorId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                >
                  {safeAuthors.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.credentials})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Publication Status
                </label>
                <select
                  value={formData.status || 'draft'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 uppercase"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <p className="text-xs font-bold text-slate-800">Featured Homepage Insight</p>
                  <p className="text-[10px] text-slate-500">Promote to top homepage hero grid</p>
                </div>
                <input
                  type="checkbox"
                  checked={!!formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Featured Cover Image
                  </label>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setMediaModalTarget('featured')}
                      className="text-[11px] font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2 py-0.5 rounded-lg border border-teal-200 transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      <ImageIcon className="w-3 h-3" />
                      <span>Cloudinary Media Library</span>
                    </button>

                    <label className="text-[11px] font-bold text-[#0B5FA5] hover:underline cursor-pointer flex items-center">
                      <Upload className="w-3 h-3 mr-1" /> Upload PC
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setUploadingImage(true);
                            const reader = new FileReader();
                            reader.onload = async (evt) => {
                              try {
                                const base64 = evt.target?.result as string;
                                const res = await api.uploadMedia(file.name, base64, formData.title || file.name);
                                if (res.media) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    featuredImage: res.media.url,
                                    imageAlt: res.media.alt || prev.imageAlt,
                                  }));
                                }
                              } catch (err: any) {
                                alert(`Cloudinary upload failed: ${err.message}`);
                              } finally {
                                setUploadingImage(false);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                {uploadingImage && (
                  <p className="text-[11px] font-bold text-teal-600 mb-2 animate-pulse">
                    Uploading image to Cloudinary CDN...
                  </p>
                )}

                <input
                  type="text"
                  value={formData.featuredImage || ''}
                  onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                  placeholder="Cloudinary URL or https://..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800"
                />
              </div>

              {formData.featuredImage && (
                <div className="aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                  <img
                    src={formData.featuredImage}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Image Alt Text
                </label>
                <input
                  type="text"
                  value={formData.imageAlt || ''}
                  onChange={(e) => setFormData({ ...formData, imageAlt: e.target.value })}
                  placeholder="Describe image for accessibility"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIVE PREVIEW TAB */}
      {activeTab === 'preview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-2 bg-slate-100 p-2 rounded-2xl max-w-xs mx-auto">
            <button
              onClick={() => setPreviewViewport('desktop')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 ${
                previewViewport === 'desktop' ? 'bg-slate-900 text-white shadow' : 'text-slate-600'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop</span>
            </button>

            <button
              onClick={() => setPreviewViewport('tablet')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 ${
                previewViewport === 'tablet' ? 'bg-slate-900 text-white shadow' : 'text-slate-600'
              }`}
            >
              <Tablet className="w-3.5 h-3.5" />
              <span>Tablet</span>
            </button>

            <button
              onClick={() => setPreviewViewport('mobile')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 ${
                previewViewport === 'mobile' ? 'bg-slate-900 text-white shadow' : 'text-slate-600'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile</span>
            </button>
          </div>

          <div
            className={`mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-2xl transition-all duration-300 ${
              previewViewport === 'mobile'
                ? 'max-w-sm'
                : previewViewport === 'tablet'
                ? 'max-w-xl'
                : 'max-w-4xl'
            }`}
          >
            <span className="text-xs font-bold text-teal-600 uppercase tracking-wider bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
              {safeCategories.find((c) => c.id === formData.categoryId)?.name || 'Category'}
            </span>

            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 mt-4 leading-tight">
              {formData.title || 'Untitled Article'}
            </h1>

            <p className="text-slate-600 text-base mt-2">{formData.excerpt}</p>

            {formData.featuredImage && (
              <img
                src={formData.featuredImage}
                alt="Preview"
                className="w-full rounded-2xl my-6 aspect-video object-cover shadow"
              />
            )}

            <div
              className="prose prose-slate max-w-none text-slate-800 leading-relaxed text-sm sm:text-base space-y-4"
              dangerouslySetInnerHTML={{ __html: formData.content || '<p>No content entered yet...</p>' }}
            />
          </div>
        </div>
      )}

      {/* SEO ENGINE TAB */}
      {activeTab === 'seo' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-extrabold text-slate-900">SEO Meta Settings</h3>
              <span className="px-3 py-1 bg-teal-100 text-teal-800 text-xs font-black rounded-full">
                SEO Score: {seoScore}%
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Focus Keyword
              </label>
              <input
                type="text"
                value={formData.focusKeyword || ''}
                onChange={(e) => setFormData({ ...formData, focusKeyword: e.target.value })}
                placeholder="e.g. CMS outpatient billing 2026"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                SEO Title ({formData.seoTitle?.length || 0}/60 chars)
              </label>
              <input
                type="text"
                value={formData.seoTitle || ''}
                onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Meta Description ({formData.seoDescription?.length || 0}/160 chars)
              </label>
              <textarea
                rows={3}
                value={formData.seoDescription || ''}
                onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800"
              />
            </div>
          </div>

          {/* Google Search Live Preview */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
              <Search className="w-4 h-4 text-teal-600 mr-1.5" />
              Google Search Result Preview
            </h4>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <p className="text-xs text-slate-500 font-mono truncate">
                https://blog.claimscure.com › article › {formData.slug || 'article-slug'}
              </p>
              <h3 className="text-blue-800 hover:underline font-bold text-base leading-snug cursor-pointer line-clamp-2">
                {formData.seoTitle || formData.title || 'Article Title'}
              </h3>
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {formData.seoDescription || formData.excerpt || 'Article excerpt snippet will appear here in Google Search results.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* REVISIONS HISTORY TAB */}
      {activeTab === 'revisions' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-lg font-black text-slate-900">
            Article Revision History Snapshots
          </h3>

          {loadingRevisions ? (
            <p className="text-xs text-slate-500">Loading revisions...</p>
          ) : revisions.length === 0 ? (
            <p className="text-xs text-slate-500">No previous revisions recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {revisions.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-bold text-slate-900">{rev.title}</p>
                    <p className="text-xs text-slate-500">
                      Saved {new Date(rev.savedAt).toLocaleString()} by {rev.savedBy}
                    </p>
                  </div>

                  <button
                    onClick={() => handleRestoreRevision(rev.id)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-teal-600 text-white font-bold text-xs rounded-xl flex items-center space-x-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore Revision</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cloudinary Media Selector Modal */}
      <MediaSelectorModal
        isOpen={mediaModalTarget !== null}
        onClose={() => setMediaModalTarget(null)}
        selectedUrl={mediaModalTarget === 'featured' ? formData.featuredImage : formData.ogImage}
        onSelectImage={(m) => {
          if (mediaModalTarget === 'featured') {
            setFormData((prev) => ({
              ...prev,
              featuredImage: m.url,
              imageAlt: m.alt || prev.imageAlt,
            }));
          } else if (mediaModalTarget === 'og') {
            setFormData((prev) => ({
              ...prev,
              ogImage: m.url,
            }));
          }
        }}
      />

      {/* Google Docs Import Modal */}
      {docImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-50 border border-blue-200 rounded-xl text-blue-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Import Article Draft from Google Docs
                  </h3>
                  <p className="text-xs text-slate-500">
                    Paste content copied from Google Docs or Markdown text to format automatically.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDocImportModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Google Doc Content (Markdown or Raw Text)
              </label>
              <textarea
                rows={10}
                value={docRawText}
                onChange={(e) => setDocRawText(e.target.value)}
                placeholder="Paste article title, headings, paragraphs, and list items here..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <p className="text-[11px] text-slate-500">
                First line will be used as Article Title. Subsequent lines format into clean HTML structure.
              </p>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setDocImportModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImportDoc}
                  disabled={importingDoc || !docRawText.trim()}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow transition-all cursor-pointer disabled:opacity-50"
                >
                  {importingDoc ? 'Processing Draft...' : 'Import & Format Content'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
