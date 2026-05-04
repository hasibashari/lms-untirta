import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, AlertCircle, Printer, RefreshCw } from 'lucide-react';
import CourseBadge from '@/components/ui/CourseBadge';

/**
 * MahasiswaTranscriptPage
 * 
 * Menampilkan Daftar Hasil Studi per semester dengan desain tabel modern
 * mengikuti spesifikasi UI terbaru: kartu per semester, badge SKS, 
 * dan tampilan IP/IPK di dalam tabel.
 */
import { useStudentTranscript } from '../hooks/useStudentTranscript';

/**
 * MahasiswaTranscriptPage
 */
const MahasiswaTranscriptPage = () => {
  const { user } = useAuth();
  const { data: transcriptData, isLoading: loading, error: fetchError } = useStudentTranscript(user?.id);
  const data = transcriptData?.data || null;
  const error = fetchError?.message || null;

  const { student, summary, courses } = data || {};

  // Memoized processed data
  const { semesterDataList, calculatedTotalSks } = useMemo(() => {
    // Sorting courses chronologically by academic year and type
    const sortedCourses = [...(courses || [])].sort((a, b) => {
      // Sort by Year first (descending to show newest first)
      if (a.academicYear !== b.academicYear) {
        return (b.academicYear || '').localeCompare(a.academicYear || '');
      }
      // Then by Semester Type (GANJIL should come after GENAP if we want newest first)
      return (b.semesterType || '').localeCompare(a.semesterType || '');
    });

    const validCourses = sortedCourses;

    // Calculate generic total for header
    let totalSks = 0;
    validCourses.forEach(c => {
      if (c.letterGrade && c.letterGrade !== '-') {
        totalSks += c.sks;
      }
    });

    // Group courses by Academic Semester ID (Period)
    const grouped = {};
    const periodMeta = {}; // Store title info for each period

    validCourses.forEach((course) => {
      const periodId = course.academicSemesterId || 'legacy';
      if (!grouped[periodId]) {
        grouped[periodId] = [];
        periodMeta[periodId] = {
          year: course.academicYear || 'Legacy',
          type: course.semesterType || 'Data Lama',
          title: course.academicYear 
            ? `${course.academicYear} - ${course.semesterType === 'GANJIL' ? 'Ganjil' : 'Genap'}`
            : 'Data Akademik Terlampau'
        };
      }
      grouped[periodId].push(course);
    });

    const periodIds = Object.keys(grouped).sort((a, b) => {
      // Sort periods (newest first)
      const metaA = periodMeta[a];
      const metaB = periodMeta[b];
      if (metaA.year !== metaB.year) return metaB.year.localeCompare(metaA.year);
      return metaB.type.localeCompare(metaA.type);
    });

    const aggregated = periodIds.reduce(
      (acc, pId) => {
        const coursesInSem = grouped[pId];
        const meta = periodMeta[pId];

        // Only calculate IP/IPK from graded courses
        const gradedCoursesInSem = coursesInSem.filter(c => c.letterGrade && c.letterGrade !== '-');
        
        const { semSks, semMutu } = gradedCoursesInSem.reduce(
          (totals, c) => ({
            semSks: totals.semSks + c.sks,
            semMutu: totals.semMutu + c.sks * (c.gradePoint || 0),
          }),
          { semSks: 0, semMutu: 0 }
        );

        const cumulativeSks = acc.cumulativeSks + semSks;
        const cumulativeMutu = acc.cumulativeMutu + semMutu;
        const ip = semSks > 0 ? semMutu / semSks : 0;
        const ipk = cumulativeSks > 0 ? cumulativeMutu / cumulativeSks : 0;

        return {
          cumulativeSks,
          cumulativeMutu,
          list: [
            ...acc.list,
            {
              semester: pId,
              semesterTitle: meta.title,
              courses: coursesInSem,
              ip,
              ipk,
            },
          ],
        };
      },
      { cumulativeSks: 0, cumulativeMutu: 0, list: [] }
    );

    return {
      semesterDataList: aggregated.list,
      calculatedTotalSks: totalSks,
    };
  }, [courses]);

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
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm font-medium transition-colors focus:ring-2 focus:ring-blue-400 focus:outline-none"
        >
          <Printer size={18} /> Cetak Semua KHS
        </button>
      </div>

      {semesterDataList.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-2xl mx-auto text-slate-500 italic">
          Belum ada data nilai akademik yang tersedia.
        </div>
      ) : (
        semesterDataList.map((semData) => (
          <div key={semData.semester} className="bg-white p-6 sm:p-8 shadow-sm rounded-xl border border-slate-200 mb-8 print:shadow-none print:border-none print:p-0 print:mb-12">

            {/* Header KHS */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Daftar Hasil Studi</h2>
                <p className="text-slate-500 text-sm mt-1">{semData.semesterTitle}</p>
              </div>
              <div className="flex gap-3 mt-4 sm:mt-0 print:hidden">
                <button
                  onClick={() => window.print()}
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
