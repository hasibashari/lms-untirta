import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  GraduationCap,
  Loader2,
  Search,
  User,
  AlertCircle,
  CheckCircle,
  Info,
  Plus,
  FileText,
  Eye,
  X,
} from 'lucide-react';
import { getAvailableCourses, enrollCourse, getMyKRS } from '../../services/mahasiswa.service';

/**
 * KRS (Kartu Rencana Studi) - Improved UX
 * 
 * Alur UX:
 * 1. Tab "KRS Saya" - Menampilkan kelas yang sudah diambil (default view)
 * 2. Tab "Pilih Kelas" - Untuk memilih/menambah kelas baru
 * 
 * Fitur:
 * - Semester selector di kedua tab
 * - Summary SKS dan jumlah kelas
 * - Konfirmasi visual kelas yang sudah dipilih
 */
const KRS = () => {
  const navigate = useNavigate();

  // Tab state: 'my-krs' atau 'select-class'
  const [activeTab, setActiveTab] = useState('my-krs');

  // State untuk semester selection
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [showSemesterDropdown, setShowSemesterDropdown] = useState(false);

  // State untuk data
  const [availableCourses, setAvailableCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // State untuk enrollment
  const [enrolling, setEnrolling] = useState(null);
  const [enrollSuccess, setEnrollSuccess] = useState(null);
  const [enrollError, setEnrollError] = useState(null);

  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [availableRes, enrolledRes] = await Promise.all([
          getAvailableCourses(selectedSemester),
          getMyKRS()
        ]);

        setAvailableCourses(availableRes.data || []);
        setEnrolledCourses(enrolledRes.data || []);
      } catch (err) {
        setError(err?.message || 'Gagal memuat data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedSemester]);

  // Filter enrolled courses by semester
  const enrolledCoursesThisSemester = useMemo(() =>
    enrolledCourses.filter(e => e.course?.semester === selectedSemester),
    [enrolledCourses, selectedSemester]
  );

  // IDs of enrolled courses
  const enrolledCourseIds = useMemo(() =>
    new Set(enrolledCourses.map(e => e.courseId || e.course?.id)),
    [enrolledCourses]
  );

  // Filter available courses (exclude already enrolled)
  const availableCoursesFiltered = useMemo(() =>
    availableCourses.filter(course =>
      !enrolledCourseIds.has(course.id) &&
      (course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.teacher?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    ),
    [availableCourses, enrolledCourseIds, searchQuery]
  );

  // Handle enroll
  const handleEnroll = async (courseId) => {
    setEnrolling(courseId);
    setEnrollError(null);
    setEnrollSuccess(null);

    try {
      const res = await enrollCourse(courseId);
      const enrollment = res.data;

      setEnrolledCourses(prev => [...prev, enrollment]);
      setEnrollSuccess(`Berhasil menambahkan kelas ke KRS!`);

      setTimeout(() => setEnrollSuccess(null), 3000);
    } catch (err) {
      setEnrollError(err?.response?.data?.message || err?.message || 'Gagal menambahkan kelas');
      setTimeout(() => setEnrollError(null), 5000);
    } finally {
      setEnrolling(null);
    }
  };

  // Calculate total SKS for current semester
  const totalSKS = useMemo(() =>
    enrolledCoursesThisSemester.reduce((sum, e) => sum + (e.course?.sks || 3), 0),
    [enrolledCoursesThisSemester]
  );

  // Calculate total SKS all semesters
  const totalSKSAll = useMemo(() =>
    enrolledCourses.reduce((sum, e) => sum + (e.course?.sks || 3), 0),
    [enrolledCourses]
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
            Kartu Rencana Studi (KRS)
          </h1>
          <p className="text-slate-500 mt-1">
            Kelola mata kuliah yang Anda ambil setiap semester
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-xs text-blue-600 font-medium">Total SKS</p>
            <p className="text-lg font-bold text-blue-700">{totalSKSAll}</p>
          </div>
          <div className="px-4 py-2 bg-emerald-50 rounded-lg border border-emerald-100">
            <p className="text-xs text-emerald-600 font-medium">Total Kelas</p>
            <p className="text-lg font-bold text-emerald-700">{enrolledCourses.length}</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl border border-slate-200 p-1.5 inline-flex gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('my-krs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'my-krs'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-slate-600 hover:bg-slate-50'
            }`}
        >
          <FileText size={18} />
          <span>KRS Saya</span>
          {enrolledCoursesThisSemester.length > 0 && (
            <span className={`px-2 py-0.5 text-xs rounded-full ${activeTab === 'my-krs'
              ? 'bg-white/20 text-white'
              : 'bg-blue-100 text-blue-600'
              }`}>
              {enrolledCoursesThisSemester.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('select-class')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'select-class'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-slate-600 hover:bg-slate-50'
            }`}
        >
          <Plus size={18} />
          <span>Pilih Kelas</span>
        </button>
      </div>

      {/* Semester Selector & Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Semester Dropdown */}
        <div className="relative md:col-span-2">
          <button
            type="button"
            onClick={() => setShowSemesterDropdown(!showSemesterDropdown)}
            className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-left hover:border-blue-300 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Calendar size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Semester {selectedSemester}</p>
                <p className="text-sm text-slate-500">Tahun ke-{Math.ceil(selectedSemester / 2)}</p>
              </div>
            </div>
            <ChevronDown size={20} className={`text-slate-400 transition-transform ${showSemesterDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showSemesterDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowSemesterDropdown(false)}
              />
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-20 max-h-64 overflow-y-auto">
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
                    <div>
                      <span className="font-medium">Semester {sem}</span>
                      <span className="text-sm text-slate-500 ml-2">• Tahun ke-{Math.ceil(sem / 2)}</span>
                    </div>
                    {selectedSemester === sem && <Check size={16} />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* SKS Semester Ini */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <GraduationCap size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{totalSKS}</p>
              <p className="text-sm text-slate-500">SKS Sem. {selectedSemester}</p>
            </div>
          </div>
        </div>

        {/* Jumlah Kelas Semester Ini */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
              <BookOpen size={20} className="text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{enrolledCoursesThisSemester.length}</p>
              <p className="text-sm text-slate-500">Kelas Sem. {selectedSemester}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {enrollSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 animate-in slide-in-from-top-2">
          <CheckCircle size={20} className="text-green-600 shrink-0" />
          <p className="text-green-700 flex-1">{enrollSuccess}</p>
          <button onClick={() => setEnrollSuccess(null)} className="text-green-600 hover:text-green-800">
            <X size={18} />
          </button>
        </div>
      )}

      {enrollError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 animate-in slide-in-from-top-2">
          <AlertCircle size={20} className="text-red-600 shrink-0" />
          <p className="text-red-700 flex-1">{enrollError}</p>
          <button onClick={() => setEnrollError(null)} className="text-red-600 hover:text-red-800">
            <X size={18} />
          </button>
        </div>
      )}

      {/* =============== TAB: KRS SAYA =============== */}
      {activeTab === 'my-krs' && (
        <div className="space-y-4">
          {/* Loading State */}
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
                  <div className="flex justify-between items-start">
                    <div className="space-y-3 flex-1">
                      <div className="h-5 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
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

          {/* Empty State - Belum ada kelas */}
          {!loading && !error && enrolledCoursesThisSemester.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <FileText size={40} className="text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Belum Ada Kelas di Semester {selectedSemester}
              </h3>
              <p className="text-slate-500 max-w-md mx-auto mb-6">
                Anda belum mengambil mata kuliah apapun untuk semester ini.
                Mulai dengan memilih kelas yang ingin Anda ambil.
              </p>
              <button
                onClick={() => setActiveTab('select-class')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium"
              >
                <Plus size={20} />
                <span>Pilih Kelas Sekarang</span>
              </button>
            </div>
          )}

          {/* KRS Card - Daftar Kelas yang Diambil */}
          {!loading && !error && enrolledCoursesThisSemester.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {/* KRS Header */}
              <div className="bg-linear-to-r from-blue-600 to-blue-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <h2 className="text-lg font-semibold">KRS Semester {selectedSemester}</h2>
                    <p className="text-blue-100 text-sm">Tahun Akademik 2025/2026</p>
                  </div>
                  <div className="text-right text-white">
                    <p className="text-2xl font-bold">{totalSKS} SKS</p>
                    <p className="text-blue-100 text-sm">{enrolledCoursesThisSemester.length} Mata Kuliah</p>
                  </div>
                </div>
              </div>

              {/* Table Header */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-600">
                <div className="col-span-1">No</div>
                <div className="col-span-2">Kode</div>
                <div className="col-span-4">Mata Kuliah</div>
                <div className="col-span-3">Dosen</div>
                <div className="col-span-1 text-center">SKS</div>
                <div className="col-span-1 text-center">Aksi</div>
              </div>

              {/* KRS Items */}
              <div className="divide-y divide-slate-100">
                {enrolledCoursesThisSemester.map((enrollment, index) => (
                  <div
                    key={enrollment.id || enrollment.courseId}
                    className="px-6 py-4 hover:bg-slate-50 transition"
                  >
                    {/* Desktop View */}
                    <div className="hidden md:grid md:grid-cols-12 gap-4 items-center">
                      <div className="col-span-1 text-slate-500 font-medium">
                        {index + 1}
                      </div>
                      <div className="col-span-2">
                        <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-sm font-mono rounded">
                          {enrollment.course?.code}
                        </span>
                      </div>
                      <div className="col-span-4">
                        <p className="font-medium text-slate-900">{enrollment.course?.title}</p>
                      </div>
                      <div className="col-span-3 text-slate-600">
                        {enrollment.course?.teacher?.name || '-'}
                      </div>
                      <div className="col-span-1 text-center">
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded">
                          {enrollment.course?.sks || 3}
                        </span>
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          onClick={() => navigate(`/mahasiswa/courses/${enrollment.course?.id || enrollment.courseId}`)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Lihat Kelas"
                        >
                          <Eye size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-slate-400 text-sm">#{index + 1}</span>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-mono rounded">
                              {enrollment.course?.code}
                            </span>
                          </div>
                          <p className="font-medium text-slate-900">{enrollment.course?.title}</p>
                        </div>
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded">
                          {enrollment.course?.sks || 3} SKS
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">
                          <User size={14} className="inline mr-1" />
                          {enrollment.course?.teacher?.name || '-'}
                        </span>
                        <button
                          onClick={() => navigate(`/mahasiswa/courses/${enrollment.course?.id || enrollment.courseId}`)}
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Eye size={14} />
                          <span>Lihat</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* KRS Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-sm text-slate-600">
                    <Info size={14} className="inline mr-1" />
                    Klik "Lihat" untuk mengakses materi dan tugas
                  </p>
                  <button
                    onClick={() => setActiveTab('select-class')}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                  >
                    <Plus size={16} />
                    <span>Tambah Kelas Lain</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* =============== TAB: PILIH KELAS =============== */}
      {activeTab === 'select-class' && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari mata kuliah, kode, atau dosen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          {/* Info Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
            <Info size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-700">
              <p className="font-medium">Pilih Mata Kuliah Semester {selectedSemester}</p>
              <p className="text-amber-600">
                Kelas yang sudah Anda ambil tidak akan ditampilkan di sini.
                Klik "Ambil Kelas" untuk menambahkan ke KRS Anda.
              </p>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
                  <div className="flex justify-between items-start">
                    <div className="space-y-3 flex-1">
                      <div className="h-5 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                      <div className="flex gap-4">
                        <div className="h-4 bg-slate-200 rounded w-20"></div>
                        <div className="h-4 bg-slate-200 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="h-10 bg-slate-200 rounded-lg w-28"></div>
                  </div>
                </div>
              ))}
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
          {!loading && !error && availableCoursesFiltered.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <BookOpen size={32} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {searchQuery ? 'Tidak Ditemukan' : 'Semua Kelas Sudah Diambil'}
              </h3>
              <p className="text-slate-500 max-w-sm mx-auto">
                {searchQuery
                  ? `Tidak ada mata kuliah yang cocok dengan "${searchQuery}"`
                  : `Anda sudah mengambil semua kelas yang tersedia untuk semester ${selectedSemester}`
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

          {/* Available Courses List */}
          {!loading && !error && availableCoursesFiltered.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <BookOpen size={16} />
                <span>
                  {availableCoursesFiltered.length} mata kuliah tersedia untuk semester {selectedSemester}
                </span>
              </div>

              {availableCoursesFiltered.map((course) => {
                const isEnrollingThis = enrolling === course.id;

                return (
                  <div
                    key={course.id}
                    className="bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-200 hover:shadow-sm transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                            <BookOpen size={24} className="text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-slate-900">{course.title}</h3>
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded">
                                {course.code}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500">
                              {course.teacher && (
                                <div className="flex items-center gap-1.5">
                                  <User size={14} />
                                  <span>{course.teacher.name}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1.5">
                                <GraduationCap size={14} />
                                <span>{course.sks || 3} SKS</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Clock size={14} />
                                <span>{course.schedule || 'Jadwal menyusul'}</span>
                              </div>
                            </div>

                            {course.description && (
                              <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                                {course.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 md:ml-4">
                        <button
                          type="button"
                          onClick={() => handleEnroll(course.id)}
                          disabled={isEnrollingThis}
                          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                          {isEnrollingThis ? (
                            <>
                              <Loader2 size={18} className="animate-spin" />
                              <span>Mendaftar...</span>
                            </>
                          ) : (
                            <>
                              <Plus size={18} />
                              <span>Ambil Kelas</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <Info size={20} className="text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-medium mb-1">Informasi KRS</p>
          <ul className="list-disc list-inside space-y-1 text-blue-600">
            <li>Tab "KRS Saya" menampilkan kelas yang sudah Anda ambil</li>
            <li>Tab "Pilih Kelas" untuk menambah kelas baru ke KRS</li>
            <li>Gunakan dropdown semester untuk melihat KRS per semester</li>
            <li>Setelah terdaftar, akses materi dan tugas di menu "Kelas Saya"</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default KRS;
