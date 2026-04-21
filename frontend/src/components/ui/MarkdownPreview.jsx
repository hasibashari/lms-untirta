import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ReactPlayer from 'react-player';

/**
 * MarkdownPreview - Komponen untuk render Markdown ke HTML
 * Digunakan baik oleh dosen (preview saat edit) maupun mahasiswa (baca materi)
 * 
 * Menggunakan react-markdown untuk konsistensi dengan Tailwind prose
 */
const MarkdownPreview = ({ content, className = '' }) => {
  // Fungsi untuk mengubah link YouTube biasa menjadi link Embed
  const getYoutubeEmbed = (url) => {
    if (!url) return null;
    let videoId = '';
    const v = url.trim();
    
    if (v.includes('youtu.be/')) {
      videoId = v.split('youtu.be/')[1].split(/[?#]/)[0];
    } else if (v.includes('youtube.com/watch')) {
      const urlObj = new URL(v);
      videoId = urlObj.searchParams.get('v');
    } else if (v.includes('youtube.com/embed/')) {
      videoId = v.split('youtube.com/embed/')[1].split(/[?#]/)[0];
    }
    
    return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0` : null;
  };

  const isVideoUrl = (url) => {
    if (!url) return false;
    const v = url.trim().toLowerCase();
    return v.includes('youtube.com') || v.includes('youtu.be') || v.includes('vimeo.com') || ReactPlayer.canPlay(url);
  };

  const VideoRenderer = ({ url }) => {
    const embedUrl = getYoutubeEmbed(url);
    
    return (
      <div className="my-8 w-full block clear-both">
        <div className="relative w-full overflow-hidden rounded-2xl shadow-xl border bg-black" style={{ paddingTop: '56.25%' }}>
          {embedUrl ? (
            <iframe
              src={embedUrl}
              className="absolute top-0 left-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              title="Video Player"
            />
          ) : (
            <ReactPlayer
              url={url}
              width="100%"
              height="100%"
              controls
              style={{ position: 'absolute', top: 0, left: 0, zIndex: 10 }}
            />
          )}
        </div>
      </div>
    );
  };

  const components = useMemo(() => ({
    p: ({ node, children, ...props }) => {
      const childrenArray = React.Children.toArray(children);
      const textContent = childrenArray
        .map(c => typeof c === 'string' ? c : '')
        .join('')
        .trim();

      if (isVideoUrl(textContent)) {
        return <VideoRenderer url={textContent} />;
      }

      const realNodes = node.children.filter(n => !(n.type === 'text' && !n.value.trim()));
      const isVideoLink = realNodes.length === 1 && 
                         realNodes[0].tagName === 'a' && 
                         isVideoUrl(realNodes[0].properties?.href);

      if (isVideoLink) {
        return <VideoRenderer url={realNodes[0].properties?.href} />;
      }
      
      return <p {...props} className="mb-4 leading-relaxed text-slate-700">{children}</p>;
    },

    a: ({ href, children, ...props }) => {
      const isVideo = isVideoUrl(href);
      const childrenArray = React.Children.toArray(children);
      const linkText = typeof childrenArray[0] === 'string' ? childrenArray[0] : '';
      
      const isPlainLink = isVideo && (
        linkText.trim() === href.trim() || 
        linkText.toLowerCase().includes('youtube') || 
        linkText.toLowerCase().includes('youtu.be')
      );

      if (isPlainLink) {
        return <VideoRenderer url={href} />;
      }
      
      return (
        <a 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-primary hover:underline font-medium break-all"
          {...props}
        >
          {children}
        </a>
      );
    }
  }), []);

  if (!content) {
    return (
      <div className="text-slate-400 italic">
        Tidak ada konten.
      </div>
    );
  }

  return (
    <article
      className={`
        max-w-none
        [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-slate-900 [&_h1]:mt-8 [&_h1]:mb-4 [&_h1]:pb-3 [&_h1]:border-b [&_h1]:border-slate-200
        [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mt-7 [&_h2]:mb-3
        [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-slate-900 [&_h3]:mt-6 [&_h3]:mb-2
        [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:text-slate-900 [&_h4]:mt-5 [&_h4]:mb-2
        [&_h5]:text-base [&_h5]:font-medium [&_h5]:text-slate-900 [&_h5]:mt-4 [&_h5]:mb-2
        [&_h6]:text-sm [&_h6]:font-medium [&_h6]:text-slate-900 [&_h6]:mt-4 [&_h6]:mb-2 [&_h6]:uppercase [&_h6]:tracking-wide
        [&_p]:text-slate-700 [&_p]:leading-relaxed [&_p]:mb-4 [&_p]:text-base
        [&_strong]:text-slate-900 [&_strong]:font-semibold
        [&_em]:text-slate-700
        [&_a]:text-blue-600 [&_a]:font-medium [&_a]:no-underline hover:[&_a]:underline
        [&_ul]:list-disc [&_ul]:my-4 [&_ul]:pl-6
        [&_ol]:list-decimal [&_ol]:my-4 [&_ol]:pl-6
        [&_li]:text-slate-700 [&_li]:mb-2
        [&_code]:text-blue-600 [&_code]:bg-blue-50 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono
        [&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:rounded-xl [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:my-6
        [&_blockquote]:border-l-4 [&_blockquote]:border-blue-500 [&_blockquote]:bg-blue-50 [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:rounded-r-lg [&_blockquote]:text-slate-700 [&_blockquote]:my-6 [&_blockquote]:not-italic
        [&_img]:rounded-xl [&_img]:shadow-md [&_img]:my-6
        [&_table]:border-collapse [&_table]:w-full [&_table]:my-6
        [&_th]:bg-slate-100 [&_th]:border [&_th]:border-slate-200 [&_th]:px-4 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold
        [&_td]:border [&_td]:border-slate-200 [&_td]:px-4 [&_td]:py-2
        [&_hr]:border-slate-200 [&_hr]:my-8
        ${className}
      `}
    >
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {String(content || '')}
      </ReactMarkdown>
    </article>
  );
};

export default MarkdownPreview;
