import { Clock, Users, Edit, Trash2, Loader2, ToggleLeft, ToggleRight, Building } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';

export const ClassTable = ({
  filteredClasses,
  page,
  limit,
  getSemesterLabel,
  handleToggleEnrollment,
  toggling,
  handleOpenEdit,
  setDeleteConfirm,
}) => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      {/* Mobile Card View */}
      <div className="lg:hidden divide-y divide-slate-100">
        {filteredClasses.map((cls) => (
          <div key={cls.id} className="p-4 hover:bg-slate-50">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm text-slate-500">{cls.course?.code}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-sm font-medium text-blue-600">Kelas {cls.section}</span>
                </div>
                <h4 className="font-semibold text-slate-900 mb-2 truncate">{cls.course?.title}</h4>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full shrink-0">
                    {cls.course?.sks || 3} SKS
                  </span>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full shrink-0 ${
                      cls.isEnrollmentOpen
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {cls.isEnrollmentOpen ? 'Buka' : 'Tutup'}
                  </span>
                  {cls.course?.semester && (
                    <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 text-xs font-medium rounded-full shrink-0">
                      Semester {cls.course.semester}
                    </span>
                  )}
                  <span className="px-2 py-0.5 bg-slate-50 text-slate-600 text-xs rounded-full shrink-0 truncate">
                    {getSemesterLabel(cls.academicSemester)}
                  </span>
                </div>
                <p className="text-sm text-slate-600 truncate">Dosen: {cls.lecturer?.name || '-'}</p>
                {cls.schedule && (
                  <p className="text-xs text-slate-500 mt-1 truncate">
                    <Clock size={12} className="inline mr-1" />
                    {cls.schedule}
                  </p>
                )}
                <p className="text-xs text-slate-500 mt-1">
                  <Users size={12} className="inline mr-1" />
                  {cls.krsEnrollmentsCount || 0}/{cls.capacity} mahasiswa
                </p>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button
                  onClick={() => handleToggleEnrollment(cls)}
                  disabled={toggling === cls.id}
                  className={`p-2 rounded-lg transition ${
                    cls.isEnrollmentOpen
                      ? 'text-green-600 hover:bg-green-50'
                      : 'text-slate-400 hover:bg-slate-50'
                  }`}
                  title={cls.isEnrollmentOpen ? 'Tutup Pendaftaran' : 'Buka Pendaftaran'}
                >
                  {toggling === cls.id ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : cls.isEnrollmentOpen ? (
                    <ToggleRight size={18} />
                  ) : (
                    <ToggleLeft size={18} />
                  )}
                </button>
                <button
                  onClick={() => handleOpenEdit(cls)}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  title="Edit"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => setDeleteConfirm(cls)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Hapus"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 whitespace-nowrap">
              <TableHead className="w-12 text-center">No.</TableHead>
              <TableHead>Mata Kuliah & Kelas</TableHead>
              <TableHead>Dosen & Jadwal</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead className="text-center">Status & Kapasitas</TableHead>
              <TableHead className="w-24 text-center">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClasses.map((cls, index) => (
              <TableRow key={cls.id} className="hover:bg-slate-50">
                <TableCell className="text-center text-slate-500">
                  {(page - 1) * limit + index + 1}
                </TableCell>

                {/* Collapsed: Mata Kuliah & Kelas */}
                <TableCell>
                  <div className="min-w-0 max-w-45 sm:max-w-xs xl:max-w-sm">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-900 truncate" title={cls.course?.title}>
                        {cls.course?.title}
                      </span>
                      <span className="shrink-0 px-2 py-0.5 bg-purple-50 text-purple-700 text-xs font-medium rounded-full">
                        Kelas {cls.section}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-slate-500 font-mono truncate">{cls.course?.code}</span>
                      <span className="shrink-0 px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-medium rounded">
                        {cls.course?.sks || 3} SKS
                      </span>
                    </div>
                  </div>
                </TableCell>

                {/* Collapsed: Dosen & Jadwal */}
                <TableCell>
                  <div className="min-w-0 max-w-35 sm:max-w-50">
                    <div
                      className="text-sm font-medium text-slate-700 truncate"
                      title={cls.lecturer?.name || '-'}
                    >
                      {cls.lecturer?.name || '-'}
                    </div>
                    <div
                      className="text-xs text-slate-500 mt-1 truncate"
                      title={`${cls.schedule} • ${cls.room}`}
                    >
                      {cls.schedule || '-'}
                      {cls.room && (
                        <span className="ml-2 whitespace-nowrap">
                          <Building size={10} className="inline mr-0.5 mb-0.5" />
                          {cls.room}
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* Semester */}
                <TableCell>
                  <div className="flex flex-col gap-1 items-start min-w-0 max-w-32.5">
                    <span
                      className="text-sm text-slate-600 truncate w-full"
                      title={getSemesterLabel(cls.academicSemester)}
                    >
                      {getSemesterLabel(cls.academicSemester)}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {cls.course?.semester && (
                        <span className="px-1.5 py-0.5 bg-yellow-50 text-yellow-700 text-[10px] font-medium rounded">
                          Sem {cls.course.semester}
                        </span>
                      )}
                      {cls.academicSemester?.status && (
                        <span
                          className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
                            cls.academicSemester.status === 'OPEN'
                              ? 'bg-green-50 text-green-700'
                              : cls.academicSemester.status === 'DRAFT'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-blue-50 text-blue-600'
                          }`}
                        >
                          {cls.academicSemester.status}
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* Collapsed: Pendaftaran & Kapasitas */}
                <TableCell className="text-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <button
                      onClick={() => handleToggleEnrollment(cls)}
                      disabled={toggling === cls.id}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition ${
                        cls.isEnrollmentOpen
                          ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                          : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                      }`}
                    >
                      {toggling === cls.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : cls.isEnrollmentOpen ? (
                        <ToggleRight size={14} />
                      ) : (
                        <ToggleLeft size={14} />
                      )}
                      <span className="truncate">{cls.isEnrollmentOpen ? 'Buka' : 'Tutup'}</span>
                    </button>
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {cls.krsEnrollmentsCount || 0} / {cls.capacity} Kuota
                    </span>
                  </div>
                </TableCell>

                {/* Aksi */}
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(cls)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(cls)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                      title="Hapus"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
