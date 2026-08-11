import React, { useState, useEffect } from 'react';
import { Search, X, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { Article, Category, Author } from '../types';
import { api } from '../lib/api';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectArticle: (slug: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectArticle,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<(Article & { category?: Category; author?: Author })[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.getArticles({ search: query, status: 'published' });
        setResults(res.articles || []);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-start justify-center pt-16 sm:pt-24 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative space-y-4">
        {/* Modal Header with Title and Prominent Close X */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-[#0B5FA5]" />
            <span className="text-sm font-extrabold text-[#1A1A2E] uppercase tracking-wider">
              Search ClaimsCure Publications
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-[#1A1A2E] hover:bg-slate-100 rounded-full transition-all cursor-pointer border border-transparent hover:border-slate-200 flex items-center justify-center"
            title="Close Search"
            aria-label="Close search modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="relative flex items-center">
          <Search className="w-5 h-5 text-[#0B5FA5] absolute left-4 pointer-events-none" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search medical billing, CMS updates, CPT coding, denials..."
            className="w-full bg-[#F8FAFC] border border-slate-300 rounded-2xl pl-12 pr-10 py-3.5 text-[#1A1A2E] placeholder-slate-400 font-medium focus:outline-none focus:border-[#0B5FA5] text-sm sm:text-base"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
              title="Clear input"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto space-y-3 pt-2">
          {loading && (
            <div className="py-8 text-center text-slate-500 flex items-center justify-center space-x-2 text-sm">
              <Loader2 className="w-5 h-5 animate-spin text-[#0B5FA5]" />
              <span>Searching ClaimsCure Database...</span>
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="py-12 text-center space-y-2">
              <p className="text-base font-bold text-slate-800">No Publications Found</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No matching articles for "{query}". Try searching for terms like "CMS", "Denials", "Coding", or "AR".
              </p>
            </div>
          )}

          {!loading &&
            results.map((art) => (
              <div
                key={art.id}
                onClick={() => {
                  onSelectArticle(art.slug);
                  onClose();
                }}
                className="group bg-slate-50 hover:bg-teal-50/60 p-4 rounded-2xl border border-slate-200/80 hover:border-teal-500/40 transition-all cursor-pointer flex items-center justify-between gap-4"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                    <span className="font-bold text-teal-700 bg-teal-100/80 px-2 py-0.5 rounded">
                      {art.category?.name || 'Publication'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(art.publishedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors text-sm sm:text-base leading-snug">
                    {art.title}
                  </h4>

                  <p className="text-xs text-slate-600 line-clamp-1">{art.excerpt}</p>
                </div>

                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all shrink-0" />
              </div>
            ))}

          {!query && (
            <div className="py-6 text-center text-xs text-slate-400 space-y-2">
              <p className="font-semibold text-slate-600">Suggested Topics:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {['2026 CMS Guidelines', 'Prior Authorization', 'Aged AR Recovery', 'Modifier -25', 'Credentialing'].map(
                  (term) => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className="px-3 py-1 bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-700 rounded-full border border-slate-200 text-xs font-medium"
                    >
                      {term}
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
