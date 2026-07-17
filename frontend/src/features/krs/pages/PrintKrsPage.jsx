import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthContext';
import { getMyKRS } from '../api/krs.api';
import { getStudentSemesters } from '@/features/academic/api/academic.api';
import { Printer, Loader2 } from 'lucide-react';

const PrintKrsPage = () => {
  const { semesterId } = useParams();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState([]);
  const [krsSummary, setKrsSummary] = useState(null);
  const [semester, setSemester] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [krsRes, semRes] = await Promise.all([
          getMyKRS({ academicSemesterId: semesterId }),
          getStudentSemesters()
        ]);
        
        const data = krsRes?.data?.enrollments || [];
        setEnrollments(data);
        
        const summary = krsRes?.data?.summary || {};
        setKrsSummary(summary);
        
        const semList = semRes?.data?.data || semRes?.data || [];
        const currentSem = semList.find(s => s.id === semesterId);
        setSemester(currentSem);
      } catch (error) {
        console.error('Failed to load KRS for printing', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [semesterId]);
  
  // Trigger print dialog once loaded
  useEffect(() => {
    if (!loading) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [loading]);

  const totalSKS = krsSummary?.totalSKS || 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 print:hidden">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }
  
  // Format semester label
  const semesterLabel = semester 
    ? `${semester.semesterType === 'GANJIL' ? 'Ganjil' : 'Genap'} ${semester.academicYear}`
    : '-';
    
  // Current Date
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
        title="Cetak KRS"
      >
        <Printer size={24} />
      </button>

      {/* A4 Canvas */}
      <div className="bg-white w-full max-w-[210mm] shadow-xl print:shadow-none p-8 sm:p-12 print:p-0 mx-auto box-border relative">
        
        {/* KOP SURAT */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-b-4 border-slate-900 pb-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start text-center sm:text-left w-full">
            {/* Logo placeholder */}
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
          <h2 className="text-lg font-bold text-slate-900 uppercase underline underline-offset-4 tracking-wider">Kartu Rencana Studi (KRS)</h2>
        </div>

        {/* Biodata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 text-xs sm:text-sm text-slate-800 mb-6">
          <div className="flex">
            <span className="w-32 font-semibold">Nama Mahasiswa</span>
            <span className="mr-2">:</span>
            <span className="font-medium uppercase">{user?.name || '-'}</span>
          </div>
          <div className="flex">
            <span className="w-32 font-semibold">Fakultas / Prodi</span>
            <span className="mr-2">:</span>
            <span>{user?.faculty || '-'} / {user?.department || '-'}</span>
          </div>
          <div className="flex">
            <span className="w-32 font-semibold">NIM / Email</span>
            <span className="mr-2">:</span>
            <span>{user?.studentId || user?.email || '-'}</span>
          </div>
          <div className="flex">
            <span className="w-32 font-semibold">Semester</span>
            <span className="mr-2">:</span>
            <span className="font-medium">{semesterLabel}</span>
          </div>
        </div>

        {/* Table KRS */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm border-collapse border border-slate-400 mb-6">
            <thead>
              <tr className="bg-slate-100 text-slate-900">
                <th className="border border-slate-400 px-2 py-2 text-center w-10">No</th>
                <th className="border border-slate-400 px-2 py-2 text-center w-24">Kode MK</th>
                <th className="border border-slate-400 px-3 py-2 text-left">Nama Mata Kuliah</th>
                <th className="border border-slate-400 px-2 py-2 text-center w-12">Kelas</th>
                <th className="border border-slate-400 px-2 py-2 text-center w-12">SKS</th>
                <th className="border border-slate-400 px-3 py-2 text-left">Dosen Pengampu</th>
                <th className="border border-slate-400 px-2 py-2 text-center w-20">Status</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.length > 0 ? (
                enrollments.map((en, index) => (
                  <tr key={en.id} className="text-slate-800">
                    <td className="border border-slate-400 px-2 py-1.5 text-center">{index + 1}</td>
                    <td className="border border-slate-400 px-2 py-1.5 font-mono text-center text-xs">{en.class?.course?.code || '-'}</td>
                    <td className="border border-slate-400 px-3 py-1.5 font-medium">{en.class?.course?.title || '-'}</td>
                    <td className="border border-slate-400 px-2 py-1.5 text-center">{en.class?.section || '-'}</td>
                    <td className="border border-slate-400 px-2 py-1.5 text-center">{en.class?.course?.sks || 3}</td>
                    <td className="border border-slate-400 px-3 py-1.5 text-xs">
                      {en.class?.lecturer?.name || en.class?.course?.teacher?.name || '-'}
                    </td>
                    <td className="border border-slate-400 px-2 py-1.5 text-center">
                      <span className="text-[10px] uppercase font-bold tracking-wider">
                        {en.status === 'APPROVED' ? 'Disetujui' : en.status === 'PENDING' ? 'Menunggu' : 'Ditolak'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="border border-slate-400 px-3 py-8 text-center text-slate-500 italic">
                    Belum ada mata kuliah yang diambil pada semester ini.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-bold text-slate-900">
                <td colSpan={4} className="border border-slate-400 px-3 py-2 text-right uppercase tracking-wider">Total SKS</td>
                <td className="border border-slate-400 px-2 py-2 text-center">{totalSKS}</td>
                <td colSpan={2} className="border border-slate-400 px-3 py-2"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Tanda Tangan */}
        <div className="flex justify-between mt-8 text-xs sm:text-sm text-slate-800 px-2 sm:px-8">
          <div className="text-center">
            <p className="mb-16">Menyetujui,<br/>Dosen Pembimbing Akademik</p>
            <p className="font-bold underline underline-offset-2">
              ( .......................................... )
            </p>
            <p className="mt-1">NIP. .....................................</p>
          </div>
          <div className="text-center">
            <p className="mb-16">Serang, {printDate}<br/>Mahasiswa</p>
            <p className="font-bold underline underline-offset-2 uppercase">
              {user?.name || '( .......................................... )'}
            </p>
            <p className="mt-1">NIM. {user?.studentId || '.....................................'}</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PrintKrsPage;
