import { AlertCircle } from 'lucide-react';

export const ClassDeleteModal = ({ deleteConfirm, setDeleteConfirm, deleting, handleDelete }) => {
  if (!deleteConfirm) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => !deleting && setDeleteConfirm(null)}
      />

      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle size={24} className="text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Hapus Kelas Offering?</h3>
          <p className="text-gray-500 mb-6">
            Anda yakin ingin menghapus <strong>{deleteConfirm.course?.code} Kelas {deleteConfirm.section}</strong>?
            Semua data KRS enrollment terkait juga akan dihapus.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              disabled={deleting}
            >
              Batal
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              disabled={deleting}
            >
              {deleting ? 'Menghapus...' : 'Ya, Hapus'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
