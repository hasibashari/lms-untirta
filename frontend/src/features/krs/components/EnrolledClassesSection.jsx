import { memo } from 'react';
import { Trash2, RefreshCw, Loader2, Info, BookOpen, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import CourseBadge from '@/components/ui/CourseBadge';
import KrsStatusBadge from './KrsStatusBadge';

const EnrolledClassRow = memo(({ enrollment, index, isDropping, isRevising, handleDrop, handleRevise, canDrop, canRevise, isReadOnly }) => {
  return (
    <TableRow className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
      <td className="px-4 py-4 text-center text-slate-500 text-sm">{index + 1}</td>
      <td className="px-4 py-4">
        <div className="flex flex-col">
          <span className="font-medium text-slate-900">{enrollment.class?.course?.title}</span>
          <span className="text-xs text-slate-400 font-mono">{enrollment.class?.course?.code}</span>
          {enrollment.status === 'REJECTED' && enrollment.notes && (
            <div className="mt-1 text-[10px] text-red-600 font-medium">Alasan: {enrollment.notes}</div>
          )}
        </div>
      </td>
      <td className="px-4 py-4 text-center text-slate-700 font-medium">
        {enrollment.class?.course?.sks || 0}
      </td>
      <td className="px-4 py-4 text-center">
        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
          {enrollment.class?.section || '-'}
        </span>
      </td>
      <td className="px-4 py-4 text-center">
        <KrsStatusBadge status={enrollment.status} />
      </td>
      <td className="px-4 py-4 text-slate-600 text-sm">
        {enrollment.class?.lecturer?.name || '-'}
        <div className="text-[10px] text-teal-600 mt-0.5">{enrollment.class?.schedule || 'Jadwal belum diatur'}</div>
      </td>
      {!isReadOnly && (
        <td className="px-4 py-4 text-right pr-6">
          <div className="flex items-center justify-end gap-2">
            {canRevise(enrollment.status) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRevise(enrollment.id)}
                disabled={isRevising}
                className="h-8 px-2 border-amber-200 text-amber-600 hover:bg-amber-50"
                title="Revisi"
              >
                {isRevising ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              </Button>
            )}
            {canDrop(enrollment.status) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDrop(enrollment.id)}
                disabled={isDropping}
                className="h-8 px-2 border-red-200 text-red-500 hover:bg-red-50"
                title="Batalkan"
              >
                {isDropping ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </Button>
            )}
          </div>
        </td>
      )}
    </TableRow>
  );
});

const EnrolledClassCard = memo(({ enrollment, index, isDropping, isRevising, handleDrop, handleRevise, canDrop, canRevise }) => {
  return (
    <div className="p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-slate-400 font-bold text-xs">#{index + 1}</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-400 text-xs font-mono">{enrollment.class?.course?.code}</span>
          </div>
          <h4 className="font-bold text-slate-900 text-sm mb-1">{enrollment.class?.course?.title}</h4>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs text-slate-500">SKS: {enrollment.class?.course?.sks || 0}</span>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-500">Kelas: {enrollment.class?.section || '-'}</span>
          </div>
          <p className="text-slate-500 text-xs mb-2">Dosen: {enrollment.class?.lecturer?.name || '-'}</p>
          <div className="flex items-center justify-between">
            <KrsStatusBadge status={enrollment.status} />
            <span className="text-[10px] text-teal-600 font-medium">{enrollment.class?.schedule || 'TBA'}</span>
          </div>
          {enrollment.status === 'REJECTED' && enrollment.notes && (
            <div className="mt-3 p-2 bg-red-50 rounded border border-red-100">
              <p className="text-[10px] text-red-600 font-medium">Alasan: {enrollment.notes}</p>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          {canRevise(enrollment.status) && (
            <Button
              variant="outline" size="sm" onClick={() => handleRevise(enrollment.id)}
              disabled={isRevising} className="border-amber-200 text-amber-600"
            >
              <RefreshCw size={14} />
            </Button>
          )}
          {canDrop(enrollment.status) && (
            <Button
              variant="outline" size="sm" onClick={() => handleDrop(enrollment.id)}
              disabled={isDropping} className="border-red-200 text-red-500"
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});

const EnrolledClassesSection = ({
  enrollments,
  isReadOnly,
  totalSKS,
  enrollmentStats,
  dropping,
  revising,
  handleDrop,
  handleRevise,
  canDrop,
  canRevise
}) => {
  if (enrollments.length === 0 && isReadOnly) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
        <BookOpen size={40} className="text-slate-200 mx-auto mb-4" />
        <p className="text-slate-500 font-medium">Tidak ada data KRS untuk semester ini</p>
      </div>
    );
  }

  if (enrollments.length === 0 && !isReadOnly) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-slate-50 px-4 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle size={18} className="text-green-600" />
          <h3 className="font-bold text-slate-800 text-sm sm:text-base">Mata Kuliah Terpilih (KRS Saya)</h3>
        </div>
        <div className="flex items-center gap-4 text-sm font-bold">
          <span className="text-slate-500">Total: <span className="text-slate-900">{totalSKS} SKS</span></span>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden divide-y divide-slate-100">
        {enrollments.map((enrollment, index) => (
          <EnrolledClassCard
            key={enrollment.id}
            enrollment={enrollment}
            index={index}
            isDropping={dropping === (enrollment.class?.id || enrollment.classId)}
            isRevising={revising === enrollment.id}
            handleDrop={handleDrop}
            handleRevise={handleRevise}
            canDrop={canDrop}
            canRevise={canRevise}
          />
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
              <th className="px-4 py-4 font-semibold w-16 text-center">No.</th>
              <th className="px-4 py-4 font-semibold">Mata Kuliah</th>
              <th className="px-4 py-4 font-semibold w-20 text-center">SKS</th>
              <th className="px-4 py-4 font-semibold w-24 text-center">Kelas</th>
              <th className="px-4 py-4 font-semibold w-32 text-center">Status</th>
              <th className="px-4 py-4 font-semibold">Dosen & Jadwal</th>
              {!isReadOnly && <th className="px-4 py-4 font-semibold w-32 text-right pr-6">Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {enrollments.map((enrollment, index) => (
              <EnrolledClassRow
                key={enrollment.id}
                enrollment={enrollment}
                index={index}
                isDropping={dropping === (enrollment.class?.id || enrollment.classId)}
                isRevising={revising === enrollment.id}
                handleDrop={handleDrop}
                handleRevise={handleRevise}
                canDrop={canDrop}
                canRevise={canRevise}
                isReadOnly={isReadOnly}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Stats similar to Transcript */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Total Mata Kuliah:</span>
              <span className="font-bold text-slate-900">{enrollments.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Total Beban SKS:</span>
              <span className="font-bold text-blue-600">{totalSKS} SKS</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Disetujui:</span>
              <span className="font-bold text-green-600">{enrollmentStats.approved}</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 italic flex items-center gap-1.5">
            <Info size={14} />
            {isReadOnly ? 'Semester ditutup (Read-only)' : 'Pastikan semua mata kuliah sudah disetujui Dosen Wali.'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnrolledClassesSection;
