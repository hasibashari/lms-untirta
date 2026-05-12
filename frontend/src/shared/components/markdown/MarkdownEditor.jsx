import { useState, useCallback, useEffect, useRef } from 'react';
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
  Video,
  Code2,
  Edit3,
  HelpCircle,
  Maximize2,
  Minimize2,
  Type,
  Link2,
  RotateCcw,
  RotateCw,
} from 'lucide-react';

/**
 * MarkdownEditor - Editor Markdown Premium
 * Fokus pada pengalaman menulis yang superior dengan toolbar lengkap dan shortcut.
 * Mendukung Undo (Ctrl+Z) dan Redo (Ctrl+Y/Ctrl+Shift+Z).
 */
const MarkdownEditor = ({
  value = '',
  onChange,
  placeholder = 'Tulis konten di sini...',
  minHeight = 400,
  disabled = false,
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [historyInfo, setHistoryInfo] = useState({ index: 0, length: 1 });
  const textareaRef = useRef(null);
  
  // History for Undo/Redo
  const historyRef = useRef({
    stack: [value],
    index: 0,
  });

  // Push to history
  const pushHistory = useCallback((newValue) => {
    const { stack, index } = historyRef.current;
    if (newValue === stack[index]) return;

    const newStack = stack.slice(0, index + 1);
    newStack.push(newValue);
    
    // Limit stack size
    if (newStack.length > 50) newStack.shift();
    
    historyRef.current = {
      stack: newStack,
      index: newStack.length - 1,
    };
    setHistoryInfo({ index: newStack.length - 1, length: newStack.length });
  }, []);

  // Undo function
  const handleUndo = useCallback(() => {
    const { stack, index } = historyRef.current;
    if (index > 0) {
      const newIndex = index - 1;
      const prevValue = stack[newIndex];
      historyRef.current.index = newIndex;
      onChange(prevValue);
      setHistoryInfo({ index: newIndex, length: stack.length });
    }
  }, [onChange]);

  // Redo function
  const handleRedo = useCallback(() => {
    const { stack, index } = historyRef.current;
    if (index < stack.length - 1) {
      const newIndex = index + 1;
      const nextValue = stack[newIndex];
      historyRef.current.index = newIndex;
      onChange(nextValue);
      setHistoryInfo({ index: newIndex, length: stack.length });
    }
  }, [onChange]);

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  };

  // Cleanup body overflow on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  // Insert markdown syntax at cursor position
  const insertMarkdown = useCallback((prefix, suffix = '', placeholderText = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || placeholderText;

    const newValue =
      value.substring(0, start) +
      prefix +
      selectedText +
      suffix +
      value.substring(end);

    onChange(newValue);
    pushHistory(newValue);

    // Set cursor position after insert
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [value, onChange, pushHistory]);

  // Handle value changes from typing
  useEffect(() => {
    const timer = setTimeout(() => {
      pushHistory(value);
    }, 500);
    return () => clearTimeout(timer);
  }, [value, pushHistory]);

  // Toolbar action groups
  const executeAction = useCallback((actionId) => {
    switch (actionId) {
      case 'undo': handleUndo(); break;
      case 'redo': handleRedo(); break;
      case 'bold': insertMarkdown('**', '**', 'teks tebal'); break;
      case 'italic': insertMarkdown('*', '*', 'teks miring'); break;
      case 'h1': insertMarkdown('\n# ', '\n', 'Judul Utama'); break;
      case 'h2': insertMarkdown('\n## ', '\n', 'Sub Judul'); break;
      case 'h3': insertMarkdown('\n### ', '\n', 'Judul Kecil'); break;
      case 'ul': insertMarkdown('\n- ', '\n', 'Item poin'); break;
      case 'ol': insertMarkdown('\n1. ', '\n', 'Item angka'); break;
      case 'quote': insertMarkdown('\n> ', '\n', 'Kutipan teks'); break;
      case 'link': insertMarkdown('[', '](url)', 'teks tautan'); break;
      case 'image': insertMarkdown('![', '](url)', 'deskripsi gambar'); break;
      case 'youtube': insertMarkdown('\nhttps://www.youtube.com/watch?v=', '\n', 'VIDEO_ID'); break;
      case 'code-inline': insertMarkdown('`', '`', 'kode'); break;
      case 'code-block': insertMarkdown('\n```javascript\n', '\n```\n', '// tulis kode di sini'); break;
      default: break;
    }
  }, [handleUndo, handleRedo, insertMarkdown]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && !disabled) {
        const key = e.key.toLowerCase();
        if (key === 'z') {
          e.preventDefault();
          if (e.shiftKey) executeAction('redo');
          else executeAction('undo');
        } else if (key === 'y') {
          e.preventDefault();
          executeAction('redo');
        } else if (key === 'b') {
          e.preventDefault();
          executeAction('bold');
        } else if (key === 'i') {
          e.preventDefault();
          executeAction('italic');
        } else if (key === 'k') {
          e.preventDefault();
          executeAction('link');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [executeAction, disabled]);

  const groups = [
    {
      name: 'History',
      actions: [
        { id: 'undo', icon: RotateCcw, label: 'Urungkan (Ctrl+Z)', disabled: historyInfo.index === 0 },
        { id: 'redo', icon: RotateCw, label: 'Ulangi (Ctrl+Y)', disabled: historyInfo.index >= historyInfo.length - 1 },
      ]
    },
    {
      name: 'Text',
      actions: [
        { id: 'bold', icon: Bold, label: 'Tebal (Ctrl+B)' },
        { id: 'italic', icon: Italic, label: 'Miring (Ctrl+I)' },
      ]
    },
    {
      name: 'Headers',
      actions: [
        { id: 'h1', icon: Heading1, label: 'Judul Utama' },
        { id: 'h2', icon: Heading2, label: 'Sub Judul' },
        { id: 'h3', icon: Heading3, label: 'Judul Kecil' },
      ]
    },
    {
      name: 'Lists',
      actions: [
        { id: 'ul', icon: List, label: 'Daftar Poin' },
        { id: 'ol', icon: ListOrdered, label: 'Daftar Angka' },
        { id: 'quote', icon: Quote, label: 'Kutipan' },
      ]
    },
    {
      name: 'Media',
      actions: [
        { id: 'link', icon: LinkIcon, label: 'Tautan (Ctrl+K)' },
        { id: 'image', icon: Image, label: 'Gambar' },
        { id: 'youtube', icon: Video, label: 'Video YouTube' },
      ]
    },
    {
      name: 'Code',
      actions: [
        { id: 'code-inline', icon: Code, label: 'Kode Baris' },
        { id: 'code-block', icon: Code2, label: 'Blok Kode' },
      ]
    }
  ];

  const containerClasses = isFullscreen
    ? 'fixed inset-0 z-[100] flex flex-col bg-white'
    : 'border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm transition-shadow hover:shadow-md';

  return (
    <div className={containerClasses}>
      {/* Editor Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 backdrop-blur-sm px-4 py-2">
        <div className="flex items-center gap-2">
          <Edit3 size={16} className="text-blue-600" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Editor Markdown</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            className={`p-2 rounded-lg transition ${
              showHelp ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:bg-slate-200'
            }`}
            title="Bantuan Markdown"
          >
            <HelpCircle size={18} />
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg transition"
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>

      {/* Help Panel */}
      {showHelp && (
        <div className="p-4 bg-blue-50/50 border-b border-blue-100 text-[13px] animate-in slide-in-from-top duration-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-blue-900 flex items-center gap-2">
              <HelpCircle size={14} />
              Panduan Cepat Markdown
            </h4>
            <button 
              onClick={() => setShowHelp(false)} 
              className="text-blue-400 hover:text-blue-600 p-1"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-blue-800">
            <div className="space-y-1">
              <p><code className="bg-blue-100 px-1 rounded font-bold">**Teks**</code> → <b>Tebal</b></p>
              <p><code className="bg-blue-100 px-1 rounded font-bold">*Teks*</code> → <i>Miring</i></p>
            </div>
            <div className="space-y-1">
              <p><code className="bg-blue-100 px-1 rounded font-bold"># Judul</code> → Heading 1</p>
              <p><code className="bg-blue-100 px-1 rounded font-bold">## Judul</code> → Heading 2</p>
            </div>
            <div className="space-y-1">
              <p><code className="bg-blue-100 px-1 rounded font-bold">- Item</code> → Daftar Poin</p>
              <p><code className="bg-blue-100 px-1 rounded font-bold">1. Item</code> → Daftar Angka</p>
            </div>
            <div className="space-y-1">
              <p><code className="bg-blue-100 px-1 rounded font-bold">[Teks](url)</code> → Link</p>
              <p><code className="bg-blue-100 px-1 rounded font-bold">&gt; Teks</code> → Kutipan</p>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b border-slate-100 bg-white overflow-x-auto no-scrollbar">
        {groups.map((group) => (
          <div key={group.name} className="flex items-center">
            {group.actions.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => executeAction(item.id)}
                  disabled={disabled || item.disabled}
                  className={`p-2 rounded-lg transition-colors group relative ${
                    item.disabled 
                      ? 'text-slate-200 cursor-not-allowed' 
                      : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                  title={item.label}
                >
                  <Icon size={18} />
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    {item.label}
                  </span>
                </button>
              );
            })}
            <div className="w-px h-6 bg-slate-200 mx-1 shrink-0" />
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grow relative" style={{ minHeight: isFullscreen ? '0' : minHeight }}>
        <textarea
          ref={textareaRef}
          id="markdown-editor"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full h-full p-6 text-slate-700 placeholder-slate-400 resize-none focus:outline-none font-mono text-[14px] leading-relaxed bg-white selection:bg-blue-100 ${
            isFullscreen ? 'absolute inset-0' : ''
          }`}
          style={{ minHeight: isFullscreen ? '100%' : minHeight }}
        />
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 bg-slate-50 text-[10px] font-medium text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Type size={12} />
            {value.length} Karakter
          </span>
          <span className="flex items-center gap-1">
            <Link2 size={12} />
            {value.split(/\s+/).filter(Boolean).length} Kata
          </span>
        </div>
        <div className="flex items-center gap-2">
          {disabled ? (
            <span className="text-amber-500 italic">Editor Terkunci</span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-500">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Siap Menulis
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarkdownEditor;