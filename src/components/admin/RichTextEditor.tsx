import React, { useRef, useEffect, useState } from 'react';
import { MediaSelectorModal } from './MediaSelectorModal';
import { api } from '../../lib/api';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Image as ImageIcon,
  Quote,
  Table as TableIcon,
  Code,
  Eye,
  RemoveFormatting,
  AlertCircle,
  HelpCircle,
  Plus,
  Upload,
  X,
  Palette,
  Check,
  Divide,
  Type,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start writing your article content here...',
  label,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isSourceView, setIsSourceView] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [imageAlign, setImageAlign] = useState<'center' | 'full' | 'left' | 'right'>('center');

  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [linkNewTab, setLinkNewTab] = useState(true);

  const [selectedColor, setSelectedColor] = useState('#0B5FA5');
  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  // Sync editor content with incoming value when not currently editing
  useEffect(() => {
    if (editorRef.current && !isSourceView) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value, isSourceView]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const exec = (command: string, value: string | undefined = undefined) => {
    if (isSourceView) return;
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  };

  const handleFormatBlock = (blockType: string) => {
    if (isSourceView) return;
    if (blockType === 'p' || blockType === 'h1' || blockType === 'h2' || blockType === 'h3' || blockType === 'h4' || blockType === 'blockquote') {
      exec('formatBlock', `<${blockType}>`);
    } else if (blockType === 'lead') {
      exec('formatBlock', '<p>');
      // Add lead class to current node
      const selection = window.getSelection();
      if (selection && selection.anchorNode) {
        let parent = selection.anchorNode.parentElement;
        if (parent) {
          parent.className = 'text-lg text-slate-700 font-medium leading-relaxed my-4';
          handleInput();
        }
      }
    }
  };

  const insertCustomHTML = (html: string) => {
    if (isSourceView) {
      onChange((value || '') + '\n' + html);
      return;
    }
    if (editorRef.current) {
      editorRef.current.focus();
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const div = document.createElement('div');
        div.innerHTML = html;
        const frag = document.createDocumentFragment();
        let node;
        let lastNode;
        while ((node = div.firstChild)) {
          lastNode = frag.appendChild(node);
        }
        range.insertNode(frag);
        if (lastNode) {
          range.setStartAfter(lastNode);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      } else {
        editorRef.current.innerHTML += html;
      }
      handleInput();
    }
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64Url = event.target?.result as string;
        const res = await api.uploadMedia(file.name, base64Url, imageAlt || file.name, imageCaption);
        if (res.media) {
          setImageUrl(res.media.url);
          if (res.media.alt) setImageAlt(res.media.alt);
          if (res.media.caption) setImageCaption(res.media.caption);
        }
      } catch (err: any) {
        alert(`Cloudinary upload failed: ${err.message}`);
      } finally {
        setUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleInsertImage = () => {
    if (!imageUrl) return;
    
    let containerClass = 'my-6 shadow-sm rounded-2xl overflow-hidden border border-slate-200';
    if (imageAlign === 'center') containerClass += ' max-w-2xl mx-auto';
    if (imageAlign === 'left') containerClass += ' max-w-md float-left mr-6 mb-4';
    if (imageAlign === 'right') containerClass += ' max-w-md float-right ml-6 mb-4';
    if (imageAlign === 'full') containerClass += ' w-full';

    const captionHtml = imageCaption ? `<figcaption class="text-center text-xs text-slate-500 mt-2 italic font-medium">${imageCaption}</figcaption>` : '';

    const imgHtml = `
      <figure class="${containerClass}">
        <img src="${imageUrl}" alt="${imageAlt || 'Article image'}" class="w-full h-auto object-cover rounded-2xl" />
        ${captionHtml}
      </figure>
      <p><br/></p>
    `;

    insertCustomHTML(imgHtml);
    setImageModalOpen(false);
    setImageUrl('');
    setImageAlt('');
    setImageCaption('');
  };

  const handleInsertLink = () => {
    if (!linkUrl) return;
    const target = linkNewTab ? ' target="_blank" rel="noopener noreferrer"' : '';
    const text = linkText || linkUrl;
    const linkHtml = `<a href="${linkUrl}"${target} class="text-[#0B5FA5] hover:underline font-bold">${text}</a>`;
    insertCustomHTML(linkHtml);
    setLinkModalOpen(false);
    setLinkUrl('');
    setLinkText('');
  };

  const handleInsertCallout = (type: 'info' | 'warning' | 'success') => {
    let bg = 'bg-[#E3F2FD] border-[#1E88E5]/40 text-[#0B5FA5]';
    let title = 'Compliance Note';
    if (type === 'warning') {
      bg = 'bg-amber-50 border-amber-300 text-amber-900';
      title = 'Regulatory Warning';
    } else if (type === 'success') {
      bg = 'bg-emerald-50 border-emerald-300 text-emerald-900';
      title = 'Best Practice';
    }

    const calloutHtml = `
      <div class="my-6 p-4 rounded-2xl border ${bg} space-y-1">
        <div class="flex items-center space-x-2 font-extrabold text-xs uppercase tracking-wider">
          <span>📌 ${title}</span>
        </div>
        <p class="text-sm font-medium leading-relaxed">Enter policy or compliance guidance detail here...</p>
      </div>
      <p><br/></p>
    `;
    insertCustomHTML(calloutHtml);
  };

  const handleInsertTable = () => {
    const tableHtml = `
      <div className="my-6 overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
        <table class="w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr class="bg-[#1A1A2E] text-white font-extrabold">
              <th class="p-3 border-b border-slate-700">CPT / Code</th>
              <th class="p-3 border-b border-slate-700">Description</th>
              <th class="p-3 border-b border-slate-700">2026 CMS Rate</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 bg-white">
            <tr>
              <td class="p-3 font-mono font-bold text-[#0B5FA5]">99214</td>
              <td class="p-3">Office/Outpatient Visit Est Moderate</td>
              <td class="p-3 font-semibold text-emerald-700">$132.40</td>
            </tr>
            <tr>
              <td class="p-3 font-mono font-bold text-[#0B5FA5]">99215</td>
              <td class="p-3">Office/Outpatient Visit Est High</td>
              <td class="p-3 font-semibold text-emerald-700">$186.10</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p><br/></p>
    `;
    insertCustomHTML(tableHtml);
  };

  return (
    <div className="font-sans space-y-3">
      {/* Word Processor Formatting Toolbar — outside the text editing area */}
      <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-2.5 flex flex-wrap items-center gap-1.5">
        {/* Paragraph & Headings Select */}
        <select
          onChange={(e) => handleFormatBlock(e.target.value)}
          disabled={isSourceView}
          className="bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none hover:border-[#0B5FA5] cursor-pointer"
        >
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1 (Main)</option>
          <option value="h2">Heading 2 (Section)</option>
          <option value="h3">Heading 3 (Sub-section)</option>
          <option value="h4">Heading 4 (Minor)</option>
          <option value="lead">Lead Paragraph</option>
          <option value="blockquote">Quote Block</option>
        </select>

        <div className="h-5 w-px bg-slate-300 mx-1 hidden sm:block" />

        {/* TextStyle Buttons */}
        <button
          type="button"
          onClick={() => exec('bold')}
          disabled={isSourceView}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 font-bold hover:text-[#0B5FA5] transition-colors cursor-pointer"
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => exec('italic')}
          disabled={isSourceView}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 hover:text-[#0B5FA5] transition-colors cursor-pointer"
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => exec('underline')}
          disabled={isSourceView}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 hover:text-[#0B5FA5] transition-colors cursor-pointer"
          title="Underline (Ctrl+U)"
        >
          <Underline className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => exec('strikeThrough')}
          disabled={isSourceView}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 hover:text-[#0B5FA5] transition-colors cursor-pointer"
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-slate-300 mx-1 hidden sm:block" />

        {/* Text Color Picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setColorPickerOpen(!colorPickerOpen)}
            disabled={isSourceView}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 flex items-center space-x-1 cursor-pointer"
            title="Text Color"
          >
            <Palette className="w-4 h-4 text-[#0B5FA5]" />
            <span className="w-2.5 h-2.5 rounded-full border border-slate-400" style={{ backgroundColor: selectedColor }} />
          </button>

          {colorPickerOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 shadow-xl rounded-xl p-2 z-30 flex gap-1.5">
              {['#0B5FA5', '#1A1A2E', '#059669', '#D97706', '#DC2626', '#475569'].map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => {
                    setSelectedColor(col);
                    exec('foreColor', col);
                    setColorPickerOpen(false);
                  }}
                  className="w-6 h-6 rounded-full border border-slate-300 hover:scale-110 transition-transform cursor-pointer"
                  style={{ backgroundColor: col }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-slate-300 mx-1 hidden sm:block" />

        {/* Alignment Buttons */}
        <button
          type="button"
          onClick={() => exec('justifyLeft')}
          disabled={isSourceView}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => exec('justifyCenter')}
          disabled={isSourceView}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => exec('justifyRight')}
          disabled={isSourceView}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-slate-300 mx-1 hidden sm:block" />

        {/* Lists */}
        <button
          type="button"
          onClick={() => exec('insertUnorderedList')}
          disabled={isSourceView}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 hover:text-[#0B5FA5] transition-colors cursor-pointer"
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => exec('insertOrderedList')}
          disabled={isSourceView}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 hover:text-[#0B5FA5] transition-colors cursor-pointer"
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-slate-300 mx-1 hidden sm:block" />

        {/* Inserters: Image, Link, Callout, Table */}
        <button
          type="button"
          onClick={() => setImageModalOpen(true)}
          className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 hover:bg-[#E3F2FD] hover:text-[#0B5FA5] hover:border-[#1E88E5]/40 transition-all flex items-center space-x-1 cursor-pointer"
          title="Insert Image inside text"
        >
          <ImageIcon className="w-3.5 h-3.5 text-[#0B5FA5]" />
          <span>Image</span>
        </button>

        <button
          type="button"
          onClick={() => setLinkModalOpen(true)}
          className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 hover:bg-[#E3F2FD] hover:text-[#0B5FA5] hover:border-[#1E88E5]/40 transition-all flex items-center space-x-1 cursor-pointer"
          title="Insert Hyperlink"
        >
          <LinkIcon className="w-3.5 h-3.5 text-[#0B5FA5]" />
          <span>Link</span>
        </button>

        <button
          type="button"
          onClick={() => handleInsertCallout('info')}
          className="px-2.5 py-1 bg-[#E3F2FD] border border-[#1E88E5]/30 rounded-lg text-xs font-bold text-[#0B5FA5] hover:bg-[#0B5FA5] hover:text-white transition-all flex items-center space-x-1 cursor-pointer"
          title="Insert Policy Info Box"
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Callout Box</span>
        </button>

        <button
          type="button"
          onClick={handleInsertTable}
          className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 hover:bg-slate-100 transition-all flex items-center space-x-1 cursor-pointer"
          title="Insert Billing Comparison Table"
        >
          <TableIcon className="w-3.5 h-3.5 text-slate-600" />
          <span>Table</span>
        </button>

        <button
          type="button"
          onClick={() => exec('insertHorizontalRule')}
          disabled={isSourceView}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          title="Insert Horizontal Divider Line"
        >
          <Divide className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => exec('removeFormat')}
          disabled={isSourceView}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer ml-auto"
          title="Clear Formatting"
        >
          <RemoveFormatting className="w-4 h-4" />
        </button>

        {/* HTML Code View Toggle */}
        <button
          type="button"
          onClick={() => setIsSourceView(!isSourceView)}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ml-1 ${
            isSourceView
              ? 'bg-[#1A1A2E] text-white shadow'
              : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
          }`}
          title="Toggle HTML Code Editor"
        >
          {isSourceView ? <Eye className="w-3.5 h-3.5" /> : <Code className="w-3.5 h-3.5" />}
          <span>{isSourceView ? 'Visual Editor' : 'HTML Code'}</span>
        </button>
      </div>

      {label && (
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          {label}
        </label>
      )}

      {/* Text editing area — toolbar stays outside this box */}
      <div className="border border-slate-300 rounded-2xl overflow-hidden bg-white shadow-sm">
      {/* Main Editing Workspace Area */}
      {isSourceView ? (
        <textarea
          rows={18}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="<p>Enter formatted HTML markup here...</p>"
          className="w-full bg-[#1A1A2E] text-teal-300 font-mono text-xs p-6 focus:outline-none leading-relaxed border-none rounded-b-2xl"
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onBlur={handleInput}
          suppressContentEditableWarning
          className="min-h-[380px] p-6 sm:p-8 text-[#1A1A2E] text-base leading-relaxed focus:outline-none space-y-4 prose prose-slate max-w-none prose-headings:font-extrabold prose-headings:text-[#1A1A2E] prose-a:text-[#0B5FA5] prose-img:rounded-2xl"
        />
      )}

      {/* Editor Status Footer */}
      <div className="bg-[#F8FAFC] border-t border-slate-200 px-4 py-2 flex items-center justify-between text-[11px] text-slate-500 font-medium rounded-b-2xl">
        <span>
          Word Processor Mode: <strong className="text-[#0B5FA5]">{isSourceView ? 'HTML Source' : 'Visual WYSIWYG (WordPress / Medium Style)'}</strong>
        </span>
        <span>
          Approx. Words: {value ? value.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length : 0}
        </span>
      </div>
      </div>

      {/* INSERT IMAGE MODAL */}
      {imageModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-[#1A1A2E] flex items-center space-x-2">
                <ImageIcon className="w-5 h-5 text-[#0B5FA5]" />
                <span>Insert Image Into Content</span>
              </h3>
              <button
                onClick={() => setImageModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Upload File or Select from Cloudinary Media Library */}
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setMediaLibraryOpen(true)}
                className="w-full py-2.5 bg-[#E3F2FD] hover:bg-[#0B5FA5] text-[#0B5FA5] hover:text-white font-extrabold text-xs rounded-xl border border-[#1E88E5]/30 transition-colors flex items-center justify-center space-x-2 cursor-pointer"
              >
                <ImageIcon className="w-4 h-4" />
                <span>Browse Cloudinary Media Library</span>
              </button>

              <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase">
                <hr className="flex-1 border-slate-200" />
                <span>OR</span>
                <hr className="flex-1 border-slate-200" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Upload Image File directly to Cloudinary
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileUpload}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-600 hover:file:text-white file:transition-colors file:cursor-pointer"
                />
                {uploadingImage && (
                  <p className="text-[11px] font-bold text-teal-600 mt-1 animate-pulse">
                    Uploading asset to Cloudinary CDN...
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase">
                <hr className="flex-1 border-slate-200" />
                <span>OR</span>
                <hr className="flex-1 border-slate-200" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Option B: Image Web URL
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full bg-[#F8FAFC] border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800"
                />
              </div>

              {imageUrl && (
                <div className="aspect-video bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Image Alignment
                  </label>
                  <select
                    value={imageAlign}
                    onChange={(e) => setImageAlign(e.target.value as any)}
                    className="w-full bg-[#F8FAFC] border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                  >
                    <option value="center">Center (Standard)</option>
                    <option value="full">Full Width</option>
                    <option value="left">Float Left</option>
                    <option value="right">Float Right</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Alt Text (Accessibility)
                  </label>
                  <input
                    type="text"
                    value={imageAlt}
                    onChange={(e) => setImageAlt(e.target.value)}
                    placeholder="Describe image..."
                    className="w-full bg-[#F8FAFC] border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Optional Image Caption
                </label>
                <input
                  type="text"
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  placeholder="e.g., Figure 1: CMS 2026 Fee Schedule Breakdown"
                  className="w-full bg-[#F8FAFC] border border-slate-300 rounded-xl px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setImageModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertImage}
                disabled={!imageUrl}
                className="px-5 py-2 bg-[#0B5FA5] hover:bg-[#084A83] text-white text-xs font-bold rounded-xl disabled:opacity-50"
              >
                Insert Image into Article
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSERT LINK MODAL */}
      {linkModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-[#1A1A2E] flex items-center space-x-2">
                <LinkIcon className="w-5 h-5 text-[#0B5FA5]" />
                <span>Insert Hyperlink</span>
              </h3>
              <button
                onClick={() => setLinkModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Link Target URL
                </label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://www.cms.gov/newsroom/..."
                  className="w-full bg-[#F8FAFC] border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Anchor Text (Display Text)
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="e.g., Read Official CMS 2026 Guidelines"
                  className="w-full bg-[#F8FAFC] border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="linkTab"
                  checked={linkNewTab}
                  onChange={(e) => setLinkNewTab(e.target.checked)}
                  className="w-4 h-4 text-[#0B5FA5] rounded"
                />
                <label htmlFor="linkTab" className="text-xs font-medium text-slate-700">
                  Open link in new browser tab
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setLinkModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertLink}
                disabled={!linkUrl}
                className="px-5 py-2 bg-[#0B5FA5] hover:bg-[#084A83] text-white text-xs font-bold rounded-xl disabled:opacity-50"
              >
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MEDIA SELECTOR MODAL */}
      <MediaSelectorModal
        isOpen={mediaLibraryOpen}
        onClose={() => setMediaLibraryOpen(false)}
        selectedUrl={imageUrl}
        onSelectImage={(m) => {
          setImageUrl(m.url);
          if (m.alt) setImageAlt(m.alt);
          if (m.caption) setImageCaption(m.caption);
        }}
      />
    </div>
  );
};
