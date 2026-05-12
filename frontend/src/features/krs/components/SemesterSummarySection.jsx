import { memo } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';

const SemesterSummarySection = memo(({
  user,
  semesters,
  selectedSemesterId,
  semestersLoading,
  handleSemesterChange,
  currentSemester,
  semesterLabel
}) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    {/* Current Academic Status */}
    <div className="md:col-span-1 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status Anda</p>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
          {user?.semester || '?'}
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">Semester {user?.semester || '?'}</p>
          <p className="text-[10px] text-emerald-600 font-medium">Aktif / Reguler</p>
        </div>
      </div>
    </div>

    {/* Semester Selector Box */}
    <div className="md:col-span-3 bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Periode Perkuliahan</p>
        {semestersLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 size={14} className="animate-spin" />
            Memuat periode...
          </div>
        ) : (
          <Select value={selectedSemesterId || ''} onValueChange={handleSemesterChange}>
            <SelectTrigger className="w-full sm:w-72 bg-slate-50 border-slate-200 font-semibold">
              <SelectValue placeholder="Pilih Periode" />
            </SelectTrigger>
            <SelectContent>
              <div className="px-2 py-1.5 text-[10px] font-bold text-blue-600 uppercase">Periode Aktif</div>
              {semesters.filter(s => s.status === 'OPEN').map((sem) => (
                <SelectItem key={sem.id} value={sem.id} className="font-medium">
                  {semesterLabel(sem)} (SEKARANG)
                </SelectItem>
              ))}

              <div className="px-2 py-1.5 mt-2 text-[10px] font-bold text-slate-400 border-t uppercase">Riwayat Semester</div>
              {semesters.filter(s => s.status !== 'OPEN').map((sem) => (
                <SelectItem key={sem.id} value={sem.id}>
                  {semesterLabel(sem)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Current Selection Status */}
      {currentSemester && (
        <div className="text-right hidden sm:block">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status Pengisian</p>
          {currentSemester.status === 'OPEN' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Pendaftaran Terbuka
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-xs font-bold">
              <Lock size={12} />
              Sudah Ditutup
            </span>
          )}
        </div>
      )}
    </div>
  </div>
));

export default SemesterSummarySection;
