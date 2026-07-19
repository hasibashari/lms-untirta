import { memo } from 'react';
import { Plus, Loader2, AlertCircle, BookOpen, Search, CheckCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  TableRow,
} from '@/shared/components/ui/table';
import SectionHeader from '@/shared/components/layout/ContentHeader';

const AvailableClassRow = memo(({ cls, index, isEnrolling, handleEnroll, currentPage, itemsPerPage, enrollments }) => {
  const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;
  const isEnrolled = enrollments?.some(e => (e.class?.id || e.classId) === cls.id);
  return (
    <TableRow className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
      <td className="px-4 py-4 text-center text-slate-500 text-sm">{rowNumber}</td>
      <td className="px-4 py-4">
        <div className="flex flex-col">
          <span className="font-medium text-slate-900">{cls.course?.title}</span>
          <span className="text-xs text-slate-400 font-mono">{cls.course?.code}</span>
        </div>
      </td>
      <td className="px-4 py-4 text-center text-slate-700 font-medium">
        {cls.course?.sks || 0}
      </td>
      <td className="px-4 py-4 text-center">
        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
          {cls.section || '-'}
        </span>
      </td>
      <td className="px-4 py-4 text-center text-slate-600 text-sm">
        {cls.course?.semester || '-'}
      </td>
      <td className="px-4 py-4 text-slate-600 text-sm">
        {cls.lecturer?.name || '-'}
        <div className="text-[10px] text-teal-600 mt-0.5">{cls.schedule || 'Jadwal belum diatur'}</div>
      </td>
      <td className="px-4 py-4 text-center text-slate-600 text-sm">
        <span className="font-semibold text-slate-800">{cls.krsEnrollmentsCount || 0}</span>
        <span className="text-slate-400 mx-1">/</span>
        <span>{cls.capacity || '∞'}</span>
      </td>
      <td className="px-4 py-4 text-right pr-6">
        {isEnrolled ? (
          <Button
            variant="outline"
            size="sm"
            disabled
            className="h-8 px-3 border-slate-200 text-slate-500 bg-slate-50 gap-1 opacity-80"
          >
            <CheckCircle size={14} />
            <span className="text-xs">Diambil</span>
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEnroll(cls.id)}
            disabled={isEnrolling}
            className="h-8 px-3 border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm gap-1"
          >
            {isEnrolling ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            <span className="text-xs">Ambil</span>
          </Button>
        )}
      </td>
    </TableRow>
  );
});

const AvailableClassCard = memo(({ cls, index, isEnrolling, handleEnroll, currentPage, itemsPerPage, enrollments }) => {
  const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;
  const isEnrolled = enrollments?.some(e => (e.class?.id || e.classId) === cls.id);
  return (
    <div className="p-4 hover:bg-slate-50 transition-colors border-b border-slate-100">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-blue-600 font-bold text-xs">#{rowNumber}</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-400 text-xs font-mono">{cls.course?.code}</span>
          </div>
          <h4 className="font-bold text-slate-900 text-sm mb-1">{cls.course?.title}</h4>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs text-slate-500">SKS: {cls.course?.sks || 0}</span>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-500">Semester: {cls.course?.semester || '-'}</span>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-500">Kelas: {cls.section || '-'}</span>
          </div>
          <p className="text-slate-500 text-xs mb-2">Dosen: {cls.lecturer?.name || '-'}</p>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-teal-600 font-medium">{cls.schedule || 'Jadwal belum diatur'}</span>
            <span className="text-[10px] text-slate-400">Kuota: {cls.krsEnrollmentsCount || 0}/{cls.capacity || '∞'}</span>
          </div>
        </div>
        {isEnrolled ? (
          <Button
            variant="outline"
            size="sm"
            disabled
            className="border-slate-200 text-slate-500 bg-slate-50 opacity-80 shrink-0 gap-1"
          >
            <CheckCircle size={16} />
            <span className="text-xs hidden sm:inline">Diambil</span>
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEnroll(cls.id)}
            disabled={isEnrolling}
            className="border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white shrink-0 gap-1"
          >
            {isEnrolling ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            <span className="text-xs hidden sm:inline">Ambil</span>
          </Button>
        )}
      </div>
    </div>
  );
});

const AvailableClassesSection = ({
  user,
  availableClasses,
  enrollments = [],
  error,
  searchQuery,
  setSearchQuery,
  selectedCourseSemester,
  setSelectedCourseSemester,
  currentPage,
  itemsPerPage,
  enrolling,
  handleEnroll,
  fetchData
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <SectionHeader
        title="MATA KULIAH DITAWARKAN"
        subtitle={`${user?.name || ''} (${user?.nim || ''})`}
      />

      {/* Filter Bar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row items-end gap-4">
          <div className="w-full sm:w-72 flex-1">
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block uppercase tracking-wider">Pencarian</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari Mata Kuliah atau Kode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 h-10 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
              />
            </div>
          </div>
          <div className="w-full sm:w-64 shrink-0">
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block uppercase tracking-wider">Tingkat Semester</label>
            <Select
              value={selectedCourseSemester}
              onValueChange={setSelectedCourseSemester}
            >
              <SelectTrigger className="w-full bg-white border-slate-200 h-10 font-medium">
                <SelectValue placeholder="Semua Semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Semester</SelectItem>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    Semester {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Available Classes - Error/Empty */}
      {error ? (
        <div className="p-12 text-center">
          <AlertCircle size={40} className="text-red-300 mx-auto mb-4" />
          <p className="text-red-600 font-medium">{error}</p>
          <Button variant="outline" onClick={() => fetchData()} className="mt-4">
            Coba Sinkronisasi
          </Button>
        </div>
      ) : availableClasses.length === 0 ? (
        <div className="p-16 text-center text-slate-400 italic">
          <BookOpen size={48} className="text-slate-100 mx-auto mb-4" />
          Tidak ada mata kuliah yang dapat ditampilkan.
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="lg:hidden divide-y divide-slate-100">
            {availableClasses.map((cls, index) => (
              <AvailableClassCard
                key={cls.id}
                cls={cls}
                index={index}
                isEnrolling={enrolling === cls.id}
                handleEnroll={handleEnroll}
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                enrollments={enrollments}
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
                  <th className="px-4 py-4 font-semibold w-24 text-center">Sem.</th>
                  <th className="px-4 py-4 font-semibold">Dosen & Jadwal</th>
                  <th className="px-4 py-4 font-semibold w-24 text-center">Kuota</th>
                  <th className="px-4 py-4 font-semibold w-32 text-right pr-6">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {availableClasses.map((cls, index) => (
                  <AvailableClassRow
                    key={cls.id}
                    cls={cls}
                    index={index}
                    isEnrolling={enrolling === cls.id}
                    handleEnroll={handleEnroll}
                    currentPage={currentPage}
                    itemsPerPage={itemsPerPage}
                    enrollments={enrollments}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default AvailableClassesSection;
