import { useMemo, useState } from 'react';
import { AlertCircle, Printer, Loader2, RefreshCw } from 'lucide-react';
import CourseBadge from '@/features/course/components/CourseBadge';

/**
 * MahasiswaTranscriptPage
 * 
 * Menampilkan Daftar Hasil Studi per semester dengan desain tabel modern
 * mengikuti spesifikasi UI terbaru: kartu per semester, badge SKS, 
 * dan tampilan IP/IPK di dalam tabel.
 */
import { useMyTranscript } from '../hooks/useStudentTranscript';
import { getStudentSemesters } from '@/features/academic/api/academic.api';
import { useSemesters } from '@/shared/hooks/useSemesters';

/**
 * MahasiswaTranscriptPage
 */
const MahasiswaTranscriptPage = () => {
  const { data: transcriptData, isLoading: loading, error: fetchError } = useMyTranscript();
  const data = transcriptData?.data || null;
  const error = fetchError?.message || null;
  
  const { student, summary } = data || {};
  const transcriptSemesters = data?.transcriptSemesters;

  const semesterDataList = useMemo(() => {
    if (!transcriptSemesters) return [];
    // Backend returns ascending order. UI expects descending (newest first)
    return [...transcriptSemesters].reverse();
  }, [transcriptSemesters]);
  
  const calculatedTotalSks = data?.summary?.totalSKS || 0;

  const { semesters } = useSemesters(getStudentSemesters);
  const [selectedSemesterId] = useState(() => {
    return localStorage.getItem('selectedAcademicSemesterId') || null;
  });

  const activeSemesterId = selectedSemesterId || (semesters.find(s => s.status === 'OPEN') || semesters[0])?.id;
  
  // Only show the selected semester in the view (as expected by user for KHS)
  const activeSemesterDataList = useMemo(() => {
    if (!activeSemesterId) return semesterDataList;
    return semesterDataList.filter(s => s.semester === activeSemesterId);
  }, [semesterDataList, activeSemesterId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-indigo-600 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Memuat Hasil Studi...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-red-200 p-12 text-center max-w-2xl mx-auto">
        <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
        <p className="text-red-700 font-medium">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Page Header / Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">Kartu Hasil Studi (KHS)</h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">
            Mahasiswa: <span className="font-semibold text-slate-700">{student?.name || '-'}</span> |
            Total SKS: <span className="font-semibold text-slate-700">{calculatedTotalSks} SKS</span> |
            IPK: <span className="font-semibold text-slate-700">{summary?.ipk?.toFixed(2) || '0.00'}</span>
          </p>
        </div>
        <button
          onClick={() => window.open('/mahasiswa/study-result/print', '_blank')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm font-medium transition-colors focus:ring-2 focus:ring-blue-400 focus:outline-none"
        >
          <Printer size={18} /> Cetak Semua KHS
        </button>
      </div>
      
      {/* Semester Filter */}

      {activeSemesterDataList.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-2xl mx-auto text-slate-500 italic">
          Belum ada data nilai akademik yang tersedia di semester ini.
        </div>
      ) : (
        activeSemesterDataList.map((semData) => (
          <div key={semData.semester} className="bg-white p-6 sm:p-8 shadow-sm rounded-xl border border-slate-200 mb-8 print:shadow-none print:border-none print:p-0 print:mb-12">

            {/* Header KHS */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Daftar Hasil Studi</h2>
                <p className="text-slate-500 text-sm mt-1">{semData.semesterTitle}</p>
              </div>
              <div className="flex gap-3 mt-4 sm:mt-0 print:hidden">
                <button
                  onClick={() => window.open(`/mahasiswa/study-result/print?semesterId=${semData.semester}`, '_blank')}
                  className="flex items-center gap-2 border border-cyan-300 text-cyan-600 hover:bg-cyan-50 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <Printer size={16} /> KHS
                </button>
                <button className="flex items-center gap-2 border border-indigo-300 text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                  <RefreshCw size={16} /> Hitung IPS
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap min-w-175">
                <thead>
                  <tr className="border-y border-slate-200 text-slate-500">
                    <th className="px-4 py-4 font-semibold w-16 text-center">No.</th>
                    <th className="px-4 py-4 font-semibold w-32">Kode Jadwal</th>
                    <th className="px-4 py-4 font-semibold w-auto">Mata Kuliah</th>
                    <th className="px-4 py-4 font-semibold w-64">Dosen</th>
                    <th className="px-4 py-4 font-semibold w-24 text-center">Nilai</th>
                    <th className="px-4 py-4 font-semibold w-24 text-center">Mutu</th>
                  </tr>
                </thead>
                <tbody>
                  {semData.courses.map((course, idx) => (
                    <tr key={`${course.courseCode}-${idx}`} className="border-b border-slate-100 hover:bg-slate-50/50 print:border-slate-200">
                      <td className="px-4 py-5 text-slate-600 text-center">{idx + 1}</td>
                      <td className="px-4 py-5 font-mono text-slate-500 text-xs sm:text-sm">
                        {course.scheduleCode || course.courseCode || '-'}
                      </td>
                      <td className="px-4 py-5 text-slate-700">
                        <div className="flex items-center gap-2">
                          <span>{course.courseName} <span className="text-slate-400">({course.courseCode})</span></span>
                          <CourseBadge variant="indigo">
                            {course.sks} SKS
                          </CourseBadge>
                        </div>
                      </td>
                      <td className="px-4 py-5 text-slate-500">
                        {course.lecturer || course.dosen ? `1. ${course.lecturer || course.dosen}` : ''}
                      </td>
                      <td className="px-4 py-5 text-slate-600 text-center">
                        {course.score ?? (course.gradePoint?.toFixed(2) || '-')}
                      </td>
                      <td className="px-4 py-5 text-slate-700 font-medium text-center">
                        {course.letterGrade || '-'}
                      </td>
                    </tr>
                  ))}

                  {/* Footer Stats per Semester inside Table */}
                  <tr className="bg-slate-50 border-b border-slate-200 print:bg-transparent">
                    <td colSpan={6} className="px-4 py-5 text-center font-mono font-bold text-slate-600 tracking-widest text-sm">
                      IP : {semData.ip.toFixed(2)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td colSpan={6} className="px-4 py-5 text-center font-mono font-bold text-slate-600 tracking-widest text-sm">
                      IPK : {semData.ipk.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        ))
      )}
    </div>
  );
};

export default MahasiswaTranscriptPage;
