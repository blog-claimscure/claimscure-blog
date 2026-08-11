import React from 'react';
import { Clock, Calendar, ArrowRight, User } from 'lucide-react';
import { Article, Category, Author } from '../types';

interface ArticleCardProps {
  article: Article & { category?: Category; author?: Author };
  onSelect: (slug: string) => void;
  featured?: boolean;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article, onSelect, featured }) => {
  const formattedDate = new Date(article.publishedAt || article.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      onClick={() => onSelect(article.slug)}
      className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-[#1E88E5] transition-all duration-200 flex flex-col overflow-hidden cursor-pointer h-full font-sans active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-[#0B5FA5]"
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(article.slug);
        }
      }}
    >
      {/* Image Container */}
      <div className="relative aspect-[16/9] overflow-hidden bg-[#F8FAFC]">
        <img
          src={article.featuredImage}
          alt={article.imageAlt || article.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {article.category && (
          <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-md text-[#0B5FA5] border border-blue-100 text-[11px] font-extrabold px-3 py-1 rounded-full shadow-sm uppercase tracking-wider whitespace-nowrap">
            {article.category.name}
          </span>
        )}

        {featured && (
          <span className="absolute top-3 right-3 bg-[#0B5FA5] text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow whitespace-nowrap">
            Featured
          </span>
        )}
      </div>

      {/* Content Body */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          <div className="flex items-center space-x-3 text-xs text-slate-500 font-semibold">
            <span className="flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1 text-[#0B5FA5] shrink-0" />
              {formattedDate}
            </span>
            <span>•</span>
            <span className="flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1 text-[#0B5FA5] shrink-0" />
              {article.readingTime} min read
            </span>
          </div>

          <h3 className="text-lg font-bold text-[#1A1A2E] group-hover:text-[#0B5FA5] transition-colors leading-snug line-clamp-2">
            {article.title}
          </h3>

          <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed font-normal">
            {article.excerpt}
          </p>
        </div>

        {/* Author Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
          <div className="flex items-center space-x-2.5">
            {article.author?.photo ? (
              <img
                src={article.author.photo}
                alt={article.author.name}
                className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
            )}
            <div>
              <p className="text-xs font-bold text-[#1A1A2E] line-clamp-1">
                {article.author?.name || 'ClaimsCure Editorial'}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                {article.author?.credentials ? article.author.credentials : 'RCM Expert'}
              </p>
            </div>
          </div>

          <span className="text-xs font-bold text-[#0B5FA5] group-hover:text-[#1E88E5] flex items-center group-hover:translate-x-1 transition-transform whitespace-nowrap">
            Read <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </span>
        </div>
      </div>
    </div>
  );
};

export default ArticleCard;

