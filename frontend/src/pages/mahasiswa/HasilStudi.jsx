import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  BookOpen,
  Calendar,
  ChevronDown,
  Download,
  Filter,
  GraduationCap,
  Search,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  Check,
} from 'lucide-react';
import { getStudyResults } from '../../services/mahasiswa.service';

/**
 * HasilStudi (Hasil Studi / Academic Transcript)
 * Halaman untuk melihat hasil studi per semester
 * - Pilih semester untuk melihat nilai
 * - Lihat IPK dan IPS
 * - Summary nilai per mata kuliah
 */
const HasilStudi = () => {
  // State untuk semester selection
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [showSemesterDropdown, setShowSemesterDropdown] = useState(false);

  // State untuk data
  const [studyResults, setStudyResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const semesters = ['all', 1, 2, 3, 4, 5, 6, 7, 8];

  // Fetch study results
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await getStudyResults(selectedSemester === 'all' ? null : selectedSemester);
        setStudyResults(res.data || []);
      } catch (err) {
        setError(err?.message || 'Gagal memuat data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedSemester]);

  // Filter results berdasarkan search
  const filteredResults = useMemo(() =>
    studyResults.filter(result =>
      result.courseName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.courseCode?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [studyResults, searchQuery]
  );

  // Calculate statistics
  const stats = useMemo(() => {
    const resultsWithGrade = studyResults.filter(r => r.finalGrade !== null && r.finalGrade !== undefined);

    // Calculate IPS (for selected semester)
    const semesterResults = selectedSemester === 'all'
      ? resultsWithGrade
      : resultsWithGrade.filter(r => r.semester === selectedSemester);

    const totalSKSxGrade = semesterResults.reduce((sum, r) => {
      const gradePoint = getGradePoint(r.finalGrade);
      return sum + (gradePoint * (r.sks || 3));
    }, 0);

    const totalSKS = semesterResults.reduce((sum, r) => sum + (r.sks || 3), 0);
    const ips = totalSKS > 0 ? (totalSKSxGrade / totalSKS).toFixed(2) : '0.00';

    // Calculate IPK (cumulative)
    const allTotalSKSxGrade = resultsWithGrade.reduce((sum, r) => {
      const gradePoint = getGradePoint(r.finalGrade);
      return sum + (gradePoint * (r.sks || 3));
    }, 0);

    const allTotalSKS = resultsWithGrade.reduce((sum, r) => sum + (r.sks || 3), 0);
    const ipk = allTotalSKS > 0 ? (allTotalSKSxGrade / allTotalSKS).toFixed(2) : '0.00';

    return {
      ips,
      ipk,
      totalSKS: allTotalSKS,
      completedCourses: resultsWithGrade.length,
      semesterSKS: totalSKS,
    };
  }, [studyResults, selectedSemester]);

  // Convert numeric grade to letter grade
  const getLetterGrade = (grade) => {
    if (grade === null || grade === undefined) return '-';
    if (grade >= 85) return 'A';
    if (grade >= 80) return 'A-';
    if (grade >= 75) return 'B+';
    if (grade >= 70) return 'B';
    if (grade >= 65) return 'B-';
    if (grade >= 60) return 'C+';
    if (grade >= 55) return 'C';
    if (grade >= 50) return 'C-';
    if (grade >= 45) return 'D';
    return 'E';
  };

  // Convert numeric grade to grade point
  const getGradePoint = (grade) => {
    if (grade === null || grade === undefined) return 0;
    if (grade >= 85) return 4.0;
    if (grade >= 80) return 3.7;
    if (grade >= 75) return 3.3;
    if (grade >= 70) return 3.0;
    if (grade >= 65) return 2.7;
    if (grade >= 60) return 2.3;
    if (grade >= 55) return 2.0;
    if (grade >= 50) return 1.7;
    if (grade >= 45) return 1.0;
    return 0;
  };

  // Get grade color class
  const getGradeColor = (grade) => {
    if (grade === null || grade === undefined) return 'text-slate-400';
    if (grade >= 80) return 'text-green-600';
    if (grade >= 70) return 'text-blue-600';
    if (grade >= 55) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get grade background color
  const getGradeBgColor = (grade) => {
    if (grade === null || grade === undefined) return 'bg-slate-100';
    if (grade >= 80) return 'bg-green-100';
    if (grade >= 70) return 'bg-blue-100';
    if (grade >= 55) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
            Hasil Studi
          </h1>
          <p className="text-slate-500 mt-1">
            Lihat nilai dan pencapaian akademik Anda
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* IPK Card */}
        <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.ipk}</p>
              <p className="text-sm text-blue-100">IPK</p>
            </div>
          </div>
        </div>

        {/* IPS Card */}
        <div className="bg-linear-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Award size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.ips}</p>
              <p className="text-sm text-emerald-100">IPS {selectedSemester !== 'all' && `Sem. ${selectedSemester}`}</p>
            </div>
          </div>
        </div>

        {/* Total SKS Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
              <GraduationCap size={20} className="text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.totalSKS}</p>
              <p className="text-sm text-slate-500">Total SKS</p>
            </div>
          </div>
        </div>

        {/* Completed Courses */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <BookOpen size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.completedCourses}</p>
              <p className="text-sm text-slate-500">MK Selesai</p>
            </div>
          </div>
        </div>
      </div>

      {/* Semester Selector & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Semester Dropdown */}
        <div className="relative w-full md:w-64">
          <button
            type="button"
            onClick={() => setShowSemesterDropdown(!showSemesterDropdown)}
            className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-left hover:border-blue-300 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-slate-400" />
              <span className="font-medium text-slate-700">
                {selectedSemester === 'all' ? 'Semua Semester' : `Semester ${selectedSemester}`}
              </span>
            </div>
            <ChevronDown size={18} className={`text-slate-400 transition-transform ${showSemesterDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showSemesterDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowSemesterDropdown(false)}
              />
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-20">
                {semesters.map(sem => (
                  <button
                    key={sem}
                    type="button"
                    onClick={() => {
                      setSelectedSemester(sem);
                      setShowSemesterDropdown(false);
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-slate-50 transition flex items-center justify-between ${selectedSemester === sem ? 'bg-blue-50 text-blue-600' : 'text-slate-700'
                      }`}
                  >
                    <span>{sem === 'all' ? 'Semua Semester' : `Semester ${sem}`}</span>
                    {selectedSemester === sem && <Check size={16} />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative flex-1">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari mata kuliah atau kode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="animate-pulse">
            <div className="h-12 bg-slate-100 border-b border-slate-200"></div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="px-6 py-4 border-b border-slate-100 flex items-center gap-4">
                <div className="h-5 bg-slate-200 rounded w-16"></div>
                <div className="h-5 bg-slate-200 rounded w-48 flex-1"></div>
                <div className="h-5 bg-slate-200 rounded w-12"></div>
                <div className="h-5 bg-slate-200 rounded w-16"></div>
                <div className="h-5 bg-slate-200 rounded w-12"></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-sm text-red-600 hover:underline"
          >
            Coba lagi
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredResults.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <Award size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {searchQuery ? 'Tidak Ditemukan' : 'Belum Ada Nilai'}
          </h3>
          <p className="text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? `Tidak ada mata kuliah yang cocok dengan "${searchQuery}"`
              : 'Belum ada nilai untuk semester yang dipilih'
            }
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 text-blue-600 hover:underline font-medium"
            >
              Reset Pencarian
            </button>
          )}
        </div>
      )}

      {/* Results Table */}
      {!loading && !error && filteredResults.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-600">
            <div className="col-span-2">Kode</div>
            <div className="col-span-4">Mata Kuliah</div>
            <div className="col-span-1 text-center">SKS</div>
            <div className="col-span-1 text-center">Sem.</div>
            <div className="col-span-2 text-center">Nilai</div>
            <div className="col-span-2 text-center">Grade</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-slate-100">
            {filteredResults.map((result, index) => (
              <div
                key={result.courseId || index}
                className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50 transition"
              >
                <div className="col-span-2">
                  <span className="px-2 py-1 bg-slate-100 text-slate-700 text-sm font-medium rounded">
                    {result.courseCode}
                  </span>
                </div>
                <div className="col-span-4">
                  <p className="font-medium text-slate-900">{result.courseName}</p>
                  {result.teacherName && (
                    <p className="text-sm text-slate-500">{result.teacherName}</p>
                  )}
                </div>
                <div className="col-span-1 text-center text-slate-600">
                  {result.sks || 3}
                </div>
                <div className="col-span-1 text-center text-slate-600">
                  {result.semester || '-'}
                </div>
                <div className="col-span-2 text-center">
                  <span className={`text-lg font-bold ${getGradeColor(result.finalGrade)}`}>
                    {result.finalGrade !== null && result.finalGrade !== undefined
                      ? result.finalGrade
                      : '-'}
                  </span>
                </div>
                <div className="col-span-2 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className={`inline-flex items-center justify-center w-10 h-10 rounded-lg font-bold text-lg ${getGradeBgColor(result.finalGrade)} ${getGradeColor(result.finalGrade)}`}>
                      {getLetterGrade(result.finalGrade)}
                    </span>
                    <span className="text-sm text-slate-500">
                      ({getGradePoint(result.finalGrade).toFixed(1)})
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Table Footer - Summary */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">
                Menampilkan {filteredResults.length} mata kuliah
              </span>
              <div className="flex items-center gap-6">
                <span className="text-slate-600">
                  Total SKS: <span className="font-semibold text-slate-900">{stats.semesterSKS}</span>
                </span>
                <span className="text-slate-600">
                  IPS: <span className="font-semibold text-blue-600">{stats.ips}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grade Legend */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Keterangan Nilai</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          {[
            { grade: 'A', range: '≥ 85', point: '4.00', color: 'green' },
            { grade: 'A-', range: '80-84', point: '3.70', color: 'green' },
            { grade: 'B+', range: '75-79', point: '3.30', color: 'blue' },
            { grade: 'B', range: '70-74', point: '3.00', color: 'blue' },
            { grade: 'B-', range: '65-69', point: '2.70', color: 'blue' },
            { grade: 'C+', range: '60-64', point: '2.30', color: 'yellow' },
            { grade: 'C', range: '55-59', point: '2.00', color: 'yellow' },
            { grade: 'C-', range: '50-54', point: '1.70', color: 'yellow' },
            { grade: 'D', range: '45-49', point: '1.00', color: 'red' },
            { grade: 'E', range: '< 45', point: '0.00', color: 'red' },
          ].map(item => (
            <div key={item.grade} className="flex items-center gap-2">
              <span className={`w-8 h-8 rounded flex items-center justify-center font-bold bg-${item.color}-100 text-${item.color}-600`}>
                {item.grade}
              </span>
              <div>
                <p className="text-slate-700">{item.range}</p>
                <p className="text-slate-500 text-xs">Bobot: {item.point}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HasilStudi;
