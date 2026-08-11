import React from 'react';
import { ArrowLeft, UserCheck, Linkedin, Globe, FileText } from 'lucide-react';
import { Article, Category, Author } from '../types';
import { ArticleCard } from './ArticleCard';

interface AuthorDetailProps {
  author: Author;
  articles: (Article & { category?: Category; author?: Author })[];
  onSelectArticle: (slug: string) => void;
  onNavigateBack: () => void;
}

export const AuthorDetail: React.FC<AuthorDetailProps> = ({
  author,
  articles,
  onSelectArticle,
  onNavigateBack,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Author Profile Card Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-6">
          <button
            onClick={onNavigateBack}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-teal-400 hover:text-white transition-colors bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <img
              src={author.photo}
              alt={author.name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-teal-500 shadow-xl shrink-0"
            />

            <div className="space-y-2">
              <div className="flex items-center space-x-3 flex-wrap">
                <h1 className="text-3xl font-black text-white">{author.name}</h1>
                <span className="bg-teal-900 text-teal-300 text-xs font-bold px-3 py-0.5 rounded-full border border-teal-700">
                  {author.credentials}
                </span>
              </div>

              <p className="text-teal-400 font-semibold text-sm">{author.title}</p>
              <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">{author.bio}</p>

              <div className="pt-2 flex items-center space-x-4">
                {author.linkedin && (
                  <a
                    href={author.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-teal-300 transition-colors"
                  >
                    <Linkedin className="w-4 h-4 text-teal-400" />
                    <span>LinkedIn Profile</span>
                  </a>
                )}
                {author.website && (
                  <a
                    href={author.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-teal-300 transition-colors"
                  >
                    <Globe className="w-4 h-4 text-teal-400" />
                    <span>Official Profile</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Authored Articles */}
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-teal-600" />
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Publications Authored by {author.name} ({articles.length})
          </h2>
        </div>

        {articles.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500">
            No published articles found for this author.
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
