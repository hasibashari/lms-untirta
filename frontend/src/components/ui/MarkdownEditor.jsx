import { useState, useCallback } from 'react';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Image,
  Eye,
  Edit3,
  HelpCircle,
} from 'lucide-react';
import MarkdownPreview from './MarkdownPreview';

/**
 * MarkdownEditor - Editor Markdown dengan Preview
 * Mendukung toolbar untuk formatting dan live preview
 */
const MarkdownEditor = ({
  value = '',
  onChange,
  placeholder = 'Tulis konten materi di sini...',
  minHeight = 400,
}) => {
  const [activeTab, setActiveTab] = useState('write'); // 'write' | 'preview'
  const [showHelp, setShowHelp] = useState(false);

  // Insert markdown syntax at cursor position
  const insertMarkdown = useCallback((prefix, suffix = '', placeholder = '') => {
    const textarea = document.getElementById('markdown-editor');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || placeholder;

    const newValue =
      value.substring(0, start) +
      prefix +
      selectedText +
      suffix +
      value.substring(end);

    onChange(newValue);

    // Set cursor position after insert
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [value, onChange]);

  // Toolbar actions
  const toolbarActions = [
    { icon: Bold, label: 'Bold', action: () => insertMarkdown('**', '**', 'teks tebal') },
    { icon: Italic, label: 'Italic', action: () => insertMarkdown('*', '*', 'teks miring') },
    { type: 'divider' },
    { icon: Heading1, label: 'Heading 1', action: () => insertMarkdown('\n# ', '\n', 'Judul 1') },
    { icon: Heading2, label: 'Heading 2', action: () => insertMarkdown('\n## ', '\n', 'Judul 2') },
    { icon: Heading3, label: 'Heading 3', action: () => insertMarkdown('\n### ', '\n', 'Judul 3') },
    { type: 'divider' },
    { icon: List, label: 'Bullet List', action: () => insertMarkdown('\n- ', '\n', 'Item list') },
    { icon: ListOrdered, label: 'Numbered List', action: () => insertMarkdown('\n1. ', '\n', 'Item list') },
    { icon: Quote, label: 'Quote', action: () => insertMarkdown('\n> ', '\n', 'Kutipan') },
    { type: 'divider' },
    { icon: Code, label: 'Code', action: () => insertMarkdown('`', '`', 'kode') },
    { icon: LinkIcon, label: 'Link', action: () => insertMarkdown('[', '](url)', 'teks link') },
    { icon: Image, label: 'Image', action: () => insertMarkdown('![', '](url)', 'alt text') },
  ];

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
      {/* Tab Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50">
        <div className="flex">
          <button
            type="button"
            onClick={() => setActiveTab('write')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition border-b-2 -mb-px ${activeTab === 'write'
              ? 'text-blue-600 border-blue-600 bg-white'
              : 'text-slate-500 border-transparent hover:text-slate-700'
              }`}
          >
            <Edit3 size={16} />
            Tulis
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition border-b-2 -mb-px ${activeTab === 'preview'
              ? 'text-blue-600 border-blue-600 bg-white'
              : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-blue-50'
              }`}
          >
            <Eye size={16} />
            Preview
            {activeTab === 'write' && value && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-600 rounded animate-pulse">
                LIHAT
              </span>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowHelp(!showHelp)}
          className="mr-3 p-2 text-slate-400 hover:text-slate-600 transition"
          title="Panduan Markdown"
        >
          <HelpCircle size={18} />
        </button>
      </div>

      {/* Help Panel */}
      {showHelp && (
        <div className="p-4 bg-blue-50 border-b border-blue-100 text-sm">
          <h4 className="font-semibold text-blue-900 mb-2">Panduan Markdown</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-blue-800">
            <div><code className="bg-blue-100 px-1 rounded">**teks**</code> → <strong>Bold</strong></div>
            <div><code className="bg-blue-100 px-1 rounded">*teks*</code> → <em>Italic</em></div>
            <div><code className="bg-blue-100 px-1 rounded"># Judul</code> → Heading</div>
            <div><code className="bg-blue-100 px-1 rounded">- item</code> → Bullet list</div>
            <div><code className="bg-blue-100 px-1 rounded">1. item</code> → Numbered list</div>
            <div><code className="bg-blue-100 px-1 rounded">`kode`</code> → <code>Inline code</code></div>
            <div><code className="bg-blue-100 px-1 rounded">[teks](url)</code> → Link</div>
            <div><code className="bg-blue-100 px-1 rounded">![alt](url)</code> → Image</div>
            <div><code className="bg-blue-100 px-1 rounded">&gt; teks</code> → Blockquote</div>
          </div>
        </div>
      )}

      {/* Toolbar (only in write mode) */}
      {activeTab === 'write' && (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-slate-100 bg-white">
          {toolbarActions.map((item, index) => {
            if (item.type === 'divider') {
              return <div key={index} className="w-px h-6 bg-slate-200 mx-1" />;
            }

            const Icon = item.icon;
            return (
              <button
                key={index}
                type="button"
                onClick={item.action}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition"
                title={item.label}
              >
                <Icon size={18} />
              </button>
            );
          })}
        </div>
      )}

      {/* Editor / Preview Area */}
      <div style={{ minHeight }}>
        {activeTab === 'write' ? (
          <textarea
            id="markdown-editor"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-full p-6 text-slate-700 placeholder-slate-400 resize-none focus:outline-none font-mono text-sm leading-relaxed"
            style={{ minHeight }}
          />
        ) : (
          <div className="p-6" style={{ minHeight }}>
            {value ? (
              <MarkdownPreview content={value} />
            ) : (
              <p className="text-slate-400 italic">Belum ada konten untuk di-preview.</p>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 bg-slate-50 text-xs text-slate-500">
        <span>Mendukung format Markdown</span>
        <span>{value.length} karakter</span>
      </div>
    </div>
  );
};

export default MarkdownEditor;
