import {
  File,
  FileText,
  Image,
  Archive,
  ExternalLink,
  Github,
  Eye,
  Download,
} from 'lucide-react';

/**
 * FilePreviewCard - Component untuk menampilkan file yang dikumpulkan dengan UX yang lebih baik
 */
export function FilePreviewCard({ url }) {
  // Detect file type dari URL
  const getFileInfo = (fileUrl) => {
    if (!fileUrl) return { type: 'unknown', name: 'File', icon: File, color: 'slate' };

    const urlLower = fileUrl.toLowerCase();

    // Google Drive
    if (urlLower.includes('drive.google.com') || urlLower.includes('docs.google.com')) {
      const fileIdMatch = fileUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
      const fileId = fileIdMatch ? fileIdMatch[1] : null;
      return {
        type: 'google',
        name: 'Google Drive File',
        icon: FileText,
        color: 'blue',
        fileId,
        previewUrl: fileId ? `https://drive.google.com/file/d/${fileId}/preview` : null,
      };
    }

    // GitHub
    if (urlLower.includes('github.com')) {
      const repoMatch = fileUrl.match(/github\.com\/([^/]+\/[^/]+)/);
      return {
        type: 'github',
        name: repoMatch ? repoMatch[1] : 'GitHub Repository',
        icon: Github,
        color: 'gray',
      };
    }

    // PDF
    if (urlLower.endsWith('.pdf')) {
      const fileName = fileUrl.split('/').pop() || 'Document.pdf';
      return { type: 'pdf', name: fileName, icon: FileText, color: 'red', previewUrl: fileUrl };
    }

    // Images
    if (urlLower.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      const fileName = fileUrl.split('/').pop() || 'Image';
      return { type: 'image', name: fileName, icon: Image, color: 'green', previewUrl: fileUrl };
    }

    // Archives
    if (urlLower.match(/\.(zip|rar|7z|tar|gz)$/)) {
      const fileName = fileUrl.split('/').pop() || 'Archive';
      return { type: 'archive', name: fileName, icon: Archive, color: 'amber' };
    }

    // Word documents
    if (urlLower.match(/\.(doc|docx)$/)) {
      const fileName = fileUrl.split('/').pop() || 'Document';
      return { type: 'word', name: fileName, icon: FileText, color: 'blue' };
    }

    // PowerPoint
    if (urlLower.match(/\.(ppt|pptx)$/)) {
      const fileName = fileUrl.split('/').pop() || 'Presentation';
      return { type: 'ppt', name: fileName, icon: FileText, color: 'orange' };
    }

    // Default link
    try {
      const urlObj = new URL(fileUrl);
      return { type: 'link', name: urlObj.hostname, icon: ExternalLink, color: 'violet' };
    } catch {
      return { type: 'link', name: 'External Link', icon: ExternalLink, color: 'violet' };
    }
  };

  const fileInfo = getFileInfo(url);
  const IconComponent = fileInfo.icon;

  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    violet: 'bg-violet-50 border-violet-200 text-violet-700',
    gray: 'bg-slate-50 border-slate-200 text-slate-700',
    slate: 'bg-slate-50 border-slate-200 text-slate-700',
  };

  const iconBgClasses = {
    blue: 'bg-blue-100 text-blue-600',
    red: 'bg-red-100 text-red-600',
    green: 'bg-green-100 text-green-600',
    amber: 'bg-amber-100 text-amber-600',
    orange: 'bg-orange-100 text-orange-600',
    violet: 'bg-violet-100 text-violet-600',
    gray: 'bg-slate-100 text-slate-600',
    slate: 'bg-slate-100 text-slate-600',
  };

  // Download handler with token for internal files, or open for external links
  const handleDownload = (e, mode = 'download') => {
    if (e) e.preventDefault();
    const token = localStorage.getItem('token');

    const isExternal =
      fileInfo.type === 'google' || fileInfo.type === 'github' || fileInfo.type === 'link';
    if (isExternal) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    const internalHosts = ['localhost', '127.0.0.1', 'backend', window.location.hostname];
    try {
      const parsed = new URL(url);
      const isInternalHost = internalHosts.some(
        (h) => parsed.hostname === h || parsed.hostname.startsWith(h)
      );
      if (isInternalHost && parsed.pathname.startsWith('/uploads/')) {
        if (mode === 'download') {
          const link = document.createElement('a');
          link.href = `${parsed.pathname}?token=${encodeURIComponent(token)}`;
          link.download = fileInfo.name || 'file';
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          link.remove();
        } else {
          window.open(
            `${parsed.pathname}?token=${encodeURIComponent(token)}`,
            '_blank',
            'noopener,noreferrer'
          );
        }
        return;
      }
    } catch {
      // Bukan URL absolut
    }

    if (url.startsWith('/uploads/')) {
      const separator = url.includes('?') ? '&' : '?';
      const targetUrl = `${url}${separator}token=${encodeURIComponent(token)}`;
      if (mode === 'download') {
        const link = document.createElement('a');
        link.href = targetUrl;
        link.download = fileInfo.name || 'file';
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`rounded-lg border ${colorClasses[fileInfo.color]} overflow-hidden`}>
      <div className="p-3 flex items-center gap-3">
        {/* Icon */}
        <div
          className={`shrink-0 w-10 h-10 rounded-lg ${iconBgClasses[fileInfo.color]} flex items-center justify-center`}
        >
          <IconComponent size={20} />
        </div>
        {/* File Name & Type */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{fileInfo.name}</p>
          <p className="text-xs opacity-70 capitalize">
            {fileInfo.type === 'google' ? 'Google Drive' : fileInfo.type}
          </p>
        </div>
        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => handleDownload(e, 'preview')}
            className="p-2 rounded-lg hover:bg-white/50 transition text-slate-500 hover:text-slate-700"
            title="Buka / Preview"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={(e) => handleDownload(e, 'download')}
            className="p-2 rounded-lg hover:bg-white/50 transition text-slate-500 hover:text-slate-700"
            title={
              fileInfo.type === 'link' || fileInfo.type === 'google'
                ? 'Buka Link'
                : 'Download File'
            }
          >
            <Download size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
