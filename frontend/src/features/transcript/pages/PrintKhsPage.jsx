import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthContext';
import { useMyTranscript } from '../hooks/useStudentTranscript';
import { Printer, Loader2, AlertCircle } from 'lucide-react';

const PrintKhsPage = () => {
  const [searchParams] = useSearchParams();
  const semesterId = searchParams.get('semesterId');

  const { user } = useAuth();
  const { data: transcriptData, isLoading: loading, error: fetchError } = useMyTranscript();
  
  const data = transcriptData?.data || null;
  const error = fetchError?.message || null;
  const { student, summary } = data || {};

  // Use precalculated data from backend
  const { semesterDataList, calculatedTotalSks, finalIpk } = useMemo(() => {
    const transcriptSemesters = data?.transcriptSemesters;
    if (!transcriptSemesters) {
      return { semesterDataList: [], calculatedTotalSks: 0, finalIpk: 0 };
    }

    let filteredList = transcriptSemesters;
    let computedFinalIpk = 0;
    let finalTotalSks = 0;

    if (semesterId) {
      filteredList = filteredList.filter(item => item.semester === semesterId);
      const semItem = transcriptSemesters.find(item => item.semester === semesterId);
      if (semItem) {
        computedFinalIpk = semItem.ipk;
        finalTotalSks = semItem.cumulativeTotalSks;
      }
    } else {
      const finalCumulativeItem = transcriptSemesters[transcriptSemesters.length - 1];
      computedFinalIpk = finalCumulativeItem ? finalCumulativeItem.ipk : 0;
      finalTotalSks = finalCumulativeItem ? finalCumulativeItem.cumulativeTotalSks : 0;
    }

    return {
      semesterDataList: filteredList,
      calculatedTotalSks: finalTotalSks,
      finalIpk: computedFinalIpk
    };
  }, [data?.transcriptSemesters, semesterId]);

  // Trigger print dialog once loaded
  useEffect(() => {
    if (!loading && data) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [loading, data]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 print:hidden">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 print:hidden text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-lg font-bold text-slate-800">Gagal Memuat KHS</h2>
        <p className="text-slate-600">{error}</p>
      </div>
    );
  }

  const printDate = new Date().toLocaleDateString('id-ID', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white flex justify-center py-10 print:py-0 print:m-0">
      <style>
        {`
          @media print {
            @page { margin: 1.5cm; }
            body { -webkit-print-color-adjust: exact; }
          }
        `}
      </style>
      
      {/* Floating Action Button for printing again (hidden during print) */}
      <button 
        onClick={() => window.print()}
        className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg print:hidden transition-transform hover:scale-105 active:scale-95 z-50"
        title="Cetak KHS"
      >
        <Printer size={24} />
      </button>

      {/* A4 Canvas */}
      <div className="bg-white w-full max-w-[210mm] shadow-xl print:shadow-none p-8 sm:p-12 print:p-0 mx-auto box-border relative">
        
        {/* KOP SURAT */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-b-4 border-slate-900 pb-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start text-center sm:text-left w-full">
            <div className="w-16 h-16 bg-slate-100 flex items-center justify-center rounded-full border border-slate-300 shrink-0">
              <span className="text-[10px] font-bold text-slate-400">LOGO</span>
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-wide">Universitas LMS Untirta</h1>
              <p className="text-sm text-slate-600 font-medium">Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi</p>
              <p className="text-xs text-slate-500 mt-1">Jl. Raya Jakarta Km 4, Pakupatan, Serang, Banten 42122</p>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-lg font-bold text-slate-900 uppercase underline underline-offset-4 tracking-wider">Kartu Hasil Studi (KHS)</h2>
        </div>

        {/* Biodata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 text-xs sm:text-sm text-slate-800 mb-6">
          <div className="flex">
            <span className="w-32 font-semibold">Nama Mahasiswa</span>
            <span className="mr-2">:</span>
            <span className="font-medium uppercase">{student?.name || user?.name || '-'}</span>
          </div>
          <div className="flex">
            <span className="w-32 font-semibold">Fakultas / Prodi</span>
            <span className="mr-2">:</span>
            <span>{student?.faculty || user?.faculty || '-'} / {student?.department || user?.department || '-'}</span>
          </div>
          <div className="flex">
            <span className="w-32 font-semibold">NIM</span>
            <span className="mr-2">:</span>
            <span>{student?.studentId || user?.studentId || '-'}</span>
          </div>
          <div className="flex">
            <span className="w-32 font-semibold">Total SKS Keseluruhan</span>
            <span className="mr-2">:</span>
            <span className="font-medium">{calculatedTotalSks || summary?.totalSks || 0} SKS</span>
          </div>
          <div className="flex">
            <span className="w-32 font-semibold">IPK Kumulatif</span>
            <span className="mr-2">:</span>
            <span className="font-medium">{finalIpk > 0 ? finalIpk.toFixed(2) : (summary?.ipk?.toFixed(2) || '0.00')}</span>
          </div>
        </div>

        {/* Tables per Semester */}
        {semesterDataList.length === 0 ? (
          <div className="text-center italic text-slate-500 py-10 border border-slate-300">
            Belum ada data nilai akademik yang tersedia.
          </div>
        ) : (
          semesterDataList.map((semData, i) => (
            <div key={semData.semester} className={`mb-8 ${i > 0 ? 'mt-8' : ''}`}>
              <h3 className="font-bold text-slate-800 mb-2 underline">{semData.semesterTitle}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm border-collapse border border-slate-400">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900">
                      <th className="border border-slate-400 px-2 py-2 text-center w-10">No</th>
                      <th className="border border-slate-400 px-2 py-2 text-center w-24">Kode MK</th>
                      <th className="border border-slate-400 px-3 py-2 text-left">Nama Mata Kuliah</th>
                      <th className="border border-slate-400 px-2 py-2 text-center w-12">SKS</th>
                      <th className="border border-slate-400 px-2 py-2 text-center w-16">Nilai</th>
                      <th className="border border-slate-400 px-2 py-2 text-center w-16">Mutu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {semData.courses.map((course, idx) => (
                      <tr key={`${course.courseCode}-${idx}`} className="text-slate-800">
                        <td className="border border-slate-400 px-2 py-1.5 text-center">{idx + 1}</td>
                        <td className="border border-slate-400 px-2 py-1.5 font-mono text-center text-xs">
                          {course.scheduleCode || course.courseCode || '-'}
                        </td>
                        <td className="border border-slate-400 px-3 py-1.5 font-medium">
                          {course.courseName}
                        </td>
                        <td className="border border-slate-400 px-2 py-1.5 text-center">{course.sks}</td>
                        <td className="border border-slate-400 px-2 py-1.5 text-center font-medium">
                          {course.letterGrade || '-'}
                        </td>
                        <td className="border border-slate-400 px-2 py-1.5 text-center">
                          {course.score ?? (course.gradePoint?.toFixed(2) || '-')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-bold text-slate-900">
                      <td colSpan={5} className="border border-slate-400 px-3 py-2 text-right">Indeks Prestasi Semester (IPS)</td>
                      <td className="border border-slate-400 px-2 py-2 text-center">{semData.ip.toFixed(2)}</td>
                    </tr>
                    <tr className="bg-slate-50 font-bold text-slate-900">
                      <td colSpan={5} className="border border-slate-400 px-3 py-2 text-right">Indeks Prestasi Kumulatif (IPK)</td>
                      <td className="border border-slate-400 px-2 py-2 text-center">{semData.ipk.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))
        )}

        {/* Tanda Tangan */}
        <div className="flex justify-between mt-12 text-xs sm:text-sm text-slate-800 px-2 sm:px-8">
          <div className="text-center">
            <p className="mb-16">Mengetahui,<br/>Wakil Dekan Bidang Akademik</p>
            <p className="font-bold underline underline-offset-2">
              ( .......................................... )
            </p>
            <p className="mt-1">NIP. .....................................</p>
          </div>
          <div className="text-center">
            <p className="mb-16">Serang, {printDate}<br/>Ketua Program Studi</p>
            <p className="font-bold underline underline-offset-2">
              ( .......................................... )
            </p>
            <p className="mt-1">NIP. .....................................</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PrintKhsPage;
