import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ReactPlayer from 'react-player';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

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
              loading="lazy"
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
    },

    code({ inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';

      if (!inline && match) {
        return (
          <div className="rounded-xl overflow-hidden my-8 border border-slate-800 shadow-2xl bg-[#282c34] group">
            <div className="bg-[#21252b] px-4 py-2 flex items-center justify-between border-b border-white/5">
              <span className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-widest leading-none">
                {language}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(String(children));
                  // Could add a temporary "Copied!" state here if we had state in this subcomponent
                }}
                className="text-slate-500 hover:text-slate-300 transition-colors"
                title="Salin Kode"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
              </button>
            </div>
            <SyntaxHighlighter
              style={oneDark}
              language={language}
              PreTag="div"
              customStyle={{
                margin: 0,
                padding: '1.25rem',
                fontSize: '0.875rem',
                lineHeight: '1.6',
                background: 'transparent',
              }}
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          </div>
        );
      }

      return (
        <code
          className={`${className} px-1.5 py-0.5 rounded bg-slate-100 text-pink-600 font-mono text-[0.9em] border border-slate-200`}
          {...props}
        >
          {children}
        </code>
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
        [&_code]:font-mono
        [&_pre]:bg-transparent [&_pre]:p-0 [&_pre]:my-0
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
