import React, { useState } from 'react';
import { X, Shield, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../lib/api';

interface AuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditModal: React.FC<AuditModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    workEmail: '',
    phone: '',
    clinicName: '',
    estimatedOutstandingDenials: '$100,000 - $250,000',
    billingIssues: '',
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.workEmail || !formData.clinicName) {
      setErrorMsg('Please fill in required fields: Name, Work Email, and Clinic Name.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      await api.submitAuditLead(formData);
      setSubmitted(true);

      // Confetti burst
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (err) {
        // Ignore confetti if unsupported
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit audit request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in duration-200 my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="text-2xl font-black text-slate-900">
              Audit Request Received!
            </h3>

            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Thank you, <strong className="text-slate-900">{formData.name}</strong>. A senior ClaimsCure medical billing auditor will analyze <strong className="text-slate-900">{formData.clinicName}</strong>'s denial metrics and reach out within 24 business hours.
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              A confirmation email has been sent to <strong className="text-slate-700">{formData.workEmail}</strong>.
            </p>

            <div className="pt-4">
              <button
                onClick={() => {
                  setSubmitted(false);
                  onClose();
                }}
                className="px-6 py-3 bg-slate-900 hover:bg-teal-600 text-white font-bold rounded-xl text-sm transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-[#0B5FA5]" />
                <span className="text-xs font-extrabold text-[#0B5FA5] uppercase tracking-wider">
                  Confidential & Non-Binding
                </span>
              </div>

              <h3 className="text-2xl font-black text-[#1A1A2E] tracking-tight">
                Request a Free Claims & Denial Audit
              </h3>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Provide basic details regarding your medical practice to receive a 24-hour revenue cycle analysis from ClaimsCure senior billing specialists.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Dr. Jane Smith"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Work Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.workEmail}
                    onChange={(e) => setFormData({ ...formData, workEmail: e.target.value })}
                    placeholder="jsmith@clinic.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Clinic / Practice Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.clinicName}
                    onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                    placeholder="e.g. Baltimore Medical Group"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Estimated Outstanding Denials / Aged AR
                </label>
                <select
                  value={formData.estimatedOutstandingDenials}
                  onChange={(e) =>
                    setFormData({ ...formData, estimatedOutstandingDenials: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-teal-500"
                >
                  <option value="Under $50,000">Under $50,000</option>
                  <option value="$50,000 - $150,000">$50,000 - $150,000</option>
                  <option value="$150,000 - $500,000">$150,000 - $500,000</option>
                  <option value="Over $500,000">Over $500,000</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Primary Billing / Denial Concerns
                </label>
                <textarea
                  rows={3}
                  value={formData.billingIssues}
                  onChange={(e) => setFormData({ ...formData, billingIssues: e.target.value })}
                  placeholder="Describe key denial codes, commercial payer struggles, or billing bottlenecks..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#0B5FA5] hover:bg-[#084A83] text-white font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer active:scale-[0.98]"
                >
                  {loading ? (
                    <span>Submitting Request...</span>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>Submit Free Audit Request</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
