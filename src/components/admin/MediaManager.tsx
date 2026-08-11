import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Trash2,
  Copy,
  Check,
  Search,
  Cloud,
  Sparkles,
  RefreshCw,
  Edit2,
  ExternalLink,
  X,
  FileCode,
} from 'lucide-react';
import { MediaItem } from '../../types';
import { api } from '../../lib/api';

interface MediaManagerProps {
  media: MediaItem[];
  onRefresh: () => void;
}

export const MediaManager: React.FC<MediaManagerProps> = ({ media, onRefresh }) => {
  const [uploading, setUploading] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [editAlt, setEditAlt] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [savingMeta, setSavingMeta] = useState(false);

  const [cloudinaryStatus, setCloudinaryStatus] = useState<{ isConfigured: boolean; cloudName?: string }>({
    isConfigured: false,
  });

  useEffect(() => {
    checkCloudinaryStatus();
  }, []);

  const checkCloudinaryStatus = async () => {
    try {
      const status = await api.getCloudinaryStatus();
      setCloudinaryStatus(status);
    } catch (err) {
      console.error('Failed to get Cloudinary status:', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        await api.uploadMedia(file.name, base64Data, file.name.split('.')[0]);
        onRefresh();
      } catch (err: any) {
        alert(`Upload failed: ${err.message}`);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string, publicId?: string) => {
    const msg = publicId
      ? `Delete this asset from Cloudinary and media library permanently?\n\nPublic ID: ${publicId}`
      : 'Delete this media item permanently?';

    if (confirm(msg)) {
      await api.deleteMedia(id);
      if (selectedItem?.id === id) setSelectedItem(null);
      onRefresh();
    }
  };

  const handleMigrate = async () => {
    setMigrating(true);
    try {
      const res = await api.migrateToCloudinary();
      alert(res.message);
      onRefresh();
    } catch (err: any) {
      alert(`Migration failed: ${err.message}`);
    } finally {
      setMigrating(false);
    }
  };

  const openInspector = (m: MediaItem) => {
    setSelectedItem(m);
    setEditAlt(m.alt || '');
    setEditCaption(m.caption || '');
  };

  const handleSaveMeta = async () => {
    if (!selectedItem) return;
    setSavingMeta(true);
    try {
      await api.updateMedia(selectedItem.id, editAlt, editCaption);
      setSelectedItem({ ...selectedItem, alt: editAlt, caption: editCaption });
      onRefresh();
    } catch (err: any) {
      alert(`Failed to save metadata: ${err.message}`);
    } finally {
      setSavingMeta(false);
    }
  };

  const filteredMedia = media.filter(
    (m) =>
      (m.filename || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.alt || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.publicId || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
      {/* Cloudinary Integration Status Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 rounded-2xl p-5 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="p-3 bg-teal-500/20 border border-teal-400/30 rounded-2xl text-teal-300">
            <Cloud className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h4 className="font-black text-base tracking-wide">
                Cloudinary CDN & Media Storage Engine
              </h4>
              {cloudinaryStatus.isConfigured ? (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>CONNECTED ({cloudinaryStatus.cloudName})</span>
                </span>
              ) : (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  SETUP RECOMMENDED
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
              All images uploaded through ClaimsCure Super Admin CMS are processed through Cloudinary with automatic WebP/AVIF formatting, responsive CDN delivery, and public asset tracking.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          {cloudinaryStatus.isConfigured && (
            <button
              onClick={handleMigrate}
              disabled={migrating}
              className="px-4 py-2 bg-teal-500/20 hover:bg-teal-500/30 border border-teal-400/40 text-teal-200 hover:text-white font-extrabold text-xs rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${migrating ? 'animate-spin' : ''}`} />
              <span>{migrating ? 'Migrating Media...' : 'Migrate Assets to Cloudinary'}</span>
            </button>
          )}

          <label className="cursor-pointer px-4 py-2 bg-teal-400 hover:bg-teal-300 text-slate-950 font-black text-xs rounded-xl shadow transition-all flex items-center space-x-1.5">
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Uploading...' : 'Upload Image File'}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-black text-slate-900 flex items-center">
            <ImageIcon className="w-5 h-5 text-teal-600 mr-2" />
            Cloudinary Media Library ({media.length} items)
          </h3>
          <p className="text-xs text-slate-500">
            Manage article featured covers, content figures, author avatars, and site graphics.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search filename or Cloudinary ID..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredMedia.map((m) => (
          <div
            key={m.id}
            className="group bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="aspect-video bg-slate-900 overflow-hidden relative">
              <img
                src={m.url}
                alt={m.alt}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {m.isCloudinary && (
                <span className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-xs text-teal-300 text-[9px] font-bold px-2 py-0.5 rounded-md border border-teal-500/30 flex items-center space-x-1">
                  <Cloud className="w-2.5 h-2.5 text-teal-400" />
                  <span>Cloudinary CDN</span>
                </span>
              )}
            </div>

            <div className="p-3 space-y-2">
              <p className="text-xs font-bold text-slate-900 truncate" title={m.filename}>
                {m.filename}
              </p>

              {m.publicId && (
                <p className="text-[10px] font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100 truncate" title={m.publicId}>
                  ID: {m.publicId}
                </p>
              )}

              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>{(m.fileSize / 1024).toFixed(0)} KB</span>
                <span>{m.dimensions || '1200x800'}</span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-1.5">
                <button
                  onClick={() => openInspector(m)}
                  className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                  title="Inspect / Edit Metadata"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleCopy(m.url, m.id)}
                  className="flex-1 py-1 bg-white hover:bg-teal-50 border border-slate-200 text-slate-700 hover:text-teal-700 font-bold text-[11px] rounded-lg transition-colors flex items-center justify-center space-x-1"
                >
                  {copiedId === m.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedId === m.id ? 'Copied' : 'Copy CDN URL'}</span>
                </button>

                <button
                  onClick={() => handleDelete(m.id, m.publicId)}
                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete Asset"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* INSPECTOR / EDIT METADATA MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                <Cloud className="w-5 h-5 text-teal-600" />
                <span>Cloudinary Asset Details</span>
              </h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-3">
                <div className="aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
                  <img src={selectedItem.url} alt={selectedItem.alt} className="w-full h-full object-cover" />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600 font-medium border border-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Dimensions:</span>
                    <span className="font-bold text-slate-800">{selectedItem.dimensions || '1200x800'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Format:</span>
                    <span className="font-bold text-slate-800">{selectedItem.format?.toUpperCase() || 'WEBP / JPG'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">File Size:</span>
                    <span className="font-bold text-slate-800">{(selectedItem.fileSize / 1024).toFixed(1)} KB</span>
                  </div>
                  {selectedItem.publicId && (
                    <div className="flex justify-between truncate">
                      <span className="text-slate-400">Public ID:</span>
                      <span className="font-mono text-teal-700 font-bold truncate">{selectedItem.publicId}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Alt Text (Accessibility & SEO)
                  </label>
                  <input
                    type="text"
                    value={editAlt}
                    onChange={(e) => setEditAlt(e.target.value)}
                    placeholder="Describe image for screen readers & SEO..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Caption / Figure Subtitle
                  </label>
                  <textarea
                    rows={3}
                    value={editCaption}
                    onChange={(e) => setEditCaption(e.target.value)}
                    placeholder="Optional caption displayed under image in articles..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cloudinary CDN URL
                  </label>
                  <div className="flex items-center space-x-1">
                    <input
                      type="text"
                      readOnly
                      value={selectedItem.url}
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-[11px] font-mono text-slate-600 truncate"
                    />
                    <a
                      href={selectedItem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSaveMeta}
                disabled={savingMeta}
                className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black rounded-xl shadow transition-all cursor-pointer"
              >
                {savingMeta ? 'Saving...' : 'Save Metadata'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
