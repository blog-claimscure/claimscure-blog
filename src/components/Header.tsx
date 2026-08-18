import React, { useState } from 'react';
import { Shield, Search, FileText, Lock, Menu, X, ArrowUpRight, Phone, Mail, ChevronRight, ArrowLeft } from 'lucide-react';
import { SiteSettings, Category } from '../types';

interface HeaderProps {
  settings?: SiteSettings | null;
  categories?: Category[];
  onSelectCategory?: (id: string) => void;
  onOpenSearch?: () => void;
  onOpenAudit?: () => void;
  onOpenAdmin?: () => void;
  onGoHome?: () => void;
  onNavigate?: (path: string) => void;
  currentPath?: string;
  canGoBack?: boolean;
  onGoBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  categories = [],
  onSelectCategory,
  onOpenSearch,
  onOpenAudit,
  onOpenAdmin,
  onGoHome,
  onNavigate,
  canGoBack = false,
  onGoBack,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const safeCategories = Array.isArray(categories) ? categories : [];

  const navItems = [
    { label: 'Insights', url: '/category/revenue-cycle-management' },
    { label: 'Compliance Guides', url: '/category/cms-updates' },
    { label: 'Case Studies', url: '/category/case-studies' },
    { label: 'About Us', url: '/about' },
    { label: 'Contact', url: 'https://www.claimscure.com/contact', isExternal: true },
  ];

  const handleNavClick = (url: string, isExternal?: boolean) => {
    setMobileMenuOpen(false);
    if (isExternal) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else if (onNavigate) {
      onNavigate(url);
    } else if (url === '/' && onGoHome) {
      onGoHome();
    } else if (url.startsWith('/category/') && onSelectCategory) {
      const catSlug = url.replace('/category/', '');
      const cat = safeCategories.find((c) => c.slug === catSlug || c.id === catSlug);
      if (cat) {
        onSelectCategory(cat.id);
      } else if (onGoHome) {
        onGoHome();
      }
    }
  };

  const handleLogoClick = () => {
    setMobileMenuOpen(false);
    if (onGoHome) {
      onGoHome();
    } else if (onNavigate) {
      onNavigate('/');
    }
  };

  const handleAdminClick = () => {
    setMobileMenuOpen(false);
    if (onOpenAdmin) {
      onOpenAdmin();
    } else if (onNavigate) {
      onNavigate('/admin');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#FFFFFF]/95 backdrop-blur-md border-b border-slate-200 shadow-sm font-sans">
      {/* Top Utility Bar - Obsidian Black background with Sapphire/Azure highlights */}
      <div className="bg-[#1A1A2E] text-slate-300 px-3 sm:px-6 py-1.5 text-xs font-sans border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-1.5">
          <div className="flex items-center space-x-3 text-slate-300">
            <span className="flex items-center text-[#1E88E5] font-bold tracking-tight text-[11px] sm:text-xs">
              <Shield className="w-3.5 h-3.5 mr-1.5 shrink-0 text-[#1E88E5]" />
              ClaimsCure Publishing
            </span>
            <span className="hidden md:inline text-slate-600">|</span>
            <span className="hidden md:inline text-[11px] text-slate-400">
              U.S. Healthcare RCM & Medical Billing Insights
            </span>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4 text-xs font-medium">
            <a
              href={`tel:${settings?.contactPhone || '+13017398880'}`}
              className="flex items-center text-slate-300 hover:text-[#1E88E5] transition-colors py-0.5 text-[11px] sm:text-xs"
            >
              <Phone className="w-3 h-3 mr-1 text-[#1E88E5] shrink-0" />
              <span>{settings?.contactPhone || '+1 (301) 739-8880'}</span>
            </a>
            <a
              href={`mailto:${settings?.contactEmail || 'info@claimscure.com'}`}
              className="hidden sm:flex items-center text-slate-300 hover:text-[#1E88E5] transition-colors py-0.5"
            >
              <Mail className="w-3 h-3 mr-1 text-[#1E88E5] shrink-0" />
              <span>{settings?.contactEmail || 'info@claimscure.com'}</span>
            </a>
            <a
              href={settings?.mainWebsiteUrl || 'https://www.claimscure.com'}
              target="_blank"
              rel="noreferrer"
              className="flex items-center text-[#1E88E5] hover:text-white font-bold transition-colors py-0.5 text-[11px] sm:text-xs"
            >
              <span>Corporate Site</span>
              <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3 lg:gap-6">
        {/* Brand Logo & Optional Back Button */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {canGoBack && onGoBack && (
            <button
              onClick={onGoBack}
              className="p-2 rounded-xl bg-slate-100 hover:bg-[#E3F2FD] text-[#0B5FA5] transition-all cursor-pointer flex items-center justify-center border border-slate-200 shrink-0"
              title="Go Back"
              aria-label="Go Back"
            >
              <ArrowLeft className="w-4 h-4 text-[#0B5FA5]" />
            </button>
          )}

          <button
            onClick={handleLogoClick}
            className="flex items-center space-x-2.5 text-left focus:outline-none focus:ring-2 focus:ring-[#0B5FA5] rounded-xl p-0.5 group shrink-0"
            aria-label="ClaimsCure Blog Home"
          >
            {settings?.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings.siteName || 'ClaimsCure Logo'}
                className="h-9 sm:h-11 w-auto object-contain max-w-[150px] sm:max-w-[200px] rounded-lg group-hover:scale-102 transition-transform"
              />
            ) : (
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#0B5FA5] group-hover:bg-[#084A83] text-white flex items-center justify-center shadow-md transition-all duration-150 shrink-0">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xl sm:text-2xl font-black tracking-tight text-[#1A1A2E] leading-none">
                      Claims<span className="text-[#0B5FA5]">Cure</span>
                    </span>
                    <span className="bg-[#0B5FA5] text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                      BLOG
                    </span>
                  </div>
                </div>
              </div>
            )}
          </button>
        </div>

        {/* Desktop Primary Nav Links */}
        <nav className="hidden xl:flex items-center space-x-1">
          {navItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleNavClick(item.url, item.isExternal)}
              className="px-3 py-2 rounded-xl text-xs font-bold text-[#1A1A2E] hover:text-[#0B5FA5] hover:bg-[#E3F2FD]/80 transition-all cursor-pointer whitespace-nowrap"
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Desktop Single Search Input Bar */}
        {onOpenSearch && (
          <div className="hidden lg:flex flex-1 max-w-xs xl:max-w-sm">
            <button
              onClick={onOpenSearch}
              className="w-full bg-[#F8FAFC] hover:bg-[#E3F2FD]/50 border border-slate-300 hover:border-[#0B5FA5] rounded-xl px-3.5 py-2 text-left flex items-center justify-between transition-all cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center space-x-2 text-slate-500 group-hover:text-[#0B5FA5] text-xs font-medium truncate">
                <Search className="w-4 h-4 text-[#0B5FA5] shrink-0" />
                <span className="truncate">Search billing insights...</span>
              </div>
            </button>
          </div>
        )}

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center space-x-2 shrink-0">
          {onOpenAudit && (
            <button
              onClick={onOpenAudit}
              className="px-4 py-2.5 rounded-xl bg-[#0B5FA5] hover:bg-[#084A83] text-white font-extrabold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center space-x-1.5 whitespace-nowrap active:scale-[0.98]"
            >
              <FileText className="w-4 h-4" />
              <span>Free Claims Audit</span>
            </button>
          )}

         
        </div>

