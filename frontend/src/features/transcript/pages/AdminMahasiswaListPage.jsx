import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Loader2, AlertCircle, Search, GraduationCap, Users, ChevronRight,
} from 'lucide-react';
import { getStudentList } from '../transcriptService';
import DashboardJumbotron from '@/components/shared/DashboardJumbotron';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

// ============================================================
// Admin Student List Page (for transcript browsing)
// ============================================================

const AdminStudentListPage = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getStudentList({ search: searchQuery || undefined });
        setStudents(res.data || []);
      } catch (err) {
        setError(err?.message || 'Gagal memuat daftar mahasiswa');
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [searchQuery]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <DashboardJumbotron
        icon={GraduationCap}
        title="Transkrip Mahasiswa"
        subtitle="Lihat transkrip akademik dan rekap nilai mahasiswa"
      />

      {/* Search + Stats */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-full sm:w-80 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama atau email mahasiswa..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {!loading && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Users size={16} />
              <span>{students.length} mahasiswa ditemukan</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-slate-500">Memuat daftar mahasiswa...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Users size={32} className="text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">
            {searchQuery ? 'Tidak ditemukan mahasiswa yang cocok' : 'Belum ada mahasiswa terdaftar'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* Mobile Card View */}
          <div className="lg:hidden divide-y divide-slate-100">
            {students.map(student => (
              <div
                key={student.id}
                className="p-4 hover:bg-slate-50 cursor-pointer transition flex items-center gap-3"
                onClick={() => navigate(`/admin/transcript/${student.id}`)}
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <span className="text-blue-700 font-bold text-sm">
                    {student.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{student.name}</p>
                  <p className="text-sm text-slate-500 truncate">{student.nim || student.email}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs text-slate-400">
                      {student.totalEnrollments + student.totalKrsEnrollments} MK
                    </span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-400 shrink-0" />
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-12 text-center">No.</TableHead>
                  <TableHead>Nama Mahasiswa</TableHead>
                  <TableHead>NIM</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-center">Enrollment</TableHead>
                  <TableHead className="text-center">KRS</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student, index) => (
                  <TableRow
                    key={student.id}
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => navigate(`/admin/transcript/${student.id}`)}
                  >
                    <TableCell className="text-center text-slate-500 text-sm">{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                          <span className="text-blue-700 font-bold text-xs">
                            {student.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-slate-900">{student.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600 font-mono">{student.nim || '-'}</TableCell>
                    <TableCell className="text-sm text-slate-600">{student.email}</TableCell>
                    <TableCell className="text-center text-sm">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                        {student.totalEnrollments}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      <span className="px-2 py-0.5 bg-violet-50 text-violet-700 rounded-full text-xs font-medium">
                        {student.totalKrsEnrollments}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <ChevronRight size={16} className="text-slate-400" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStudentListPage;
