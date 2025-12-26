import { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

/**
 * MarkdownPreview - Komponen untuk render Markdown ke HTML
 * Digunakan baik oleh dosen (preview saat edit) maupun mahasiswa (baca materi)
 * 
 * PENTING: Komponen ini harus konsisten di kedua tampilan agar
 * dosen bisa melihat persis apa yang akan dilihat mahasiswa.
 */
const MarkdownPreview = ({ content, className = '' }) => {
  // Convert markdown to sanitized HTML
  const htmlContent = useMemo(() => {
    if (!content) return '';

    // Configure marked options
    marked.setOptions({
      breaks: true, // Convert \n to <br>
      gfm: true, // GitHub Flavored Markdown
      headerIds: true,
      mangle: false,
    });

    // Parse markdown to HTML
    const rawHtml = marked.parse(content);

    // Sanitize HTML to prevent XSS
    const cleanHtml = DOMPurify.sanitize(rawHtml, {
      ADD_TAGS: ['iframe'], // Allow iframes for video embeds
      ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'],
    });

    return cleanHtml;
  }, [content]);

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
        prose prose-slate max-w-none
        
        /* Headings */
        prose-headings:font-bold prose-headings:text-slate-900
        prose-h1:text-2xl prose-h1:mt-8 prose-h1:mb-4 prose-h1:pb-2 prose-h1:border-b prose-h1:border-slate-200
        prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3
        prose-h3:text-lg prose-h3:mt-5 prose-h3:mb-2
        prose-h4:text-base prose-h4:mt-4 prose-h4:mb-2
        
        /* Paragraphs & Text */
        prose-p:text-slate-700 prose-p:leading-relaxed prose-p:mb-4
        prose-strong:text-slate-900 prose-strong:font-semibold
        prose-em:text-slate-700
        
        /* Links */
        prose-a:text-blue-600 prose-a:font-medium prose-a:no-underline hover:prose-a:underline
        
        /* Lists */
        prose-ul:my-4 prose-ul:pl-6
        prose-ol:my-4 prose-ol:pl-6
        prose-li:text-slate-700 prose-li:mb-2
        
        /* Code */
        prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono
        prose-code:before:content-[''] prose-code:after:content-['']
        prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:rounded-xl prose-pre:p-4 prose-pre:overflow-x-auto prose-pre:my-6
        
        /* Blockquote */
        prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 
        prose-blockquote:px-4 prose-blockquote:py-3 prose-blockquote:rounded-r-lg prose-blockquote:italic
        prose-blockquote:text-slate-700 prose-blockquote:my-6 prose-blockquote:not-italic
        
        /* Images */
        prose-img:rounded-xl prose-img:shadow-md prose-img:my-6
        
        /* Tables */
        prose-table:border-collapse prose-table:w-full prose-table:my-6
        prose-th:bg-slate-100 prose-th:border prose-th:border-slate-200 prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:font-semibold
        prose-td:border prose-td:border-slate-200 prose-td:px-4 prose-td:py-2
        
        /* Horizontal Rule */
        prose-hr:border-slate-200 prose-hr:my-8
        
        ${className}
      `}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

export default MarkdownPreview;
