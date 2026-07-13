import { Loader2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

export const SemesterCreateForm = ({
  createForm,
  setCreateForm,
  handleCreate,
  creating,
  setShowCreate,
}) => {
  return (
    <form
      onSubmit={handleCreate}
      className="bg-white rounded-xl border border-slate-200 p-5 space-y-4"
    >
      <h3 className="font-semibold text-slate-900">Buat Semester Baru</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-sm text-slate-600 mb-1 block">Tahun Akademik</label>
          <input
            type="text"
            placeholder="2025/2026"
            value={createForm.academicYear}
            onChange={(e) =>
              setCreateForm((prev) => ({ ...prev, academicYear: e.target.value }))
            }
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="text-xs text-slate-400 mt-1">Format: YYYY/YYYY</p>
        </div>
        <div>
          <label className="text-sm text-slate-600 mb-1 block">Tipe Semester</label>
          <select
            value={createForm.semesterType}
            onChange={(e) =>
              setCreateForm((prev) => ({ ...prev, semesterType: e.target.value }))
            }
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="GANJIL">Ganjil</option>
            <option value="GENAP">Genap</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-slate-600 mb-1 block">Maks SKS</label>
          <input
            type="number"
            min={1}
            max={36}
            value={createForm.maxSks}
            onChange={(e) =>
              setCreateForm((prev) => ({ ...prev, maxSks: parseInt(e.target.value) || 24 }))
            }
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-slate-400 mt-1">Batas SKS per mahasiswa</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={creating}
          className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
        >
          {creating ? <Loader2 size={14} className="animate-spin" /> : null}
          Buat Semester
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setShowCreate(false)}
        >
          Batal
        </Button>
      </div>
    </form>
  );
};
