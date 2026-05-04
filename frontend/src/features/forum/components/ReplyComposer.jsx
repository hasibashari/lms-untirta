import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

/**
 * ReplyComposer — Input area untuk menulis balasan di thread detail.
 */
/**
 * ReplyComposer — Input area untuk menulis balasan di thread detail.
 */
export default function ReplyComposer({ onSubmit, onCancel, disabled = false, compact = false }) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!content.trim() || sending) return;

    setSending(true);
    try {
      await onSubmit(content.trim());
      setContent('');
    } finally {
      setSending(false);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className={`
        ${compact ? 'p-3 bg-muted/10 border rounded-xl' : 'p-4 sm:p-5 border-t border-border bg-muted/20'}
      `}
    >
      <div className="flex gap-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={compact ? "Tulis balasan..." : "Tulis balasan Anda..."}
          rows={compact ? 2 : 3}
          disabled={disabled || sending}
          className="flex-1 px-4 py-3 border border-border rounded-xl bg-background text-foreground text-sm resize-none placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:opacity-50 transition"
        />
      </div>
      <div className="flex justify-end mt-3 gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition"
          >
            Batal
          </button>
        )}
        <button
          type="submit"
          disabled={!content.trim() || sending || disabled}
          className={`
            inline-flex items-center gap-2 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition
            ${compact ? 'px-4 py-2 text-xs' : 'px-5 py-2.5 text-sm'}
          `}
        >
          {sending ? (
            <>
              <Loader2 size={compact ? 12 : 16} className="animate-spin" />
              {compact ? '' : 'Mengirim...'}
            </>
          ) : (
            <>
              <Send size={compact ? 12 : 16} />
              {compact ? 'Kirim' : 'Kirim Balasan'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
