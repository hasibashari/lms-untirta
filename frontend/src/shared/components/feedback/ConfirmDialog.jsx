export default function ConfirmDialog({
  open,
  title,
  description,
  confirmText = 'Ya, lanjutkan',
  cancelText = 'Batal',
  onConfirm,
  onCancel,
  loading = false,
  variant = 'danger',
}) {
  if (!open) return null;

  const confirmClasses =
    variant === 'primary'
      ? 'bg-blue-600 text-white hover:bg-blue-700'
      : 'bg-red-600 text-white hover:bg-red-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => !loading && onCancel?.()}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-xl"
      >
        <div className="p-5 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          {description && (
            <p className="text-sm text-slate-600 mt-1">{description}</p>
          )}
        </div>
        <div className="p-5 flex items-center justify-end gap-3">
          <button
            type="button"
            className="px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`px-4 py-2 rounded-lg font-medium transition ${confirmClasses} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Memproses...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
