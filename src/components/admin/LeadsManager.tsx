import React, { useState } from 'react';
import { Download, Trash2, CheckCircle2, Phone, Mail, Building, FileText, Filter } from 'lucide-react';
import { Lead } from '../../types';
import { api } from '../../lib/api';

interface LeadsManagerProps {
  leads: Lead[];
  onRefresh: () => void;
}

export const LeadsManager: React.FC<LeadsManagerProps> = ({ leads, onRefresh }) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const handleExportCSV = () => {
    window.open('/api/leads/export', '_blank');
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    await api.updateLead(leadId, { status: newStatus as any });
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete lead record?')) {
      await api.deleteLead(id);
      if (selectedLead?.id === id) setSelectedLead(null);
      onRefresh();
    }
  };

  const filteredLeads = statusFilter === 'all'
    ? leads
    : leads.filter((l) => l.status === statusFilter);

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-900 flex items-center">
            <FileText className="w-5 h-5 text-teal-600 mr-2" />
            Claims Audit Leads ({leads.length})
          </h3>
          <p className="text-xs text-slate-500">
            Medical practices and clinics requesting a complimentary ClaimsCure denial audit.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
          >
            <option value="all">All Lead Statuses</option>
            <option value="new">New Audit Requests</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="converted">Converted Client</option>
            <option value="lost">Lost / Unqualified</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-slate-900 hover:bg-teal-600 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Leads CSV</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Table List */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 uppercase tracking-wider text-slate-500 font-bold bg-slate-50">
                <th className="py-3 px-4">Clinic / Practice</th>
                <th className="py-3 px-4">Contact Person</th>
                <th className="py-3 px-4">Outstanding Denials</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.map((l) => (
                <tr
                  key={l.id}
                  onClick={() => setSelectedLead(l)}
                  className={`cursor-pointer transition-colors ${
                    selectedLead?.id === l.id ? 'bg-teal-50/80 font-semibold' : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <p>{l.clinicName}</p>
                    <p className="text-[10px] text-slate-400 font-normal">{new Date(l.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="text-slate-800">{l.name}</p>
                    <p className="text-slate-500 text-[11px]">{l.workEmail}</p>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-teal-700">
                    {l.estimatedOutstandingDenials}
                  </td>
                  <td className="py-3.5 px-4">
                    <select
                      value={l.status}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleStatusChange(l.id, e.target.value);
                      }}
                      className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-[11px] font-bold uppercase"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="converted">Converted</option>
                      <option value="lost">Lost</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(l.id);
                      }}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Lead Details Card */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h4 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3">
            Lead Inspection Details
          </h4>

          {selectedLead ? (
            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Clinic Name</span>
                <p className="font-extrabold text-slate-900 text-base">{selectedLead.clinicName}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Contact Person</span>
                <p className="font-bold text-slate-800 text-sm">{selectedLead.name}</p>
                <p className="text-slate-600 flex items-center">
                  <Mail className="w-3.5 h-3.5 mr-1 text-teal-600" />
                  {selectedLead.workEmail}
                </p>
                {selectedLead.phone && (
                  <p className="text-slate-600 flex items-center">
                    <Phone className="w-3.5 h-3.5 mr-1 text-teal-600" />
                    {selectedLead.phone}
                  </p>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Estimated Outstanding Denials
                </span>
                <p className="font-black text-teal-700 text-sm">
                  {selectedLead.estimatedOutstandingDenials}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Primary Denial & Billing Concerns
                </span>
                <p className="p-3 bg-slate-50 rounded-xl text-slate-700 leading-relaxed border border-slate-200">
                  {selectedLead.billingIssues || 'No specific notes entered.'}
                </p>
              </div>

              <div className="pt-2">
                <a
                  href={`mailto:${selectedLead.workEmail}?subject=ClaimsCure Free Claims Audit Request - ${encodeURIComponent(selectedLead.clinicName)}`}
                  className="w-full py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs rounded-xl shadow transition-colors flex items-center justify-center space-x-2"
                >
                  <Mail className="w-4 h-4" />
                  <span>Send Audit Email Response</span>
                </a>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-8 text-center">
              Select a lead row from the table to view full details.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
