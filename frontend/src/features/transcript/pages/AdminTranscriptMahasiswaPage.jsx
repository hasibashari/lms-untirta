import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Loader2, AlertCircle, ArrowLeft, GraduationCap, BookOpen,
  Award, TrendingUp, Printer, ChevronDown, ChevronUp,
} from 'lucide-react';
import { getStudentTranscript } from '../api/transcript.api';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/shared/components/ui/table';

// ============================================================
// Admin Student Transcript Detail Page
// ============================================================

// Grade color utility
const getGradeColor = (grade) => {
  if (!grade || grade === '-') return 'text-slate-400';
  if (grade === 'A' || grade === 'A-') return 'text-green-600';
  if (grade.startsWith('B')) return 'text-blue-600';
  if (grade.startsWith('C')) return 'text-amber-600';
  return 'text-red-600';
};

const getGradeBg = (grade) => {
  if (!grade || grade === '-') return 'bg-slate-50';
  if (grade === 'A' || grade === 'A-') return 'bg-green-50';
  if (grade.startsWith('B')) return 'bg-blue-50';
  if (grade.startsWith('C')) return 'bg-amber-50';
  return 'bg-red-50';
};

const AdminStudentTranscriptPage = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSemester, setExpandedSemester] = useState(null);

  useEffect(() => {
    const fetchTranscript = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getStudentTranscript(studentId);
        setData(res.data);
      } catch (err) {
        setError(err?.message || 'Gagal memuat transkrip');
      } finally {
        setLoading(false);
      }
    };
    fetchTranscript();
  }, [studentId]);

  // Group courses by semester
  const semesterGroups = useMemo(() => {
    if (!data?.courses) return [];
    const map = new Map();
    for (const course of data.courses) {
      const key = course.semester || 0;
      if (!map.has(key)) {
        map.set(key, { semester: key, courses: [], totalSKS: 0, totalPoints: 0, completed: 0 });
      }
      const group = map.get(key);
      group.courses.push(course);
      if (course.averageScore !== null) {
        group.totalSKS += course.sks;
        group.totalPoints += course.gradePoint * course.sks;
        group.completed++;
      }
    }
    return Array.from(map.values())
      .sort((a, b) => a.semester - b.semester)
      .map(g => ({
        ...g,
        ips: g.totalSKS > 0
          ? Math.round((g.totalPoints / g.totalSKS) * 100) / 100
          : 0,
      }));
  }, [data]);

  // Grade distribution for chart
  const gradeDistribution = data?.gradeDistribution || {};
  const maxGradeCount = Math.max(...Object.values(gradeDistribution), 1);

  const gradeColors = {
    'A': 'bg-green-500',
    'A-': 'bg-green-400',
    'B+': 'bg-blue-500',
    'B': 'bg-blue-400',
    'B-': 'bg-blue-300',
    'C+': 'bg-amber-500',
    'C': 'bg-amber-400',
    'D': 'bg-orange-500',
    'E': 'bg-red-500',
    '-': 'bg-slate-300',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-slate-500">Memuat transkrip...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/admin/transcript')}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={16} /> Kembali
        </button>
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { student, summary } = data;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/admin/transcript')}
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition"
      >
        <ArrowLeft size={16} /> Kembali ke Daftar Mahasiswa
      </button>

      {/* Student Profile Header */}
      <div className="bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800 text-white rounded-2xl p-6 lg:p-8 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-64 h-32 bg-white/5 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <span className="text-2xl font-bold">{student.name.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold">{student.name}</h1>
              {student.nim && (
                <p className="text-blue-100 text-sm font-mono">{student.nim}</p>
              )}
              <p className="text-blue-100/80 text-sm">{student.email}</p>
            </div>
          </div>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-lg text-sm font-medium transition"
          >
            <Printer size={16} /> Cetak Transkrip
          </button>
        </div>
      </div>

      {/* Academic Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Award size={18} className="text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900">{summary.ipk.toFixed(2)}</p>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">IPK (Cumulative GPA)</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
              <BookOpen size={18} className="text-blue-600" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900">{summary.totalSKS}</p>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Total SKS Selesai</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center">
              <GraduationCap size={18} className="text-violet-600" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900">{summary.completedCourses}</p>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">MK Selesai</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
              <TrendingUp size={18} className="text-amber-600" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900">
            {summary.ipk >= 3.5 ? 'Cum Laude' : summary.ipk >= 3.0 ? 'Sangat Baik' : summary.ipk >= 2.5 ? 'Baik' : 'Cukup'}
          </p>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Predikat</p>
        </div>
      </div>

      {/* Grade Distribution */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Distribusi Nilai</h3>
        <div className="flex items-end gap-2 sm:gap-3 h-32 sm:h-40">
          {Object.entries(gradeDistribution)
            .filter(([grade]) => grade !== '-')
            .map(([grade, count]) => (
              <div key={grade} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-medium text-slate-600">{count}</span>
                <div
                  className={`w-full rounded-t-md transition-all ${gradeColors[grade] || 'bg-slate-300'}`}
                  style={{
                    height: `${Math.max((count / maxGradeCount) * 100, 4)}%`,
                    minHeight: count > 0 ? '8px' : '2px',
                  }}
                />
                <span className="text-xs font-semibold text-slate-700">{grade}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Semester-by-Semester Breakdown */}
      <div className="space-y-3">
        <h3 className="font-semibold text-slate-900 text-lg">Nilai per Semester</h3>
        {semesterGroups.map(group => {
          const isExpanded = expandedSemester === group.semester;
          return (
            <div key={group.semester} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div
                className="flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-slate-50 transition"
                onClick={() => setExpandedSemester(isExpanded ? null : group.semester)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <span className="text-blue-700 font-bold text-sm">{group.semester}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Semester {group.semester}</p>
                    <p className="text-sm text-slate-500">{group.courses.length} mata kuliah</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex items-center gap-3">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                      {group.totalSKS} SKS
                    </span>
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                      IPS: {group.ips.toFixed(2)}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp size={18} className="text-slate-400" />
                  ) : (
                    <ChevronDown size={18} className="text-slate-400" />
                  )}
                </div>
              </div>

              {/* Mobile stats */}
              {!isExpanded && (
                <div className="flex sm:hidden items-center gap-2 px-4 pb-3">
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                    {group.totalSKS} SKS
                  </span>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                    IPS: {group.ips.toFixed(2)}
                  </span>
                </div>
              )}

              {isExpanded && (
                <div className="border-t border-slate-100">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/50">
                          <TableHead className="w-12">No.</TableHead>
                          <TableHead>Kode</TableHead>
                          <TableHead>Mata Kuliah</TableHead>
                          <TableHead className="text-center">SKS</TableHead>
                          <TableHead className="text-center">Nilai</TableHead>
                          <TableHead className="text-center">Huruf</TableHead>
                          <TableHead className="text-center">Bobot</TableHead>
                          <TableHead>Dosen</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.courses.map((course, idx) => (
                          <TableRow key={course.courseId} className="hover:bg-slate-50">
                            <TableCell className="text-slate-500 text-sm">{idx + 1}</TableCell>
                            <TableCell className="font-mono text-sm text-slate-600">
                              {course.courseCode}
                            </TableCell>
                            <TableCell>
                              <p className="font-medium text-slate-900">{course.courseName}</p>
                              {course.source === 'krs' && course.section && (
                                <p className="text-xs text-slate-400">
                                  Kelas {course.section} | {course.academicYear} {course.semesterType}
                                </p>
                              )}
                            </TableCell>
                            <TableCell className="text-center font-medium">{course.sks}</TableCell>
                            <TableCell className="text-center">
                              {course.averageScore !== null ? (
                                <span className="font-medium">{course.averageScore}</span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <span
                                className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold ${getGradeBg(course.letterGrade)} ${getGradeColor(course.letterGrade)}`}
                              >
                                {course.letterGrade}
                              </span>
                            </TableCell>
                            <TableCell className="text-center text-sm font-medium text-slate-700">
                              {course.gradePoint.toFixed(1)}
                            </TableCell>
                            <TableCell className="text-sm text-slate-600">
                              {course.teacherName}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="px-4 sm:px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-sm">
                    <span className="text-slate-600">
                      Total: <strong>{group.courses.length}</strong> MK | <strong>{group.totalSKS}</strong> SKS
                    </span>
                    <span className="font-semibold text-emerald-700">
                      IPS: {group.ips.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Full transcript table (all courses) */}
      {data.courses.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Rekap Seluruh Nilai</h3>
            <p className="text-sm text-slate-500 mt-1">
              Total {data.courses.length} mata kuliah — IPK {summary.ipk.toFixed(2)}
            </p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-12">No.</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead>Mata Kuliah</TableHead>
                  <TableHead className="text-center">Smt</TableHead>
                  <TableHead className="text-center">SKS</TableHead>
                  <TableHead className="text-center">Nilai</TableHead>
                  <TableHead className="text-center">Huruf</TableHead>
                  <TableHead className="text-center">Bobot</TableHead>
                  <TableHead>Dosen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.courses.map((course, idx) => (
                  <TableRow key={`${course.courseId}-${course.source || idx}`} className="hover:bg-slate-50">
                    <TableCell className="text-slate-500 text-sm">{idx + 1}</TableCell>
                    <TableCell className="font-mono text-sm text-slate-600">
                      {course.courseCode}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">{course.courseName}</TableCell>
                    <TableCell className="text-center text-sm">{course.semester || '-'}</TableCell>
                    <TableCell className="text-center font-medium">{course.sks}</TableCell>
                    <TableCell className="text-center">
                      {course.averageScore !== null ? (
                        <span className="font-medium">{course.averageScore}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold ${getGradeBg(course.letterGrade)} ${getGradeColor(course.letterGrade)}`}
                      >
                        {course.letterGrade}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-sm font-medium text-slate-700">
                      {course.gradePoint.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{course.teacherName}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="px-4 sm:px-6 py-4 bg-slate-50 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-6 text-sm">
                <span className="text-slate-600">Total MK: <strong className="text-slate-900">{summary.totalCourses}</strong></span>
                <span className="text-slate-600">Total SKS: <strong className="text-slate-900">{summary.totalSKS}</strong></span>
                <span className="text-slate-600">MK Selesai: <strong className="text-slate-900">{summary.completedCourses}</strong></span>
              </div>
              <div className="text-lg font-bold text-emerald-700">IPK: {summary.ipk.toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStudentTranscriptPage;
