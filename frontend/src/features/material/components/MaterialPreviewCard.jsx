import React from 'react';
import { Eye, Hash, Calendar, FileText, Paperclip, DownloadCloud } from 'lucide-react';
import MarkdownPreview from '@/shared/components/markdown/MarkdownPreview';

export default function MaterialPreviewCard({ title, content, order, file, fileUrl, showInfoBanner = false }) {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const getFileName = () => {
    if (file) return file.name;
    if (fileUrl) {
      return decodeURIComponent(fileUrl.split('/').pop()).replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/, '');
    }
    return 'Dokumen Materi';
  };

  return (
    <div className="max-w-4xl mx-auto w-full">
      {/* Preview Header Info */}
      {showInfoBanner && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
          <Eye size={18} className="text-amber-600" />
          <p className="text-sm text-amber-700">
            <strong>Mode Preview:</strong> Tampilan ini sama persis dengan yang akan dilihat mahasiswa
          </p>
        </div>
      )}

      {/* Material Card */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden text-left">
        {/* Header Section */}
        <div className="bg-linear-to-r from-blue-600 to-blue-700 px-8 py-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {order && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/20 rounded-full text-xs font-medium mb-3">
                  <Hash size={12} />
                  Materi {order}
                </span>
              )}
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                {title || 'Judul Materi'}
              </h1>
              <div className="flex items-center gap-4 text-blue-100 text-sm">
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  {currentDate}
                </span>
                <span className="flex items-center gap-1.5">
                  <FileText size={14} />
                  {content ? `${content.split(' ').length} kata` : '0 kata'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8">
          {/* Konten Markdown */}
          <div className="mb-8">
            {content ? (
              <div className="prose prose-slate max-w-none">
                <MarkdownPreview content={content} />
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <FileText size={48} className="mx-auto mb-3 opacity-50" />
                <p className="text-lg">Belum ada konten</p>
                <p className="text-sm">Materi ini belum memiliki teks konten.</p>
              </div>
            )}
          </div>

          {/* Attachment Preview */}
          {(file || fileUrl) && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Paperclip size={20} className="text-slate-400" />
                Lampiran Utama Materi
              </h3>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                    <FileText size={24} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium text-slate-900 truncate max-w-[200px] sm:max-w-xs" title={getFileName()}>
                      {getFileName()}
                    </p>
                    <p className="text-xs text-slate-500">Klik unduh untuk membuka file</p>
                  </div>
                </div>
                {fileUrl ? (
                  <a 
                    href={fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    download
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-sm whitespace-nowrap"
                  >
                    <DownloadCloud size={16} />
                    Download File
                  </a>
                ) : (
                  <button 
                    disabled
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-400 bg-white border border-slate-200 rounded-lg cursor-not-allowed whitespace-nowrap"
                  >
                    <DownloadCloud size={16} />
                    File Baru (Simulasi)
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
