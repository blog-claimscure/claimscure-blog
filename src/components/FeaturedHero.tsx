import React from 'react';
import { Calendar, Clock, ArrowRight, TrendingUp, Sparkles, FileText } from 'lucide-react';
import { Article, Category, Author } from '../types';

interface FeaturedHeroProps {
  featuredArticles: (Article & { category?: Category; author?: Author })[];
  onSelectArticle: (slug: string) => void;
  onOpenAudit: () => void;
}

export const FeaturedHero: React.FC<FeaturedHeroProps> = ({
  featuredArticles,
  onSelectArticle,
  onOpenAudit,
}) => {
  if (!featuredArticles || featuredArticles.length === 0) return null;

  const mainArticle = featuredArticles[0];
  const sideArticles = featuredArticles.slice(1, 3);

  const mainDate = new Date(mainArticle.publishedAt || mainArticle.updatedAt).toLocaleDateString(
    'en-US',
    { month: 'short', day: 'numeric', year: 'numeric' }
  );

  return (
    <section className="mb-12 font-sans">
      {/* Section Headline */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-[#0B5FA5] shrink-0" />
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#1A1A2E] tracking-tight">
            Featured Healthcare Publications
          </h2>
        </div>

        <span className="self-start sm:self-auto text-[11px] font-extrabold text-[#0B5FA5] uppercase tracking-wider bg-[#E3F2FD] px-3 py-1 rounded-full border border-[#1E88E5]/20">
          ClaimsCure Industry Briefs
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Main Lead Featured Article Card */}
        <div
          onClick={() => onSelectArticle(mainArticle.slug)}
          className="lg:col-span-8 group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-slate-200 cursor-pointer flex flex-col justify-between transition-all duration-300 hover:border-[#1E88E5]"
        >
          {/* Featured Image Header */}
          <div className="relative aspect-[16/9] lg:aspect-[21/9] overflow-hidden bg-[#F8FAFC]">
            <img
              src={mainArticle.featuredImage}
              alt={mainArticle.imageAlt || mainArticle.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              <span className="bg-[#0B5FA5] text-white font-bold text-xs uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                {mainArticle.category?.name || 'Publication'}
              </span>
              <span className="bg-[#1A1A2E]/90 text-[#E3F2FD] font-bold text-xs uppercase tracking-wider px-3 py-1 rounded-full shadow-md border border-slate-700">
                Lead Insight
              </span>
            </div>
          </div>

          {/* Text Content */}
          <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-xs text-slate-500 font-semibold">
                <span className="flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1 text-[#0B5FA5]" />
                  {mainDate}
                </span>
                <span>•</span>
                <span className="flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1 text-[#0B5FA5]" />
                  {mainArticle.readingTime} min read
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1A2E] group-hover:text-[#0B5FA5] transition-colors leading-tight tracking-tight">
                {mainArticle.title}
              </h1>

              <p className="text-slate-600 text-sm sm:text-base line-clamp-3 leading-relaxed font-normal">
                {mainArticle.excerpt}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {mainArticle.author?.photo && (
                  <img
                    src={mainArticle.author.photo}
                    alt={mainArticle.author.name}
                    className="w-9 h-9 rounded-full object-cover border-2 border-[#0B5FA5] shrink-0"
                  />
                )}
                <div>
                  <p className="text-xs font-bold text-[#1A1A2E]">
                    {mainArticle.author?.name || 'ClaimsCure Panel'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {mainArticle.author?.title || 'RCM Consultant'}
                  </p>
                </div>
              </div>

              <span className="px-4 py-2.5 rounded-xl bg-[#E3F2FD] text-[#0B5FA5] group-hover:bg-[#0B5FA5] group-hover:text-white font-bold text-xs transition-all duration-200 flex items-center space-x-1.5 shrink-0">
                <span>Read Insight</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>

        {/* Side Featured Articles & Audit CTA Column */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-600 uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-[#0B5FA5] shrink-0" />
              <span>Trending Executive Reports</span>
            </div>

            {sideArticles.map((art) => (
              <div
                key={art.id}
                onClick={() => onSelectArticle(art.slug)}
                className="group bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-[#1E88E5] transition-all cursor-pointer flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-bold text-[#0B5FA5] bg-[#E3F2FD] px-2.5 py-0.5 rounded-md border border-[#1E88E5]/20">
                    {art.category?.name || 'Insight'}
                  </span>
                  <span className="flex items-center text-[11px] font-medium">
                    <Clock className="w-3 h-3 mr-1 text-slate-400" />
                    {art.readingTime} min
                  </span>
                </div>

                <h3 className="font-bold text-[#1A1A2E] group-hover:text-[#0B5FA5] transition-colors text-sm sm:text-base leading-snug line-clamp-2">
                  {art.title}
                </h3>

                <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed">
                  {art.excerpt}
                </p>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">
                    {art.author?.name || 'ClaimsCure Team'}
                  </span>
                  <span className="font-bold text-[#0B5FA5] flex items-center group-hover:translate-x-0.5 transition-transform">
                    Read Report <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Audit CTA Card */}
          <div className="bg-[#1A1A2E] text-white p-6 rounded-2xl shadow-md border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#1E88E5] flex items-center">
                <FileText className="w-3.5 h-3.5 mr-1 text-[#1E88E5]" /> Free Claims Audit
              </span>
              <span className="w-2 h-2 rounded-full bg-[#1E88E5] animate-pulse" />
            </div>

            <h4 className="font-extrabold text-base sm:text-lg text-white leading-tight">
              Uncover Lost Revenue in 24 Hours
            </h4>

            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              Submit practice denial files for a complimentary, confidential audit by senior ClaimsCure billing experts.
            </p>

            <button
              onClick={onOpenAudit}
              className="w-full py-3 bg-[#0B5FA5] hover:bg-[#1E88E5] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer active:scale-[0.98]"
            >
              <span>Submit Free Audit Request</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedHero;

