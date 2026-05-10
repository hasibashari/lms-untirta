import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getAssignmentDetail } from '../assignmentService';
import { getMyAssignmentStatus, submitAssignment } from '../../submission/submissionService';
import MarkdownPreview from '../../../components/ui/MarkdownPreview';
import Breadcrumb from '../../../components/navigation/Breadcrumb';
import BackButton from '../../../components/navigation/BackButton';
import toast from 'react-hot-toast';
import {
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Link as LinkIcon,
  Upload,
  Send,
  Loader2,
  Award,
  MessageSquare,
  Info,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AssignmentDetail() {
  const { classId, assignmentId } = useParams();

  const [assignment, setAssignment] = useState(null); // State baru untuk detail assignment
  const [status, setStatus] = useState(null); // Status submission
  const [fileUrl, setFileUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitType, setSubmitType] = useState('url'); // 'url' atau 'file'

  useEffect(() => {
    // Fetch detail assignment dan status submission secara paralel
    const fetchData = async () => {
      try {
        const [assignmentRes, statusRes] = await Promise.all([
          getAssignmentDetail(assignmentId), // Fetch detail tugas (title, description, dueDate)
          getMyAssignmentStatus(assignmentId), // Fetch status submission (submitted, grade, feedback)
        ]);
        setAssignment(assignmentRes.data);
        setStatus(statusRes.data);
      } catch (err) {
        console.error(err);
        toast.error('Gagal memuat data tugas');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [assignmentId]);

  // Helper: Format tanggal
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFileNameFromUrl = (url) => {
    if (!url) return '-';

    try {
      const parsed = new URL(url);
      const filename = parsed.pathname.split('/').filter(Boolean).pop();
      return filename ? decodeURIComponent(filename) : url;
    } catch {
      const filename = url.split('/').filter(Boolean).pop();
      return filename ? decodeURIComponent(filename) : url;
    }
  };

  // Helper: Get full absolute URL for internal files
  const getFullUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;

    // Internal path case
    const baseUrl = import.meta.env.VITE_API_URL || '';
    const host = baseUrl.endsWith('/api') ? baseUrl.slice(0, -4) : baseUrl;
    return `${host}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // Helper: Cek status deadline - Fix: Ganti 'orange' ke 'amber' untuk Tailwind valid
  const getDeadlineStatus = () => {
    if (!assignment) return null; // Gunakan assignment untuk dueDate
    const now = new Date();
    const due = new Date(assignment.dueDate); // Ambil dari assignment
    const diff = due - now;

    if (diff < 0) {
      return { type: 'late', text: 'Deadline sudah lewat', color: 'red' };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days === 0 && hours < 6) {
      return { type: 'urgent', text: `${hours} jam lagi`, color: 'amber' }; // Changed from 'orange' to 'amber'
    }
    if (days <= 1) {
      return { type: 'soon', text: `${days} hari ${hours} jam lagi`, color: 'yellow' };
    }
    return { type: 'safe', text: `${days} hari lagi`, color: 'green' };
  };

  // Logic handle download/preview (sama dengan dosen)
  const handleDownload = async (url) => {
    if (!url) return;

    // Jika eksternal link (Drive, GitHub, dll), buka langsung
    if (url.startsWith('http') && !url.includes(window.location.hostname) && !url.includes('localhost')) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    // Jika internal file, gunakan fetch dengan token
    const toastId = toast.loading('Menyiapkan file...');
    try {
      const fullUrl = getFullUrl(url);
      const token = localStorage.getItem('token');

      const response = await fetch(fullUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Gagal mengakses file');

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      // Buka di tab baru (Preview)
      window.open(blobUrl, '_blank');

      // Cleanup URL setelah beberapa saat
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
      toast.success('File siap dibuka', { id: toastId });
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Gagal memuat file. Pastikan Anda masih login.', { id: toastId });
    }
  };

  // Handle file selection - Fix: Tambah validasi lebih ketat dan feedback
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return; // Handle jika user cancel

    // Validasi ukuran file (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 10MB');
      return;
    }
    // Validasi tipe file - Fix: Tambah lebih lengkap
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/zip',
      'application/x-rar-compressed',
      'image/jpeg',
      'image/png',
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipe file tidak didukung. Gunakan PDF, DOC, DOCX, PPT, PPTX, ZIP, RAR, JPG, atau PNG');
      return;
    }
    setSelectedFile(file);
    toast.success(`File "${file.name}" dipilih`);
  };

  // Handle switch submit type - Fix: Reset state saat switch
  const handleSubmitTypeChange = (type) => {
    setSubmitType(type);
    if (type === 'url') {
      setSelectedFile(null); // Reset file jika switch ke URL
    } else {
      setFileUrl(''); // Reset URL jika switch ke file
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // Validasi input berdasarkan tipe submit
    if (submitType === 'url' && !fileUrl.trim()) {
      toast.error('Masukkan URL file tugas');
      setSubmitting(false);
      return;
    }
    if (submitType === 'file' && !selectedFile) {
      toast.error('Pilih file tugas untuk diupload');
      setSubmitting(false);
      return;
    }

    try {
      if (submitType === 'url') {
        // Submit dengan URL (JSON)
        await submitAssignment(assignmentId, { fileUrl, note });
      } else {
        // Submit dengan file upload (FormData)
        const formData = new FormData();
        formData.append('file', selectedFile);
        if (note) formData.append('note', note);
        await submitAssignment(assignmentId, formData);
      }
      toast.success('Tugas berhasil dikumpulkan!');

      // Refresh status
      const res = await getMyAssignmentStatus(assignmentId);
      setStatus(res.data);
      setFileUrl('');
      setNote('');
      setSelectedFile(null); // Reset file setelah sukses
    } catch (err) {
      console.error(err);
      // Fix: Tambah fallback untuk error message
      const errorMessage = err.response?.data?.message || err.message || 'Gagal mengumpulkan tugas';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const deadlineStatus = getDeadlineStatus();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Memuat detail tugas...</span>
      </div>
    );
  }

  if (!assignment || !status) { // Cek kedua state
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-600">Data tugas tidak ditemukan</h3>
      </div>
    );
  }

  // Fix: Cek status dengan lowercase karena backend return 'submitted', 'graded', 'pending', 'overdue'
  const isSubmitted = status.status === 'submitted' || status.status === 'graded';
  const isLate = deadlineStatus?.type === 'late';

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Kelas Saya', to: '/mahasiswa/classes' },
          { label: 'Kelas', to: `/mahasiswa/classes/${classId}` },
          { label: 'Tugas', to: `/mahasiswa/classes/${classId}/assignments` },
          { label: assignment.title }, // Gunakan assignment.title
        ]}
      />

      <BackButton fallback={`/mahasiswa/classes/${classId}/assignments`} />

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 bg-blue-100 rounded-xl">
          <FileText className="w-8 h-8 text-blue-600" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">{assignment.title}</h1> {/* Gunakan assignment.title */}
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {/* Status Badge */}
            {isSubmitted ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                <CheckCircle className="w-4 h-4" />
                Sudah Dikumpulkan
              </span>
            ) : isLate ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
                <AlertTriangle className="w-4 h-4" />
                Terlambat
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">
                <Clock className="w-4 h-4" />
                Belum Dikumpulkan
              </span>
            )}
            {/* Deadline countdown - Fix: Pastikan color valid */}
            {!isSubmitted && deadlineStatus && (
              <span className={`text-sm text-${deadlineStatus.color}-600 flex items-center gap-1`}>
                <Clock className="w-4 h-4" />
                {deadlineStatus.text}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 space-y-4">
          {/* Deskripsi - Sekarang akan muncul sebagai Markdown */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Deskripsi Tugas</h3>
            {assignment.description ? (
              <div className="bg-gray-50/50 rounded-xl p-6 border border-gray-100/50">
                <MarkdownPreview content={assignment.description} className="prose prose-slate max-w-none" />
              </div>
            ) : (
              <p className="text-gray-400 italic">Tidak ada deskripsi.</p>
            )}
          </div>

          {/* Deadline */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Calendar className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Deadline</p>
              <p className="font-medium text-gray-800">{formatDate(assignment.dueDate)}</p> {/* Gunakan assignment.dueDate */}
            </div>
          </div>

          {/* Nilai & Feedback (jika sudah dinilai) */}
          {isSubmitted && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              {/* Nilai */}
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <Award className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600">Nilai</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {status.grade !== null ? status.grade : '-'}
                  </p>
                </div>
              </div>

              {/* Feedback */}
              {status.feedback && (
                <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-green-600 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-green-600 font-medium mb-1">Feedback Dosen</p>
                    <div className="text-gray-700 prose prose-sm prose-green max-w-none">
                      <MarkdownPreview content={status.feedback} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submission detail mahasiswa */}
          {isSubmitted && (
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <h3 className="text-sm font-medium text-gray-500">Pengumpulan Anda</h3>

              {status.submittedAt && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>Dikumpulkan: {formatDate(status.submittedAt)}</span>
                </div>
              )}

              {status.fileUrl && (
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <LinkIcon className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-gray-500">File/Link tugas</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <button
                        onClick={() => handleDownload(status.fileUrl)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium group"
                      >
                        <span className="truncate max-w-[200px]">
                          {getFileNameFromUrl(status.fileUrl)}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDownload(status.fileUrl)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Pratinjau"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {status.note && (
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-gray-500">Catatan Anda</p>
                    <p className="whitespace-pre-wrap">{status.note}</p>
                  </div>
                </div>
              )}

              {!status.fileUrl && !status.note && !status.submittedAt && (
                <p className="text-sm text-gray-500">Detail pengumpulan belum tersedia.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Form Pengumpulan */}
      {isSubmitted ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-800">Tugas Sudah Dikumpulkan</h3>
              <p className="text-green-600 text-sm">
                Menunggu penilaian dari dosen. Kamu akan mendapat notifikasi jika nilai sudah keluar.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Kumpulkan Tugas</h3>

            {/* Warning jika terlambat */}
            {isLate && (
              <div className="flex items-start gap-3 p-4 mb-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">Deadline sudah lewat</p>
                  <p className="text-sm text-red-600">
                    Kamu masih bisa mengumpulkan tugas, namun akan ditandai sebagai terlambat.
                  </p>
                </div>
              </div>
            )}

            {/* Tab Switcher - Fix: Gunakan handleSubmitTypeChange */}
            <div className="flex border-b border-gray-200 mb-6">
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleSubmitTypeChange('url')}
                className={`flex items-center gap-2 px-4 py-3 rounded-none border-b-2 ${submitType === 'url'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-transparent'
                  }`}
              >
                <LinkIcon className="w-4 h-4" />
                Link URL
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleSubmitTypeChange('file')}
                className={`flex items-center gap-2 px-4 py-3 rounded-none border-b-2 ${submitType === 'file'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-transparent'
                  }`}
              >
                <Upload className="w-4 h-4" />
                Upload File
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* URL Input */}
              {submitType === 'url' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link File Tugas <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="url"
                      placeholder="https://drive.google.com/file/..."
                      value={fileUrl}
                      onChange={(e) => setFileUrl(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      aria-label="Link file tugas"
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500 flex items-start gap-1">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    Upload file ke Google Drive, lalu paste linknya di sini. Pastikan link bisa diakses.
                  </p>
                </div>
              )}

              {/* File Upload */}
              {submitType === 'file' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload File Tugas <span className="text-red-500">*</span>
                  </label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${selectedFile
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-300 hover:border-blue-400 bg-gray-50'
                      }`}
                  >
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                        <div className="text-left">
                          <p className="font-medium text-gray-800">{selectedFile.name}</p>
                          <p className="text-sm text-gray-500">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setSelectedFile(null)}
                          className="ml-4 text-red-500 hover:text-red-700 hover:bg-red-50"
                          aria-label="Hapus file"
                        >
                          Hapus
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 mb-2">
                          Drag & drop file atau{' '}
                          <label className="text-blue-600 hover:underline cursor-pointer" aria-label="Pilih file">
                            browse
                            <input
                              type="file"
                              onChange={handleFileSelect}
                              className="hidden"
                              accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.rar,.jpg,.jpeg,.png"
                            />
                          </label>
                        </p>
                        <p className="text-sm text-gray-400">
                          PDF, DOC, DOCX, PPT, PPTX, ZIP, RAR, JPG, PNG (max 10MB)
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Catatan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catatan (Opsional)
                </label>
                <textarea
                  placeholder="Tambahkan catatan untuk dosen..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  aria-label="Catatan untuk dosen"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 h-auto"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Kumpulkan Tugas
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