        {/* Mobile Action Controls */}
        <div className="flex lg:hidden items-center space-x-2">
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="p-2.5 rounded-xl text-[#0B5FA5] bg-[#E3F2FD] hover:bg-[#0B5FA5] hover:text-white transition-colors flex items-center justify-center cursor-pointer"
              aria-label="Search billing insights"
            >
              <Search className="w-4.5 h-4.5" />
            </button>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-xl text-[#1A1A2E] bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#FFFFFF] border-b border-slate-200 px-4 pt-4 pb-6 space-y-4 shadow-2xl animate-in slide-in-from-top-2 duration-200 max-h-[85vh] overflow-y-auto">
          <div className="space-y-1">
            <p className="text-[11px] font-extrabold text-[#0B5FA5] uppercase tracking-wider px-1 mb-2">
              Navigation
            </p>
            {navItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleNavClick(item.url, item.isExternal)}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold text-[#1A1A2E] hover:bg-[#E3F2FD] hover:text-[#0B5FA5] transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>{item.label}</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            ))}
          </div>

          {safeCategories.length > 0 && (
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <p className="text-[11px] font-extrabold text-[#0B5FA5] uppercase tracking-wider px-1">
                Browse Topics
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onSelectCategory) onSelectCategory('all');
                  }}
                  className="text-left px-3 py-2 rounded-xl text-xs font-bold text-[#1A1A2E] bg-slate-50 hover:bg-[#E3F2FD] hover:text-[#0B5FA5] transition-colors border border-slate-200"
                >
                  All Topics
                </button>
                {safeCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (onSelectCategory) onSelectCategory(cat.id);
                    }}
                    className="text-left px-3 py-2 rounded-xl text-xs font-bold text-[#1A1A2E] bg-slate-50 hover:bg-[#E3F2FD] hover:text-[#0B5FA5] transition-colors border border-slate-200 truncate"
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 space-y-2">
            {onOpenAudit && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAudit();
                }}
                className="w-full py-3 bg-[#0B5FA5] hover:bg-[#084A83] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl text-center flex items-center justify-center space-x-2 shadow-md cursor-pointer active:scale-[0.99]"
              >
                <FileText className="w-4 h-4" />
                <span>Free Claims Audit</span>
              </button>
            )}

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleAdminClick();
              }}
              className="w-full py-2.5 bg-[#F8FAFC] hover:bg-slate-200 text-[#1A1A2E] border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Lock className="w-4 h-4 text-[#0B5FA5]" />
              <span>Super Admin Portal</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
