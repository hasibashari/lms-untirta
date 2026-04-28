import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

/**
 * ReplyComposer — Input area untuk menulis balasan di thread detail.
 */
export default function ReplyComposer({ onSubmit, disabled = false }) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    <form onSubmit={handleSubmit} className="p-4 sm:p-5 border-t border-border bg-muted/20">
      <div className="flex gap-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Tulis balasan Anda..."
          rows={3}
          disabled={disabled || sending}
          className="flex-1 px-4 py-3 border border-border rounded-xl bg-background text-foreground text-sm resize-none placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:opacity-50 transition"
        />
      </div>
      <div className="flex justify-end mt-3">
        <button
          type="submit"
          disabled={!content.trim() || sending || disabled}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition"
        >
          {sending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Mengirim...
            </>
          ) : (
            <>
              <Send size={16} />
              Kirim Balasan
            </>
          )}
        </button>
      </div>
    </form>
  );
}
