import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getAssignmentDetail } from '../api/assignment.api';
import { getMyAssignmentStatus, submitAssignment } from '../../submission/api/submission.api';

export const useMahasiswaAssignDetail = () => {
  const { classId, assignmentId } = useParams();

  const [assignment, setAssignment] = useState(null);
  const [status, setStatus] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitType, setSubmitType] = useState('url'); // 'url' atau 'file'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assignmentRes, statusRes] = await Promise.all([
          getAssignmentDetail(assignmentId),
          getMyAssignmentStatus(assignmentId),
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

  const getDeadlineStatus = () => {
    if (!assignment) return null;
    const now = new Date();
    const due = new Date(assignment.dueDate);
    const diff = due - now;

    if (diff < 0) {
      return { type: 'late', text: 'Deadline sudah lewat', color: 'red' };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days === 0 && hours < 6) {
      return { type: 'urgent', text: `${hours} jam lagi`, color: 'amber' };
    }
    if (days <= 1) {
      return { type: 'soon', text: `${days} hari ${hours} jam lagi`, color: 'yellow' };
    }
    return { type: 'safe', text: `${days} hari lagi`, color: 'green' };
  };

  const handleDownload = (url) => {
    if (!url) return;
    const token = localStorage.getItem('token');
    const internalHosts = ['localhost', '127.0.0.1', 'backend', window.location.hostname];
    try {
      const parsed = new URL(url);
      const isInternalHost = internalHosts.some(
        (host) => parsed.hostname === host || parsed.hostname.startsWith(host)
      );
      if (isInternalHost && parsed.pathname.startsWith('/uploads/')) {
        const fileUrl = `${parsed.pathname}?token=${encodeURIComponent(token)}`;
        window.open(fileUrl, '_blank', 'noopener,noreferrer');
        return;
      }
    } catch {
      // Not an absolute URL
    }

    if (url.startsWith('/uploads/')) {
      const separator = url.includes('?') ? '&' : '?';
      window.open(`${url}${separator}token=${encodeURIComponent(token)}`, '_blank', 'noopener,noreferrer');
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 10MB');
      return;
    }
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

  const handleSubmitTypeChange = (type) => {
    setSubmitType(type);
    if (type === 'url') {
      setSelectedFile(null);
    } else {
      setFileUrl('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

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
        await submitAssignment(assignmentId, { fileUrl, note });
      } else {
        const formData = new FormData();
        formData.append('file', selectedFile);
        if (note) formData.append('note', note);
        await submitAssignment(assignmentId, formData);
      }
      toast.success('Tugas berhasil dikumpulkan!');
      const res = await getMyAssignmentStatus(assignmentId);
      setStatus(res.data);
      setFileUrl('');
      setNote('');
      setSelectedFile(null);
    } catch (err) {
      console.error(err);
      const errorMessage =
        err.response?.data?.message || err.message || 'Gagal mengumpulkan tugas';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const deadlineStatus = getDeadlineStatus();
  const isSubmitted = status?.status === 'submitted' || status?.status === 'graded';
  const isLate = deadlineStatus?.type === 'late';

  return {
    classId,
    assignment,
    status,
    fileUrl,
    setFileUrl,
    selectedFile,
    note,
    setNote,
    loading,
    submitting,
    submitType,
    formatDate,
    getFileNameFromUrl,
    handleDownload,
    handleFileSelect,
    handleSubmitTypeChange,
    handleSubmit,
    deadlineStatus,
    isSubmitted,
    isLate,
  };
};
