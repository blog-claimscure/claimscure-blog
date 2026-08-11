import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Upload, Search, Check, X, Cloud, Sparkles } from 'lucide-react';
import { MediaItem } from '../../types';
import { api } from '../../lib/api';

interface MediaSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (media: { url: string; alt?: string; caption?: string; publicId?: string }) => void;
  title?: string;
  selectedUrl?: string;
}

export const MediaSelectorModal: React.FC<MediaSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectImage,
  title = 'Select Image from Cloudinary Media Library',
  selectedUrl,
}) => {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [cloudinaryStatus, setCloudinaryStatus] = useState<{ isConfigured: boolean; cloudName?: string }>({
    isConfigured: false,
  });

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const items = await api.getMedia();
      setMediaList(items || []);
      const status = await api.getCloudinaryStatus();
      setCloudinaryStatus(status);
    } catch (err) {
      console.error('Failed to load media list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
    }
  }, [isOpen]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const res = await api.uploadMedia(file.name, base64Data, file.name.split('.')[0]);
        if (res.media) {
          onSelectImage({
            url: res.media.url,
            alt: res.media.alt,
            caption: res.media.caption,
            publicId: res.media.publicId,
          });
          onClose();
        } else {
          await fetchMedia();
        }
      } catch (err: any) {
        alert(`Upload failed: ${err.message}`);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  const filtered = mediaList.filter(
    (m) =>
      (m.filename || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.alt || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.publicId || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>{title}</span>
                {cloudinaryStatus.isConfigured && (
                  <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-teal-200 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-teal-600" />
                    Cloudinary CDN Active
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                Pick an existing asset or upload a new high-resolution image.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar & Search */}
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by filename or public ID..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-teal-500"
            />
          </div>

          <label className="w-full sm:w-auto cursor-pointer px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs rounded-xl shadow transition-all flex items-center justify-center space-x-2">
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Uploading to Cloudinary...' : 'Upload New Media'}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>

        {/* Media Grid */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-50">
          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs font-semibold">
              Loading Cloudinary Media Assets...
            </div>
          ) : filtered.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
              <ImageIcon className="w-12 h-12 stroke-1" />
              <p className="text-xs font-semibold">No media items found matching search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filtered.map((item) => {
                const isSelected = selectedUrl === item.url;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      onSelectImage({
                        url: item.url,
                        alt: item.alt,
                        caption: item.caption,
                        publicId: item.publicId,
                      });
                      onClose();
                    }}
                    className={`group relative bg-white rounded-2xl border-2 overflow-hidden cursor-pointer shadow-xs transition-all hover:shadow-md ${
                      isSelected ? 'border-teal-500 ring-2 ring-teal-500/20' : 'border-slate-200 hover:border-teal-300'
                    }`}
                  >
                    <div className="aspect-video bg-slate-900 overflow-hidden relative">
                      <img
                        src={item.url}
                        alt={item.alt}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {item.isCloudinary && (
                        <span className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-xs text-teal-300 text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-teal-500/30">
                          Cloudinary
                        </span>
                      )}
                      {isSelected && (
                        <div className="absolute inset-0 bg-teal-900/40 backdrop-blur-2xs flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-teal-500 text-slate-950 flex items-center justify-center shadow-lg">
                            <Check className="w-5 h-5 font-black" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-2.5">
                      <p className="text-[11px] font-bold text-slate-900 truncate" title={item.filename}>
                        {item.filename}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                        <span>{item.dimensions || '1200x800'}</span>
                        <span>{item.format ? item.format.toUpperCase() : 'IMG'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Click any image thumbnail to assign it instantly.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
