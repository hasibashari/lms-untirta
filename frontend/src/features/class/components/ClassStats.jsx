import { Layers, ToggleRight, Calendar, GraduationCap, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

export const ClassStats = ({
  stats,
  loading,
  error,
  statsLoading,
  activeSemester,
  getSemesterLabel,
  handleBulkToggle,
  toggling,
}) => {
  return (
    <>
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 h-24 animate-pulse" />
          ))}
        </div>
      ) : !error && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                <Layers size={20} className="text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                <p className="text-xs text-slate-500 truncate">Total Kelas</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
                <ToggleRight size={20} className="text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-2xl font-bold text-green-700">{stats.open}</p>
                <p className="text-xs text-slate-500 truncate">Pendaftaran Dibuka</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
                <Calendar size={20} className="text-amber-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-2xl font-bold text-slate-900">{stats.activeSemClasses}</p>
                <p className="text-xs text-slate-500 truncate">Kelas Semester Aktif</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center shrink-0">
                <GraduationCap size={20} className="text-teal-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-2xl font-bold text-teal-700">{stats.activeSemOpen}</p>
                <p className="text-xs text-slate-500 truncate">KRS-Ready (Aktif+Buka)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warning: No classes for active semester */}
      {!loading && !statsLoading && activeSemester && stats.activeSemClasses === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm text-amber-800 min-w-0 flex-1">
            <strong>Semester aktif belum memiliki kelas.</strong>{' '}
            Semester <strong>{getSemesterLabel(activeSemester)}</strong> (status: {activeSemester.status}) tidak memiliki kelas.
            Tambahkan kelas offering agar mahasiswa dapat melakukan pendaftaran KRS.
          </div>
        </div>
      )}

      {/* Warning: Active semester has classes but none open */}
      {!loading && activeSemester && stats.activeSemClasses > 0 && stats.activeSemOpen === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 flex-wrap sm:flex-nowrap">
          <AlertCircle size={20} className="text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm text-amber-800 min-w-0 flex-1">
            <strong>Semua kelas di semester aktif masih ditutup pendaftarannya.</strong>{' '}
            Terdapat {stats.activeSemClasses} kelas di semester {getSemesterLabel(activeSemester)}, tetapi belum ada yang dibuka untuk KRS.
            <Button
              variant="outline"
              size="sm"
              className="mt-3 sm:mt-0 sm:ml-2 border-amber-300 text-amber-700 hover:bg-amber-100 whitespace-nowrap inline-flex"
              onClick={() => handleBulkToggle(true)}
              disabled={toggling === 'bulk'}
            >
              {toggling === 'bulk' ? <Loader2 size={14} className="animate-spin mr-1" /> : <ToggleRight size={14} className="mr-1" />}
              Buka Semua
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
