import { memo } from 'react';
import { Printer, Loader2, User, BookOpen, Calculator, Info } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import Breadcrumb from '@/shared/components/navigation/Breadcrumb';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';

const KrsHeader = memo(({
  currentSemester,
  semesters,
  selectedSemesterId,
  handleSemesterChange,
  semesterLabel,
  user,
  totalSKS,
  maxSKS
}) => (
  <div className="space-y-6">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <Breadcrumb
          items={[
            { label: 'Dashboard', to: '/mahasiswa/dashboard' },
            { label: 'Rencana Studi' },
          ]}
        />
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
          Kartu Rencana Studi
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
        <Select value={selectedSemesterId || ''} onValueChange={handleSemesterChange}>
          <SelectTrigger className="w-full sm:w-72 bg-white h-11 px-4 font-bold text-slate-700 rounded-xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-blue-500/20 transition-all">
            <div className="flex items-center gap-2">
              <Info size={16} className="text-blue-500" />
              <SelectValue placeholder="Pilih Periode" />
            </div>
          </SelectTrigger>
          <SelectContent align="start" className="w-(--radix-select-trigger-width) max-h-[400px] overflow-y-auto rounded-xl shadow-xl border-slate-200">
            <div className="px-2 py-2 text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-slate-50/50">Periode Aktif</div>
            {semesters.filter(s => s.status === 'OPEN').map((sem) => (
              <SelectItem key={sem.id} value={sem.id} className="font-bold py-2.5">
                {semesterLabel(sem)} (SEKARANG)
              </SelectItem>
            ))}

            <div className="px-2 py-2 mt-1 text-[10px] font-bold text-slate-400 border-t border-slate-100 uppercase tracking-widest bg-slate-50/50">Riwayat Semester</div>
            <div className="space-y-0.5">
              {semesters.filter(s => s.status !== 'OPEN').map((sem) => (
                <SelectItem key={sem.id} value={sem.id} className="py-2.5">
                  {semesterLabel(sem)}
                </SelectItem>
              ))}
            </div>
          </SelectContent>
        </Select>
      </div>

      {/* Print button moved to Tabs Bar for better UX context */}
    </div>

    {/* Compact Summary Bar */}
    <div className="flex flex-wrap items-center gap-y-4 gap-x-8 px-5 py-4 bg-white/50 backdrop-blur-md rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
          <Calculator size={20} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Beban Belajar</p>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black text-slate-900">{totalSKS}</span>
            <span className="text-xs text-slate-400 font-bold">/ {maxSKS} SKS</span>
          </div>
        </div>
      </div>

      <div className="hidden sm:block w-px h-8 bg-slate-200" />

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
          <BookOpen size={20} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sisa Kuota</p>
          <p className="text-lg font-black text-slate-900">{Math.max(0, maxSKS - totalSKS)} <span className="text-xs font-bold">SKS</span></p>
        </div>
      </div>

      <div className="hidden lg:block w-px h-8 bg-slate-200" />

      <div className="flex items-center gap-3 flex-1">
        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
          <User size={20} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dosen Pembimbing Akademik</p>
          <p className="text-sm font-bold text-slate-700">{user?.advisor?.name || 'Belum Ditentukan'}</p>
        </div>
      </div>

      {currentSemester?.status === 'OPEN' ? (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg border border-emerald-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-bold uppercase tracking-tight">Masa Pengisian Aktif</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg border border-slate-200">
          <Info size={14} />
          <span className="text-[11px] font-bold uppercase tracking-tight">Akses Terbatas</span>
        </div>
      )}
    </div>
  </div>
));

export default KrsHeader;
