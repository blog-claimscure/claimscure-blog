import React, { useState } from 'react';
import { Plus, Trash2, UserCheck, Shield, Globe, Linkedin, Image as ImageIcon } from 'lucide-react';
import { Author } from '../../types';
import { api } from '../../lib/api';
import { MediaSelectorModal } from './MediaSelectorModal';

interface AuthorsManagerProps {
  authors: Author[];
  onRefresh: () => void;
}

export const AuthorsManager: React.FC<AuthorsManagerProps> = ({ authors = [], onRefresh }) => {
  const safeAuthors = Array.isArray(authors) ? authors : [];
  const [formData, setFormData] = useState<Partial<Author>>({
    name: '',
    title: 'Senior RCM Consultant',
    credentials: 'CPC, CPMA',
    bio: '',
    photo: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&auto=format&fit=crop&q=80',
    linkedin: '',
    website: '',
  });

  const [loading, setLoading] = useState(false);
  const [mediaModalOpen, setMediaModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    setLoading(true);
    try {
      await api.createAuthor(formData);
      setFormData({
        name: '',
        title: 'Senior RCM Consultant',
        credentials: 'CPC, CPMA',
        bio: '',
        photo: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&auto=format&fit=crop&q=80',
      });
      onRefresh();
    } catch (e) {
      //
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this ClaimsCure author profile?')) {
      await api.deleteAuthor(id);
      onRefresh();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Create Author Form */}
      <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
        <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center">
          <UserCheck className="w-5 h-5 text-teal-600 mr-2" />
          Add ClaimsCure Author
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Sarah Jenkins"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Job Title
              </label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Senior RCM Specialist"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Credentials
              </label>
              <input
                type="text"
                value={formData.credentials || ''}
                onChange={(e) => setFormData({ ...formData, credentials: e.target.value })}
                placeholder="CPC, CPMA, RHIA"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Biography
            </label>
            <textarea
              rows={3}
              value={formData.bio || ''}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Professional summary of healthcare billing expertise..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Author Headshot / Photo
              </label>
              <button
                type="button"
                onClick={() => setMediaModalOpen(true)}
                className="text-[11px] font-bold text-teal-700 hover:text-teal-900 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200 transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <ImageIcon className="w-3 h-3" />
                <span>Cloudinary Media</span>
              </button>
            </div>
            <input
              type="text"
              value={formData.photo || ''}
              onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs rounded-xl shadow transition-colors flex items-center justify-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Add Author Profile</span>
          </button>
        </form>
      </div>

      {/* Authors List */}
      <div className="lg:col-span-7 space-y-4">
        <h3 className="text-lg font-black text-slate-900">
          ClaimsCure Healthcare Authors ({safeAuthors.length})
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {safeAuthors.map((a) => (
            <div
              key={a.id}
              className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3 relative flex flex-col justify-between"
            >
              <div className="flex items-start space-x-3">
                <img
                  src={a.photo}
                  alt={a.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-teal-500 shrink-0"
                />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{a.name}</h4>
                  <p className="text-xs text-teal-700 font-semibold">{a.title}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">{a.credentials}</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{a.bio}</p>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">ID: {a.id}</span>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <MediaSelectorModal
        isOpen={mediaModalOpen}
        onClose={() => setMediaModalOpen(false)}
        selectedUrl={formData.photo}
        onSelectImage={(m) => setFormData((prev) => ({ ...prev, photo: m.url }))}
      />
    </div>
  );
};
