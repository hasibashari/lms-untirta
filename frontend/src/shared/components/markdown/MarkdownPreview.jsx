import React, { useMemo, useState, useCallback, useId } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ReactPlayer from 'react-player';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

/**
 * MarkdownPreview - Komponen Render Materi Pembelajaran Premium
 * Dioptimalkan untuk keterbacaan tinggi dan estetika modern layaknya LMS Internasional.
 */
// Sub-component for code blocks to follow React Hook rules
const CodeBlock = ({ inline, className, children, handleCopy, copiedId, isForum, ...props }) => {
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const codeString = String(children).replace(/\n$/, '');
  const codeId = useId();

  if (!inline && match) {
    return (
      <div className={`rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-[#282c34] group/code ${isForum ? 'my-6' : 'my-10'}`}>
        <div className="bg-[#21252b] px-4 py-2 flex items-center justify-between border-b border-white/5">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></div>
            <span className="ml-3 text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest leading-none self-center">
              {language}
            </span>
          </div>
          <button
            onClick={() => handleCopy(codeString, codeId)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-all bg-white/5 hover:bg-white/10 px-2 py-1 rounded-lg text-[10px] font-medium"
          >
            {copiedId === codeId ? (
              <>
                <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                <span className="text-green-400">Tersalin!</span>
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                <span>Salin</span>
              </>
            )}
          </button>
        </div>
        <SyntaxHighlighter
          style={oneDark}
          language={language}
          PreTag="div"
          customStyle={{
            margin: 0,
            padding: isForum ? '1rem' : '1.5rem',
            fontSize: isForum ? '0.8rem' : '0.9rem',
            lineHeight: '1.7',
            background: 'transparent',
          }}
          {...props}
        >
          {codeString}
        </SyntaxHighlighter>
      </div>
    );
  }

  return (
    <code
      className="px-2 py-0.5 rounded-md bg-slate-100 text-primary font-mono text-[0.85em] border border-slate-200 font-bold"
      {...props}
    >
      {children}
    </code>
  );
};

// Fungsi untuk mengubah link YouTube biasa menjadi link Embed (Lebih stabil)
const getYoutubeEmbed = (url) => {
  if (!url) return null;
  let videoId = '';
  const v = url.trim();

  try {
    if (v.includes('youtu.be/')) {
      videoId = v.split('youtu.be/')[1].split(/[?#]/)[0];
    } else if (v.includes('youtube.com/watch')) {
      const urlObj = new URL(v);
      videoId = urlObj.searchParams.get('v');
    } else if (v.includes('youtube.com/embed/')) {
      videoId = v.split('youtube.com/embed/')[1].split(/[?#]/)[0];
    }
  } catch {
    return null;
  }

  return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0` : null;
};

const isVideoUrl = (url) => {
  if (!url) return false;
  const v = url.trim().toLowerCase();
  return v.includes('youtube.com') || v.includes('youtu.be') || v.includes('vimeo.com') || ReactPlayer.canPlay(url);
};

const VideoRenderer = ({ url, isForum }) => {
  const embedUrl = getYoutubeEmbed(url);

  return (
    <div className={`w-full block clear-both ${isForum ? 'my-6' : 'my-10'}`}>
      <div className={`relative w-full overflow-hidden rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border-4 border-white bg-black`} style={{ paddingTop: '56.25%' }}>
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
            style={{ position: 'absolute', top: 0, left: 0 }}
          />
        )}
      </div>
      <p className="text-center text-[10px] text-slate-400 mt-3 font-medium tracking-wide uppercase">Materi Video</p>
    </div>
  );
};

const MarkdownPreview = ({ content, className = '', variant = 'default' }) => {
  const isForum = variant === 'forum';

  // State untuk feedback visual saat menyalin kode
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = useCallback((text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const components = useMemo(() => ({
    // PARAGRAPH: Deteksi Video URL otomatis
    p: ({ children, ...props }) => {
      const childrenArray = React.Children.toArray(children);
      const textContent = childrenArray
        .map(c => typeof c === 'string' ? c : '')
        .join('')
        .trim();

      if (isVideoUrl(textContent) && childrenArray.length === 1) {
        return <VideoRenderer url={textContent} isForum={isForum} />;
      }

      return (
        <p 
          {...props} 
          className={`
            leading-[1.7] text-slate-700 selection:bg-primary/10
            ${isForum ? 'mb-4 text-sm' : 'mb-6 text-lg'}
          `}
        >
          {children}
        </p>
      );
    },

    h1: ({ children }) => (
      <h1 className={`${isForum ? 'text-xl mb-4 mt-6' : 'text-4xl mb-6 mt-12'} font-extrabold text-slate-900 pb-4 border-b-2 border-slate-100 tracking-tight`}>
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className={`${isForum ? 'text-lg mb-3 mt-5' : 'text-3xl mb-5 mt-10'} font-bold text-slate-800 flex items-center gap-3`}>
        {!isForum && <span className="w-2 h-8 bg-primary rounded-full hidden md:block"></span>}
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className={`${isForum ? 'text-base mb-2 mt-4' : 'text-xl mb-4 mt-8'} font-bold text-slate-800`}>
        {children}
      </h3>
    ),

    a: ({ href, children, ...props }) => {
      const isVideo = isVideoUrl(href);
      const childrenArray = React.Children.toArray(children);
      const linkText = typeof childrenArray[0] === 'string' ? childrenArray[0].trim() : '';
      const isPlainLink = isVideo && (linkText === href.trim() || linkText === '');

      if (isPlainLink) {
        return <VideoRenderer url={href} isForum={isForum} />;
      }

      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary font-semibold underline decoration-primary/30 decoration-2 underline-offset-4 hover:decoration-primary transition-all"
          {...props}
        >
          {children}
        </a>
      );
    },

    blockquote: ({ children }) => (
      <div className={`my-6 p-4 bg-linear-to-br from-blue-50 to-indigo-50 border-l-4 border-primary rounded-xl shadow-sm relative overflow-hidden group`}>
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-8C7.9 2 7 2.9 7 4s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 16c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm0-8c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm0-8c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z" />
          </svg>
        </div>
        <div className="flex gap-3">
          <div className="shrink-0 mt-0.5">
            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white shadow">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className={`italic text-slate-700 font-medium leading-relaxed ${isForum ? 'text-sm' : 'text-lg'}`}>
            {children}
          </div>
        </div>
      </div>
    ),

    code: (props) => <CodeBlock {...props} handleCopy={handleCopy} copiedId={copiedId} isForum={isForum} />
  }), [copiedId, handleCopy, isForum]);

  if (!content) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
        <svg className="w-12 h-12 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-slate-500 font-medium text-sm">Belum ada materi yang tersedia.</p>
      </div>
    );
  }

  return (
    <article
      className={`
        max-w-none prose prose-slate 
        [&_ul]:list-none [&_ul]:pl-0 [&_ul]:my-6
        [&_li]:relative [&_li]:pl-7 [&_li]:mb-3 [&_li]:text-slate-700
        [&_li]:before:content-[''] [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:top-[0.6em] 
        [&_li]:before:w-2 [&_li]:before:h-2 [&_li]:before:bg-primary/40 [&_li]:before:rounded-full
        [&_ol]:list-decimal [&_ol]:pl-8 [&_ol]:my-6 [&_ol]:text-slate-700
        [&_table]:w-full [&_table]:my-8 [&_table]:overflow-hidden [&_table]:rounded-2xl [&_table]:border-collapse [&_table]:shadow-sm
        [&_th]:bg-slate-50 [&_th]:text-slate-900 [&_th]:font-bold [&_th]:p-3 [&_th]:text-left [&_th]:border-b [&_th]:border-slate-200
        [&_td]:p-3 [&_td]:border-b [&_td]:border-slate-100 [&_td]:text-slate-600
        [&_tr:last-child_td]:border-b-0
        [&_img]:rounded-2xl [&_img]:shadow-xl [&_img]:my-8 [&_img]:mx-auto [&_img]:block [&_img]:border-4 [&_img]:border-white
        [&_hr]:border-slate-100 [&_hr]:my-12 [&_hr]:border-t-2
        ${isForum ? '[&_li]:text-sm [&_ol]:text-sm' : '[&_li]:text-lg [&_ol]:text-lg'}
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