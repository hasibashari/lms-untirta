import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  UserPlus,
  Mail,
  X,
  CheckCircle,
  AlertCircle,
  User,
  ChevronDown,
} from 'lucide-react';
import { getCourseStudents, enrollStudent, getAvailableStudents } from '../../services/dosen.service';
import Breadcrumb from '../../components/navigation/Breadcrumb';

/**
 * Students - Daftar Mahasiswa Kelas (Dosen)
 * Menampilkan daftar mahasiswa dan fitur tambah mahasiswa
 */
export default function Students() {
  const { courseId } = useParams();

  // State untuk data
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // State untuk modal tambah
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [availableStudents, setAvailableStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState(null);
  const [enrollSuccess, setEnrollSuccess] = useState(null);

  // Fetch students
  useEffect(() => {
    if (!courseId || courseId === 'undefined') return;

    setLoading(true);
    getCourseStudents(courseId)
      .then(res => {
        // API returns: [{ enrollmentId, enrolledAt, student: { id, name, email } }]
        // Transform to flat structure: [{ id, name, email, enrollmentId, enrolledAt }]
        const enrollments = res.data || [];
        const studentList = enrollments.map(enrollment => ({
          id: enrollment.student?.id,
          name: enrollment.student?.name,
          email: enrollment.student?.email,
          enrollmentId: enrollment.enrollmentId,
          enrolledAt: enrollment.enrolledAt,
        }));
        setStudents(studentList);
      })
      .catch(err => setError(err?.message || 'Gagal memuat data'))
      .finally(() => setLoading(false));
  }, [courseId]);

  // Filter students by search
  const filteredStudents = students.filter(student =>
    student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Fetch available students saat modal dibuka
  const fetchAvailableStudents = async () => {
    if (!courseId || courseId === 'undefined') return;
    setLoadingStudents(true);
    try {
      const res = await getAvailableStudents(courseId);
      setAvailableStudents(res.data || []);
    } catch (err) {
      setEnrollError('Gagal memuat daftar mahasiswa');
    } finally {
      setLoadingStudents(false);
    }
  };

  // Fetch available students saat modal dibuka
  useEffect(() => {
    if (showAddModal) {
      fetchAvailableStudents();
    }
  }, [showAddModal, courseId]);

  // Handle enroll student
  const handleEnroll = async (e) => {
    e.preventDefault();

    if (!selectedStudentId) {
      setEnrollError('Pilih mahasiswa terlebih dahulu');
      return;
    }

    if (!courseId || courseId === 'undefined') return;

    setEnrolling(true);
    setEnrollError(null);
    setEnrollSuccess(null);

    try {
      // Kirim studentId ke backend (bukan email)
      const res = await enrollStudent(courseId, { studentId: selectedStudentId });
      // Response structure from API: { enrollmentId, enrolledAt, student: { id, name, email } }
      const enrollmentData = res.data;

      if (enrollmentData) {
        // Transform to match the same structure as fetched students
        const newStudent = {
          id: enrollmentData.student?.id,
          name: enrollmentData.student?.name,
          email: enrollmentData.student?.email,
          enrollmentId: enrollmentData.enrollmentId,
          enrolledAt: enrollmentData.enrolledAt,
        };

        setStudents(prev => [...prev, newStudent]);
        setEnrollSuccess(`${newStudent.name} berhasil ditambahkan!`);
        setSelectedStudentId('');

        // Refresh available students (hapus yang sudah enrolled)
        setAvailableStudents(prev => prev.filter(s => s.id !== newStudent.id));

        // Auto close modal after 2 seconds on success
        setTimeout(() => {
          setShowAddModal(false);
          setEnrollSuccess(null);
        }, 2000);
      }
    } catch (err) {
      setEnrollError(
        err?.response?.data?.message || err?.message || 'Gagal menambahkan mahasiswa'
      );
    } finally {
      setEnrolling(false);
    }
  };

  // Reset modal state when closing
  const closeModal = () => {
    setShowAddModal(false);
    setSelectedStudentId('');
    setAvailableStudents([]);
    setEnrollError(null);
    setEnrollSuccess(null);
  };

  if (!courseId || courseId === 'undefined') {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-slate-500">Memuat data kelas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Dashboard', to: '/dosen/dashboard' },
          { label: 'Kelas Saya', to: '/dosen/classes' },
          { label: 'Kelas', to: `/dosen/courses/${courseId}` },
          { label: 'Mahasiswa' },
        ]}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
            Daftar Mahasiswa
          </h1>
          <p className="text-slate-500 mt-1">
            Kelola mahasiswa yang terdaftar di kelas ini
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition shadow-lg shadow-blue-200"
        >
          <UserPlus size={20} />
          Tambah Mahasiswa
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Cari nama atau email mahasiswa..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

      {/* Students Count */}
      {!loading && !error && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Users size={16} />
          <span>
            {filteredStudents.length} dari {students.length} mahasiswa
          </span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-slate-200 rounded w-1/3"></div>
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
      {!loading && !error && students.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <Users size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Belum Ada Mahasiswa
          </h3>
          <p className="text-slate-500 max-w-sm mx-auto mb-6">
            Belum ada mahasiswa yang terdaftar di kelas ini. Tambahkan mahasiswa menggunakan email mereka.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <UserPlus size={18} />
            Tambah Mahasiswa Pertama
          </button>
        </div>
      )}

      {/* No Search Results */}
      {!loading && !error && students.length > 0 && filteredStudents.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <Search size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Tidak Ditemukan
          </h3>
          <p className="text-slate-500">
            Tidak ada mahasiswa yang cocok dengan "{searchQuery}"
          </p>
        </div>
      )}

      {/* Students List */}
      {!loading && !error && filteredStudents.length > 0 && (
        <div className="space-y-3">
          {filteredStudents.map((student, index) => (
            <StudentCard key={student.id || index} student={student} />
          ))}
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <UserPlus size={20} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Tambah Mahasiswa</h2>
                  <p className="text-sm text-slate-500">Pilih mahasiswa dari daftar</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleEnroll} className="p-6 space-y-4">
              {/* Success Message */}
              {enrollSuccess && (
                <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <CheckCircle size={20} className="text-emerald-600 shrink-0" />
                  <p className="text-emerald-700 font-medium">{enrollSuccess}</p>
                </div>
              )}

              {/* Error Message */}
              {enrollError && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle size={20} className="text-red-600 shrink-0" />
                  <p className="text-red-700">{enrollError}</p>
                </div>
              )}

              {/* Student Select Dropdown */}
              {!enrollSuccess && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Pilih Mahasiswa <span className="text-red-500">*</span>
                    </label>
                    {loadingStudents ? (
                      <div className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                        Memuat daftar mahasiswa...
                      </div>
                    ) : availableStudents.length === 0 ? (
                      <div className="w-full px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                        Semua mahasiswa sudah terdaftar di kelas ini
                      </div>
                    ) : (
                      <div className="relative">
                        <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <select
                          value={selectedStudentId}
                          onChange={(e) => {
                            setSelectedStudentId(e.target.value);
                            setEnrollError(null);
                          }}
                          className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none cursor-pointer"
                          required
                        >
                          <option value="">-- Pilih Mahasiswa --</option>
                          {availableStudents.map(student => (
                            <option key={student.id} value={student.id}>
                              {student.name} ({student.email})
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    )}
                    <p className="text-xs text-slate-500 mt-1.5">
                      Hanya mahasiswa yang belum terdaftar di kelas ini yang ditampilkan
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl font-medium transition"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={enrolling || !selectedStudentId || loadingStudents}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {enrolling ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Menambahkan...
                        </>
                      ) : (
                        <>
                          <Plus size={18} />
                          Tambah Mahasiswa
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Tips Section */}
      {!loading && students.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
          <h4 className="font-semibold text-blue-900 mb-2">💡 Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Mahasiswa harus sudah memiliki akun di sistem sebelum bisa ditambahkan</li>
            <li>• Gunakan fitur pencarian untuk menemukan mahasiswa dengan cepat</li>
            <li>• Mahasiswa yang sudah terdaftar akan muncul otomatis di daftar</li>
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * StudentCard - Card untuk setiap mahasiswa
 */
function StudentCard({ student }) {
  // Generate avatar color based on name
  const colors = [
    'bg-blue-500',
    'bg-emerald-500',
    'bg-violet-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-cyan-500',
  ];
  const colorIndex = student.name ? student.name.charCodeAt(0) % colors.length : 0;
  const avatarColor = colors[colorIndex];

  // Get initials
  const initials = student.name
    ? student.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
    : '??';

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all overflow-hidden">
      <div className="flex items-center gap-4 p-5">
        {/* Avatar */}
        <div className={`shrink-0 w-12 h-12 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold`}>
          {initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 truncate">
            {student.name || 'Nama tidak tersedia'}
          </h3>
          <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-0.5">
            <Mail size={14} />
            <span className="truncate">{student.email}</span>
          </div>
        </div>

        {/* Status Badge (optional, for future use) */}
        <div className="shrink-0">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            Aktif
          </span>
        </div>
      </div>
    </div>
  );
}
