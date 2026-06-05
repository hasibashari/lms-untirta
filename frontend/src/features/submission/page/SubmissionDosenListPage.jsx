import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Users,
  Search,
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Download,
  ExternalLink,
  Filter,
  Star,
  MessageSquare,
  Save,
  Check,
  AlertCircle,
  Eye,
  File,
  Image,
  Archive,
  Github,
} from 'lucide-react';
import {
  getSubmissions,
  gradeSubmission,
} from '../submissionService';
import { getAssignments } from '../../assignment/assignmentService';
import Breadcrumb from '@/shared/components/navigation/Breadcrumb';

/**
 * FilePreviewCard - Component untuk menampilkan file yang dikumpulkan dengan UX yang lebih baik
 */
function FilePreviewCard({ url }) {
  // Detect file type dari URL
  const getFileInfo = (fileUrl) => {
    if (!fileUrl) return { type: 'unknown', name: 'File', icon: File, color: 'slate' };

    const urlLower = fileUrl.toLowerCase();

    // Google Drive
    if (urlLower.includes('drive.google.com') || urlLower.includes('docs.google.com')) {
      // Extract file ID untuk preview
      const fileIdMatch = fileUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
      const fileId = fileIdMatch ? fileIdMatch[1] : null;
      return {
        type: 'google',
        name: 'Google Drive File',
        icon: FileText,
        color: 'blue',
        fileId,
        previewUrl: fileId ? `https://drive.google.com/file/d/${fileId}/preview` : null
      };
    }

    // GitHub
    if (urlLower.includes('github.com')) {
      const repoMatch = fileUrl.match(/github\.com\/([^/]+\/[^/]+)/);
      return {
        type: 'github',
        name: repoMatch ? repoMatch[1] : 'GitHub Repository',
        icon: Github,
        color: 'gray'
      };
    }

    // PDF
    if (urlLower.endsWith('.pdf')) {
      const fileName = fileUrl.split('/').pop() || 'Document.pdf';
      return {
        type: 'pdf',
        name: fileName,
        icon: FileText,
        color: 'red',
        previewUrl: fileUrl
      };
    }

    // Images
    if (urlLower.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      const fileName = fileUrl.split('/').pop() || 'Image';
      return {
        type: 'image',
        name: fileName,
        icon: Image,
        color: 'green',
        previewUrl: fileUrl
      };
    }

    // Archives
    if (urlLower.match(/\.(zip|rar|7z|tar|gz)$/)) {
      const fileName = fileUrl.split('/').pop() || 'Archive';
      return { type: 'archive', name: fileName, icon: Archive, color: 'amber' };
    }

    // Word documents
    if (urlLower.match(/\.(doc|docx)$/)) {
      const fileName = fileUrl.split('/').pop() || 'Document';
      return { type: 'word', name: fileName, icon: FileText, color: 'blue' };
    }

    // PowerPoint
    if (urlLower.match(/\.(ppt|pptx)$/)) {
      const fileName = fileUrl.split('/').pop() || 'Presentation';
      return { type: 'ppt', name: fileName, icon: FileText, color: 'orange' };
    }

    // Default link
    try {
      const urlObj = new URL(fileUrl);
      return { type: 'link', name: urlObj.hostname, icon: ExternalLink, color: 'violet' };
    } catch {
      return { type: 'link', name: 'External Link', icon: ExternalLink, color: 'violet' };
    }
  };

  const fileInfo = getFileInfo(url);
  const IconComponent = fileInfo.icon;

  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    violet: 'bg-violet-50 border-violet-200 text-violet-700',
    gray: 'bg-slate-50 border-slate-200 text-slate-700',
    slate: 'bg-slate-50 border-slate-200 text-slate-700',
  };

  const iconBgClasses = {
    blue: 'bg-blue-100 text-blue-600',
    red: 'bg-red-100 text-red-600',
    green: 'bg-green-100 text-green-600',
    amber: 'bg-amber-100 text-amber-600',
    orange: 'bg-orange-100 text-orange-600',
    violet: 'bg-violet-100 text-violet-600',
    gray: 'bg-slate-100 text-slate-600',
    slate: 'bg-slate-100 text-slate-600',
  };

  // Download handler with token for internal files, or open for external links
  const handleDownload = (e, mode = 'download') => {
    if (e) e.preventDefault();

    const token = localStorage.getItem('token');

    // External links (Google Drive, GitHub, generic link) — buka langsung
    const isExternal = fileInfo.type === 'google' || fileInfo.type === 'github' || fileInfo.type === 'link';
    if (isExternal) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    // Internal file dari backend — konversi ke path relatif + tambah token
    const internalHosts = ['localhost', '127.0.0.1', 'backend'];
    try {
      const parsed = new URL(url);
      const isInternalHost = internalHosts.some(h => parsed.hostname === h || parsed.hostname.startsWith(h));
      if (isInternalHost && parsed.pathname.startsWith('/uploads/')) {
        if (mode === 'download') {
          // Untuk download: buat anchor element dengan download attribute
          const link = document.createElement('a');
          link.href = `${parsed.pathname}?token=${encodeURIComponent(token)}`;
          link.download = fileInfo.name || 'file';
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          link.remove();
        } else {
          // Preview: buka di tab baru
          window.open(`${parsed.pathname}?token=${encodeURIComponent(token)}`, '_blank', 'noopener,noreferrer');
        }
        return;
      }
    } catch {
      // Bukan URL absolut
    }

    // Path relatif /uploads/
    if (url.startsWith('/uploads/')) {
      const separator = url.includes('?') ? '&' : '?';
      const targetUrl = `${url}${separator}token=${encodeURIComponent(token)}`;
      if (mode === 'download') {
        const link = document.createElement('a');
        link.href = targetUrl;
        link.download = fileInfo.name || 'file';
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    // Fallback
    window.open(url, '_blank', 'noopener,noreferrer');
  };


  return (
    <div className={`rounded-lg border ${colorClasses[fileInfo.color]} overflow-hidden`}>
      <div className="p-3 flex items-center gap-3">
        {/* Icon */}
        <div className={`shrink-0 w-10 h-10 rounded-lg ${iconBgClasses[fileInfo.color]} flex items-center justify-center`}>
          <IconComponent size={20} />
        </div>
        {/* File Name & Type */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{fileInfo.name}</p>
          <p className="text-xs opacity-70 capitalize">{fileInfo.type === 'google' ? 'Google Drive' : fileInfo.type}</p>
        </div>
        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Preview/Open Button */}
          <button
            onClick={(e) => handleDownload(e, 'preview')}
            className="p-2 rounded-lg hover:bg-white/50 transition text-slate-500 hover:text-slate-700"
            title="Buka / Preview"
          >
            <Eye size={16} />
          </button>

          {/* Download Button */}
          <button
            onClick={(e) => handleDownload(e, 'download')}
            className="p-2 rounded-lg hover:bg-white/50 transition text-slate-500 hover:text-slate-700"
            title={fileInfo.type === 'link' || fileInfo.type === 'google' ? "Buka Link" : "Download File"}
          >
            <Download size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Submissions - Daftar Submission Mahasiswa (Dosen)
 * Mode A: Pilih assignment (jika tidak ada assignmentId)
 * Mode B: Lihat submissions untuk assignment tertentu
 */
export default function Submissions() {
  const { classId, assignmentId } = useParams();
  const navigate = useNavigate();

  // Data state
  const [submissions, setSubmissions] = useState([]);
  const [currentAssignment, setCurrentAssignment] = useState(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'submitted' | 'not-submitted'

  // Fetch data
  useEffect(() => {
    if (!classId || !assignmentId) return;
    
    const startTimer = setTimeout(() => {
      setLoading(true);
      setError(null);
    }, 0);

    // Fetch submissions and assignment info
    Promise.all([
      getSubmissions(assignmentId),
      getAssignments(classId),
    ])
      .then(([subRes, assignRes]) => {
        // Normalisasi grade: -1 dari backend berarti belum dinilai (null)
        const normalizedSubs = (subRes.data || []).map(sub => ({
          ...sub,
          grade: sub.grade === -1 ? null : sub.grade,
          // Normalisasi submittedAt: string kosong berarti belum submit
          submittedAt: sub.submittedAt || null,
        }));
        setSubmissions(normalizedSubs);
        // Find current assignment info
        const current = (assignRes.data || []).find(a => a.id === assignmentId || a.id === parseInt(assignmentId));
        setCurrentAssignment(current);
      })
      .catch(err => setError(err?.message || 'Gagal memuat data'))
      .finally(() => setLoading(false));

    return () => clearTimeout(startTimer);
  }, [classId, assignmentId]);

  // Handle grade submission
  const handleGrade = async (submissionId, grade, feedback) => {
    try {
      const res = await gradeSubmission(submissionId, { grade, feedback });
      // Update local state for instant UX
      setSubmissions(prev =>
        prev.map(s =>
          s.id === submissionId
            ? { ...s, grade: res.data?.grade ?? grade, feedback: res.data?.feedback ?? feedback }
            : s
        )
      );
      return { success: true };
    } catch {
      return { success: false, error: 'Gagal menyimpan nilai' };
    }
  };

  // Filter submissions
  const filteredSubmissions = submissions.filter(sub => {
    // Search filter
    const matchSearch =
      sub.student?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.student?.email?.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const hasGrade = sub.grade !== null && sub.grade !== undefined;
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'submitted' && sub.submittedAt) ||
      (filterStatus === 'not-submitted' && !sub.submittedAt) ||
      (filterStatus === 'graded' && hasGrade) ||
      (filterStatus === 'not-graded' && sub.submittedAt && !hasGrade);

    return matchSearch && matchStatus;
  });

  // Calculate stats
  const stats = {
    total: submissions.length,
    submitted: submissions.filter(s => s.submittedAt).length,
    notSubmitted: submissions.filter(s => !s.submittedAt).length,
    graded: submissions.filter(s => s.grade !== null && s.grade !== undefined).length,
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Check if submission is late
  const isLate = (submittedAt, dueDate) => {
    if (!submittedAt || !dueDate) return false;
    return new Date(submittedAt) > new Date(dueDate);
  };

  if (!classId || classId === 'undefined') {
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
          { label: 'Kelas', to: `/dosen/classes/${classId}` },
          { label: 'Tugas', to: `/dosen/classes/${classId}/assignments` },
          { label: 'Submissions' },
        ]}
      />

      {/* No Assignment ID fallback */}
      {!assignmentId && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <FileText size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Tugas Belum Dipilih
          </h3>
          <p className="text-slate-500 mb-6">
            Silakan pilih tugas dari daftar tugas untuk melihat submission.
          </p>
          <button
            onClick={() => navigate(`/dosen/classes/${classId}/assignments`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Lihat Daftar Tugas
          </button>
        </div>
      )}

      {/* Mode B: Submission List */}
      {assignmentId && (
        <>
          {/* Header with Back Button */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <button
                onClick={() => navigate(`/dosen/classes/${classId}/assignments`)}
                className="shrink-0 p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <ArrowLeft size={20} className="text-slate-600" />
              </button>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
                  {currentAssignment?.title || 'Submissions'}
                </h1>
                {currentAssignment && (
                  <p className="text-slate-500 mt-1 flex items-center gap-2">
                    <Calendar size={14} />
                    Deadline: {formatDate(currentAssignment.dueDate)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          {!loading && !error && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
                <div className="text-sm text-slate-500">Total Mahasiswa</div>
              </div>
              <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4 text-center">
                <div className="text-2xl font-bold text-emerald-600">{stats.submitted}</div>
                <div className="text-sm text-emerald-600">Sudah Submit</div>
              </div>
              <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.graded}</div>
                <div className="text-sm text-blue-600">Sudah Dinilai</div>
              </div>
            </div>
          )}

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama atau email mahasiswa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Filter */}
            <div className="relative">
              <Filter size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="appearance-none pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition cursor-pointer"
              >
                <option value="all">Semua Status</option>
                <option value="submitted">Sudah Submit</option>
                <option value="not-submitted">Belum Submit</option>
                <option value="graded">Sudah Dinilai</option>
                <option value="not-graded">Belum Dinilai</option>
              </select>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
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

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && submissions.length === 0 && (
            <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <Users size={32} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Belum Ada Data
              </h3>
              <p className="text-slate-500">
                Belum ada mahasiswa yang terdaftar atau mengumpulkan tugas
              </p>
            </div>
          )}

          {/* Submission List */}
          {!loading && !error && filteredSubmissions.length > 0 && (
            <div className="space-y-3">
              {filteredSubmissions.map((submission) => (
                <SubmissionCard
                  key={submission.id}
                  submission={submission}
                  dueDate={currentAssignment?.dueDate}
                  formatDate={formatDate}
                  isLate={isLate}
                  onGrade={handleGrade}
                />
              ))}
            </div>
          )}

          {/* No Search Results */}
          {!loading && !error && submissions.length > 0 && filteredSubmissions.length === 0 && (
            <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <Search size={32} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Tidak Ditemukan
              </h3>
              <p className="text-slate-500">
                Tidak ada hasil yang cocok dengan filter Anda
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * SubmissionCard - Card untuk setiap submission dengan penilaian inline
 */
function SubmissionCard({ submission, dueDate, formatDate, isLate, onGrade }) {
  const hasSubmitted = !!submission.submittedAt;
  const late = isLate(submission.submittedAt, dueDate);
  const hasGrade = submission.grade !== null && submission.grade !== undefined;

  // Local state for inline grading
  const [grade, setGrade] = useState(submission.grade ?? '');
  const [feedback, setFeedback] = useState(submission.feedback ?? '');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null
  const [isEditing, setIsEditing] = useState(false);

  // Track if values changed
  const hasChanges =
    String(grade) !== String(submission.grade ?? '') ||
    feedback !== (submission.feedback ?? '');

  // Generate avatar color based on name
  const colors = [
    'bg-blue-500',
    'bg-emerald-500',
    'bg-violet-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-cyan-500',
  ];
  const colorIndex = submission.student?.name
    ? submission.student.name.charCodeAt(0) % colors.length
    : 0;
  const avatarColor = colors[colorIndex];

  // Get initials
  const initials = submission.student?.name
    ? submission.student.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
    : '??';

  // Handle save grade
  const handleSave = async () => {
    if (!hasChanges) return;

    setSaving(true);
    setSaveStatus(null);

    const result = await onGrade(submission.id, grade, feedback);

    if (result.success) {
      setSaveStatus('success');
      setIsEditing(false);
      // Clear success message after 2s
      setTimeout(() => setSaveStatus(null), 2000);
    } else {
      setSaveStatus('error');
    }

    setSaving(false);
  };

  // Quick grade buttons
  const quickGrades = [100, 90, 85, 80, 75, 70, 60, 50];

  return (
    <div className={`bg-white rounded-xl border ${hasSubmitted
      ? hasGrade
        ? 'border-blue-200'
        : late
          ? 'border-amber-200'
          : 'border-slate-200'
      : 'border-red-200 bg-red-50/30'
      } overflow-hidden transition-all hover:shadow-md`}>
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className={`shrink-0 w-12 h-12 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold`}>
            {initials}
          </div>

          {/* Student Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-slate-900">
                  {submission.student?.name || 'Nama tidak tersedia'}
                </h3>
                <p className="text-sm text-slate-500">
                  {submission.student?.email}
                </p>
              </div>

              {/* Status Badges */}
              <div className="shrink-0 flex items-center gap-2">
                {/* Grade Badge */}
                {hasGrade && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                    <Star size={14} />
                    {submission.grade}
                  </span>
                )}

                {/* Submit Status Badge */}
                {hasSubmitted ? (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${late
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-100 text-emerald-700'
                    }`}>
                    <CheckCircle size={14} />
                    {late ? 'Terlambat' : 'Submitted'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                    <XCircle size={14} />
                    Belum Submit
                  </span>
                )}
              </div>
            </div>

            {/* Submission Details */}
            {hasSubmitted && (
              <div className="mt-3 space-y-3">
                {/* Submitted Time */}
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Clock size={14} />
                    {formatDate(submission.submittedAt)}
                    {late && (
                      <span className="text-amber-600 font-medium">(Terlambat)</span>
                    )}
                  </span>
                </div>

                {/* File Card - Improved UX */}
                {submission.fileUrl && (
                  <FilePreviewCard url={submission.fileUrl} />
                )}

                {/* Student Note - Now displayed */}
                {submission.note && (
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <MessageSquare size={14} className="text-yellow-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-yellow-700 mb-1">Catatan Mahasiswa:</p>
                      <p className="text-sm text-yellow-800">{submission.note}</p>
                    </div>
                  </div>
                )}

                {/* Existing Feedback Display (when not editing) */}
                {hasGrade && !isEditing && submission.feedback && (
                  <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg">
                    <MessageSquare size={14} className="text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-600">{submission.feedback}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grading Section - Only for submitted */}
      {hasSubmitted && (
        <div className={`px-5 py-4 border-t ${isEditing || !hasGrade ? 'bg-slate-50' : 'bg-white'} border-slate-100`}>
          {/* Compact View (Already Graded & Not Editing) */}
          {hasGrade && !isEditing && (
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600">
                  Nilai: <span className="font-bold text-blue-600">{submission.grade}</span>
                </span>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium bg-blue-50 px-3 py-1 rounded-md"
              >
                Edit / Nilai
              </button>
            </div>
          )}

          {/* Grading Form (Not Graded OR Editing) */}
          {(!hasGrade || isEditing) && (
            <div className="space-y-3">
              {/* Quick Grade Buttons */}
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs text-slate-500 mr-1 self-center">Quick:</span>
                {quickGrades.map(q => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setGrade(q)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${grade === q
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:border-primary/50 hover:bg-blue-50'
                      }`}
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Grade & Feedback Inputs */}
              <div className="flex gap-3">
                {/* Grade Input */}
                <div className="relative w-24">
                  <Star size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="Nilai"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm font-medium"
                  />
                </div>

                {/* Feedback Input */}
                <div className="relative flex-1">
                  <MessageSquare size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Feedback singkat (opsional)..."
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                  />
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSave}
                  disabled={saving || !grade || !hasChanges}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition ${hasChanges && grade
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    } disabled:opacity-50`}
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : saveStatus === 'success' ? (
                    <Check size={16} />
                  ) : (
                    <Save size={16} />
                  )}
                  {saving ? 'Saving...' : saveStatus === 'success' ? 'Tersimpan!' : 'Simpan'}
                </button>

                {/* Cancel Button (when editing) */}
                {isEditing && (
                  <button
                    onClick={() => {
                      setGrade(submission.grade ?? '');
                      setFeedback(submission.feedback ?? '');
                      setIsEditing(false);
                    }}
                    className="px-3 py-2.5 text-slate-500 hover:text-slate-700 text-sm font-medium"
                  >
                    Batal
                  </button>
                )}
              </div>

              {/* Error Message */}
              {saveStatus === 'error' && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle size={14} />
                  Gagal menyimpan nilai. Coba lagi.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

