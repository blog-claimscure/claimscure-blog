import React, { useState } from 'react';
import { Plus, Trash2, Edit2, FolderOpen, Tag as TagIcon, Check } from 'lucide-react';
import { Category, Tag } from '../../types';
import { api } from '../../lib/api';

interface CategoriesManagerProps {
  categories: Category[];
  tags: Tag[];
  onRefresh: () => void;
}

export const CategoriesManager: React.FC<CategoriesManagerProps> = ({
  categories = [],
  tags = [],
  onRefresh,
}) => {
  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeTags = Array.isArray(tags) ? tags : [];

  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    setLoading(true);
    try {
      await api.createCategory({ name: newCatName, description: newCatDesc });
      setNewCatName('');
      setNewCatDesc('');
      onRefresh();
    } catch (e) {
      //
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName) return;
    setLoading(true);
    try {
      await api.createTag(newTagName);
      setNewTagName('');
      onRefresh();
    } catch (e) {
      //
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      await api.deleteCategory(id);
      onRefresh();
    }
  };

  const handleDeleteTag = async (id: string) => {
    if (confirm('Are you sure you want to delete this tag?')) {
      await api.deleteTag(id);
      onRefresh();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Categories Column */}
      <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-lg font-black text-slate-900 flex items-center">
            <FolderOpen className="w-5 h-5 text-teal-600 mr-2" />
            Publication Categories ({safeCategories.length})
          </h3>
        </div>

        {/* Add Category Form */}
        <form onSubmit={handleAddCategory} className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Add New Category</p>
          <input
            type="text"
            required
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="e.g. Credentialing & Provider Enrollment"
            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900"
          />
          <input
            type="text"
            value={newCatDesc}
            onChange={(e) => setNewCatDesc(e.target.value)}
            placeholder="Category description..."
            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-colors flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Category</span>
          </button>
        </form>

        {/* Categories List */}
        <div className="space-y-3">
          {safeCategories.map((c) => (
            <div key={c.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 text-sm">{c.name}</p>
                <p className="text-xs text-slate-500">{c.description || `/${c.slug}`}</p>
              </div>

              <button
                onClick={() => handleDeleteCategory(c.id)}
                className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tags Column */}
      <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-lg font-black text-slate-900 flex items-center">
            <TagIcon className="w-5 h-5 text-teal-600 mr-2" />
            Publication Tags ({safeTags.length})
          </h3>
        </div>

        <form onSubmit={handleAddTag} className="flex gap-2">
          <input
            type="text"
            required
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="e.g. Prior Authorization"
            className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-slate-900 hover:bg-teal-600 text-white font-bold text-xs rounded-xl transition-colors"
          >
            Add Tag
          </button>
        </form>

        <div className="flex flex-wrap gap-2 pt-2">
          {safeTags.map((t) => (
            <div
              key={t.id}
              className="bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-800 flex items-center space-x-2"
            >
              <span>#{t.name}</span>
              <button
                onClick={() => handleDeleteTag(t.id)}
                className="text-slate-400 hover:text-rose-600 font-bold"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
