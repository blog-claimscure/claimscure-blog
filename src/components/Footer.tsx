import React, { useState } from 'react';
import {
  ShieldCheck,
  Mail,
  ArrowRight,
  Phone,
  MapPin,
  ExternalLink,
  KeyRound,
  CheckCircle2,
  Send,
} from 'lucide-react';
import { SiteSettings, Category } from '../types';
import { api } from '../lib/api';

export interface FooterProps {
  settings?: SiteSettings | null;
  categories?: Category[];
  onSelectCategory?: (id: string) => void;
  onOpenAudit?: () => void;
  onOpenAdmin?: () => void;
  onNavigate?: (path: string) => void;
  siteTitle?: string;
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  categories,
  onSelectCategory,
  onOpenAudit,
  onOpenAdmin,
  onNavigate,
  siteTitle,
}) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleNav = (path: string) => {
    // Normalize path (#/about -> /about or /)
    const cleanPath = path.replace(/^#/, '') || '/';

    if (onNavigate) {
      onNavigate(cleanPath);
    } else if (cleanPath === '/admin' && onOpenAdmin) {
      onOpenAdmin();
    } else if (cleanPath.startsWith('/category/') && onSelectCategory) {
      const safeCategories = Array.isArray(categories) ? categories : [];
      const catSlug = cleanPath.replace('/category/', '');
      const cat = safeCategories.find((c) => c.slug === catSlug || c.id === catSlug);
      if (cat) onSelectCategory(cat.id);
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid business email address.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      await api.subscribe(email.trim(), 'Footer Compliance Alerts');
      setSubscribed(true);
      setEmail('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Subscription failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="bg-[#1A1A2E] text-slate-300 border-t border-slate-800 pt-12 pb-12 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Compliance Alerts Newsletter Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-[#0B5FA5]/20 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-[#0B5FA5]/20 border border-[#0B5FA5]/40 text-[#1E88E5]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-white text-base sm:text-lg font-extrabold tracking-wide">
                  2026 CMS & Compliance Directives Alert
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Get real-time updates on CPT code modifications, CMS fee schedule tariffs, HIPAA security guidelines, and denial management strategies.
              </p>
            </div>

            <div className="w-full lg:w-auto shrink-0 min-w-[300px] sm:min-w-[420px]">
              {subscribed ? (
                <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-2xl p-4 text-xs sm:text-sm text-emerald-300 flex items-center space-x-3 shadow-inner">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold block text-white">Successfully Subscribed!</span>
                    <span className="text-xs text-emerald-300/90">You will receive the latest 2026 medical billing and compliance alerts.</span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="space-y-2">
                  <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        placeholder="billing@yourpractice.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full py-2.5 pl-10 pr-4 text-xs sm:text-sm bg-slate-950 border border-slate-700/80 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-[#1E88E5] focus:ring-1 focus:ring-[#1E88E5] transition-all"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="py-2.5 px-5 bg-[#0B5FA5] hover:bg-[#1E88E5] disabled:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-2 shrink-0 shadow-lg hover:shadow-blue-500/20 active:scale-98"
                    >
                      {submitting ? (
                        <>
                          <Send className="h-4 w-4 animate-pulse" />
                          <span>Subscribing...</span>
                        </>
                      ) : (
                        <>
                          <span>Subscribe Alerts</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                  {errorMsg && <p className="text-rose-400 text-xs pl-1">{errorMsg}</p>}
                  <p className="text-[11px] text-slate-400 pl-1 flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 inline" />
                    <span>100% HIPAA & GDPR Compliant. Unsubscribe at any time.</span>
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* 4-Column Main Footer Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Brand Info & Contacts */}
          <div className="space-y-4">
            <button
              onClick={() => handleNav('/')}
              className="flex items-center gap-2.5 group cursor-pointer text-left focus:outline-none"
            >
              {settings?.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.siteName || 'ClaimsCure Logo'}
                  className="h-10 sm:h-12 w-auto object-contain max-w-[200px] group-hover:scale-102 transition-transform"
                />
              ) : (
                <div className="flex items-center gap-2.5">
                  <div className="bg-[#0B5FA5] text-white p-2 rounded-xl shadow-md group-hover:bg-[#1E88E5] transition-colors">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <span className="text-xl font-bold tracking-tight text-white">
                    {siteTitle || settings?.siteName || 'Claims'}
                    <span className="text-[#1E88E5]">Cure</span>
                  </span>
                </div>
              )}
            </button>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-300">
              {settings?.siteDescription ||
                'Leading medical billing company and HIPAA-compliant revenue cycle solutions provider. Reducing administrative burdens, optimizing claims processing, and maximizing collections for healthcare practices nationwide.'}
            </p>
            <div className="flex flex-col gap-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-[#1E88E5] shrink-0" />
                <a
                  href={`tel:${settings?.contactPhone || '+13017398880'}`}
                  className="hover:text-white transition-colors"
                >
                  {settings?.contactPhone || '+1 (301) 739-8880'}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-[#1E88E5] shrink-0" />
                <a
                  href={`mailto:${settings?.contactEmail || 'info@claimscure.com'}`}
                  className="hover:text-white transition-colors"
                >
                  {settings?.contactEmail || 'info@claimscure.com'}
                </a>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 text-[#1E88E5] mt-0.5 shrink-0" />
                <span>
                  {settings?.contactAddress || '306 W REDWOOD ST STE 200, BALTIMORE, MD 21201'}
                </span>
              </div>
            </div>
          </div>

          {/* Column 2: RCM Services */}
          <div>
            <h3 className="text-white text-xs font-bold tracking-wider uppercase mb-4 pb-2 border-b border-slate-800/80">
              RCM Services
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
              <li>
                <a
                  href="https://www.claimscure.com/Medical-Billing-Services"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#1E88E5] transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Medical Billing Services</span>
                  <ExternalLink className="h-3 w-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.claimscure.com/Revenue-Cycle-Management"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#1E88E5] transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Revenue Cycle Management</span>
                  <ExternalLink className="h-3 w-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.claimscure.com/Laboratory-Billing-Services"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#1E88E5] transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Laboratory Billing Services</span>
                  <ExternalLink className="h-3 w-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.claimscure.com/Medical-Billing-Coding-Services"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#1E88E5] transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Medical Billing & Coding</span>
                  <ExternalLink className="h-3 w-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.claimscure.com/MIPS-Reporting-Billing-Audit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#1E88E5] transition-colors inline-flex items-center gap-1.5"
                >
                  <span>MIPS Billing & Audits</span>
                  <ExternalLink className="h-3 w-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.claimscure.com/Credentialing-Services"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#1E88E5] transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Credentialing Services</span>
                  <ExternalLink className="h-3 w-3 text-slate-500" />
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Corporate & Info */}
          <div>
            <h3 className="text-white text-xs font-bold tracking-wider uppercase mb-4 pb-2 border-b border-slate-800/80">
              Resources & Info
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
              <li>
                <a
                  href="https://www.claimscure.com/about"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#1E88E5] transition-colors inline-flex items-center gap-1.5"
                >
                  <span>About ClaimsCure</span>
                  <ExternalLink className="h-3 w-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.claimscure.com/Expertise"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#1E88E5] transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Our Expertise</span>
                  <ExternalLink className="h-3 w-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.claimscure.com/Specialties"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#1E88E5] transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Medical Specialties</span>
                  <ExternalLink className="h-3 w-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.claimscure.com/States"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#1E88E5] transition-colors inline-flex items-center gap-1.5"
                >
                  <span>States We Serve</span>
                  <ExternalLink className="h-3 w-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.claimscure.com/faq"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#1E88E5] transition-colors inline-flex items-center gap-1.5"
                >
                  <span>FAQs</span>
                  <ExternalLink className="h-3 w-3 text-slate-500" />
                </a>
              </li>
              <li>
                <button
                  onClick={() => handleNav('/about')}
                  className="hover:text-[#1E88E5] transition-colors cursor-pointer text-left inline-flex items-center gap-1"
                >
                  Blog Editorial Team
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Governance & Quick Actions */}
          <div>
            <h3 className="text-white text-xs font-bold tracking-wider uppercase mb-4 pb-2 border-b border-slate-800/80">
              Governance & Access
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
              <li>
                <a
                  href="https://www.claimscure.com/hipaa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors inline-flex items-center gap-1.5 text-[#1E88E5] font-semibold"
                >
                  <span>HIPAA Safeguards</span>
                  <ExternalLink className="h-3 w-3 text-[#1E88E5]" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.claimscure.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#1E88E5] transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Main Privacy Policy</span>
                  <ExternalLink className="h-3 w-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.claimscure.com/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#1E88E5] transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Main Terms of Use</span>
                  <ExternalLink className="h-3 w-3 text-slate-500" />
                </a>
              </li>
              <li className="pt-2">
                <button
                  onClick={() => (onOpenAudit ? onOpenAudit() : handleNav('/'))}
                  className="w-full py-2 px-3 bg-[#0B5FA5]/20 hover:bg-[#0B5FA5]/40 border border-[#0B5FA5]/50 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-between"
                >
                  <span>Free Claims Audit</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#1E88E5]" />
                </button>
              </li>
              <li className="pt-1">
                <button
                  onClick={() => (onOpenAdmin ? onOpenAdmin() : handleNav('/admin'))}
                  className="inline-flex items-center gap-1.5 hover:text-white text-[#1E88E5] font-bold text-xs transition-colors cursor-pointer text-left"
                >
                  <KeyRound className="h-3.5 w-3.5 text-[#1E88E5]" />
                  <span>Admin Portal CMS</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        <hr className="border-slate-800" />

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400">
          <div>
            &copy; {new Date().getFullYear()} ClaimsCure Solutions. All rights reserved. HIPAA Compliant & Secure.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#1E88E5] animate-pulse" />
              <span>Secure RCM Network Active</span>
            </span>
            <span>v2.4.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
