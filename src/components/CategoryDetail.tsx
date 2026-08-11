import React from 'react';
import { ArrowLeft, FolderOpen, Layers } from 'lucide-react';
import { Article, Category, Author } from '../types';
import { ArticleCard } from './ArticleCard';

interface CategoryDetailProps {
  category: Category;
  articles: (Article & { category?: Category; author?: Author })[];
  onSelectArticle: (slug: string) => void;
  onNavigateBack: () => void;
}

export const CategoryDetail: React.FC<CategoryDetailProps> = ({
  category,
  articles,
  onSelectArticle,
  onNavigateBack,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Category Header Banner */}
      <div className="bg-[#1A1A2E] text-white rounded-3xl p-8 sm:p-12 border border-slate-800 shadow-xl relative overflow-hidden font-sans">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 bg-[#0B5FA5]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <button
            onClick={onNavigateBack}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#E3F2FD] hover:text-white transition-colors bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Categories & Home</span>
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-[#0B5FA5] text-white flex items-center justify-center font-bold shadow-md">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#1E88E5] uppercase tracking-wider">
                Publication Category
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {category.name}
              </h1>
            </div>
          </div>

          <p className="text-slate-300 text-base max-w-2xl leading-relaxed font-normal">
            {category.description || `Browse authoritative healthcare publishing on ${category.name}.`}
          </p>

          <div className="pt-2 flex items-center space-x-2 text-xs text-[#1E88E5] font-extrabold">
            <Layers className="w-4 h-4" />
            <span>{articles.length} Published Reports & Articles</span>
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Articles in {category.name}
        </h2>

        {articles.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500 space-y-2">
            <p className="font-bold text-base text-slate-800">No Publications Found</p>
            <p className="text-sm">There are no published articles currently under this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((art) => (
              <ArticleCard key={art.id} article={art} onSelect={onSelectArticle} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
