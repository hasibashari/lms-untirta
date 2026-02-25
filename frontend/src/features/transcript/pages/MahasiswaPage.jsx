import { useEffect, useState, useMemo } from 'react';
import {
  Award,
  Printer,
  Calculator,
  AlertCircle,
  Loader2,
  FileText,
} from 'lucide-react';
import { getStudyResults } from '../transcriptService';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import CourseBadge from '@/components/ui/CourseBadge';
import SectionHeader from '@/components/ui/SectionHeader';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

/**
 * StudyResult (Hasil Studi / Academic Transcript)
 * Menampilkan hasil studi berdasarkan data KRS dengan nilai
 * Layout mengikuti referensi SIAKAD
 */
const StudyResult = () => {
  const { user } = useAuth();

  // State untuk data
  const [studyResults, setStudyResults] = useState([]);
  const [studentIdentity, setStudentIdentity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Resolve student display info from API response + auth context
  const studentInfo = useMemo(() => {
    const name = studentIdentity?.name || user?.name || '-';
    const nim = studentIdentity?.nim || user?.nim || user?.email || '-';
    return { name, nim };
  }, [studentIdentity, user]);

  // Fetch study results (using KRS data with grades)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await getStudyResults();
        // API returns { student: {...}, courses: [...], summary: {...} }
        const resData = res?.data;
        if (resData?.student) {
          setStudentIdentity(resData.student);
        }
        const data = resData?.courses || resData || [];
        setStudyResults(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err?.message || 'Gagal memuat data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate statistics
  const stats = useMemo(() => {
    const data = Array.isArray(studyResults) ? studyResults : [];
    const resultsWithGrade = data.filter(r => r.averageScore !== null && r.averageScore !== undefined);

    const totalSKSxGrade = resultsWithGrade.reduce((sum, r) => {
      return sum + ((r.gradePoint || 0) * (r.sks || 3));
    }, 0);

    const totalSKS = resultsWithGrade.reduce((sum, r) => sum + (r.sks || 3), 0);
    const ips = totalSKS > 0 ? (totalSKSxGrade / totalSKS).toFixed(2) : '0.00';

    // IPK kumulatif: dihitung dari seluruh mata kuliah yang ada di data
    // (same as IPS when viewing a single semester; cumulative when showing all)
    const allWithGrade = data.filter(r => r.averageScore !== null && r.averageScore !== undefined);
    const cumulativeSKSxGrade = allWithGrade.reduce((sum, r) => sum + ((r.gradePoint || 0) * (r.sks || 3)), 0);
    const cumulativeSKS = allWithGrade.reduce((sum, r) => sum + (r.sks || 3), 0);
    const ipk = cumulativeSKS > 0 ? (cumulativeSKSxGrade / cumulativeSKS).toFixed(2) : '0.00';

    return {
      ips,
      ipk,
      totalSKS,
      totalCourses: data.length,
    };
  }, [studyResults]);

  // Handle print transcript
  const handlePrintTranscript = () => {
    window.print();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">
          Hasil Studi
        </h1>
        <p className="text-slate-500 mt-1 text-sm sm:text-base">
          Dashboard &gt; Hasil Studi
        </p>
      </div>

      {/* Print Transcript Button Card */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 sm:p-6">
        <Button
          onClick={handlePrintTranscript}
          className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
        >
          <Printer size={16} />
          <span>Cetak Transkrip Sementara</span>
        </Button>
      </div>

      {/* ============ SECTION: DAFTAR HASIL STUDI ============ */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <SectionHeader
          title="DAFTAR HASIL STUDI"
          subtitle={`${studentInfo.name} (${studentInfo.nim})`}
        />

        {/* Action Buttons */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center gap-2 sm:gap-3">
          {/* KHS Button */}
          <Button
            variant="outline"
            className="flex items-center gap-2 border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            <Printer size={16} />
            <span>KHS</span>
          </Button>

          {/* Hitung IPS Button */}
          <Button
            variant="outline"
            className="flex items-center gap-2 border-cyan-200 text-cyan-600 hover:bg-cyan-50"
          >
            <Calculator size={16} />
            <span>Hitung IPS</span>
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="p-8 sm:p-12 text-center">
            <Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-3" />
            <p className="text-slate-500">Memuat data hasil studi...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-8 sm:p-12 text-center">
            <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
            <p className="text-red-600 font-medium">{error}</p>
            <Button
              variant="link"
              onClick={() => window.location.reload()}
              className="mt-3 text-sm text-red-600"
            >
              Coba lagi
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && studyResults.length === 0 && (
          <div className="p-8 sm:p-12 text-center">
            <Award size={32} className="text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">Belum ada data hasil studi</p>
          </div>
        )}

        {/* Results Table */}
        {!loading && !error && studyResults.length > 0 && (
          <>
            {/* Mobile Card View */}
            <div className="lg:hidden divide-y divide-slate-100">
              {studyResults.map((result, index) => (
                <div key={result.courseId || result.id || index} className="p-4 hover:bg-slate-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-slate-500 font-medium text-sm">#{index + 1}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500 text-sm font-mono">{result.courseCode || result.course?.code}</span>
                      </div>
                      <h4 className="font-semibold text-slate-900 mb-2">{result.courseName || result.course?.title}</h4>
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        <CourseBadge variant="purple">{result.sks || result.course?.sks || 3} SKS</CourseBadge>
                      </div>
                      {(result.teacherName || result.course?.teacher?.name) && (
                        <p className="text-sm text-slate-600">Dosen: {result.teacherName || result.course?.teacher?.name}</p>
                      )}
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
                        <div>
                          <p className="text-xs text-slate-500">Nilai</p>
                          <p className="text-lg font-bold text-slate-900">
                            {result.averageScore !== null && result.averageScore !== undefined
                              ? result.averageScore
                              : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Mutu</p>
                          <p className="text-lg font-bold text-slate-900">
                            {result.letterGrade || '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-16 text-center">No.</TableHead>
                    <TableHead className="w-32">Kode Jadwal</TableHead>
                    <TableHead>Mata Kuliah</TableHead>
                    <TableHead>Dosen</TableHead>
                    <TableHead className="w-24 text-center">Nilai</TableHead>
                    <TableHead className="w-20 text-center">Mutu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studyResults.map((result, index) => (
                    <TableRow key={result.courseId || result.id || index} className="hover:bg-slate-50">
                      <TableCell className="text-center text-slate-600 font-medium">
                        {index + 1}
                      </TableCell>
                      <TableCell className="text-slate-700 font-mono text-sm">
                        {result.scheduleCode || result.courseCode || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div>
                            <span className="font-semibold text-slate-900">{result.courseName || result.course?.title}</span>
                            {(result.courseCode || result.course?.code) && (
                              <span className="text-slate-500 ml-1">({result.courseCode || result.course?.code})</span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <CourseBadge variant="purple">{result.sks || result.course?.sks || 3} SKS</CourseBadge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {(result.teacherName || result.course?.teacher?.name) ? (
                          <span className="text-slate-600">1. {result.teacherName || result.course?.teacher?.name}</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-slate-900 font-medium">
                          {result.averageScore !== null && result.averageScore !== undefined
                            ? result.averageScore
                            : '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-slate-900 font-medium">
                          {result.letterGrade || '-'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* IP Row */}
            <div className="px-4 sm:px-6 py-4 bg-blue-50 border-t border-slate-200">
              <div className="flex justify-center">
                <span className="text-slate-700">
                  <span className="font-semibold">IP</span> : <span className="font-bold text-lg">{stats.ips}</span>
                </span>
              </div>
            </div>

            {/* IPK Row */}
            <div className="px-4 sm:px-6 py-4 bg-slate-50 border-t border-slate-200">
              <div className="flex justify-center">
                <span className="text-slate-700">
                  <span className="font-semibold">IPK</span> : <span className="font-bold text-lg">{stats.ipk}</span>
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StudyResult;
