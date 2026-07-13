import { Loader2, AlertTriangle } from 'lucide-react';
import Breadcrumb from '@/shared/components/navigation/Breadcrumb';
import BackButton from '@/shared/components/navigation/BackButton';

import { useMahasiswaAssignDetail } from '../hooks/useMahasiswaAssignDetail';
import { AssignmentInfo } from '../components/AssignmentInfo';
import { SubmissionForm } from '../components/SubmissionForm';
import { SubmissionStatusInfo } from '../components/SubmissionStatusInfo';

export default function AssignmentDetail() {
  const {
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
  } = useMahasiswaAssignDetail();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Memuat detail tugas...</span>
      </div>
    );
  }

  if (!assignment || !status) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-600">Data tugas tidak ditemukan</h3>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <Breadcrumb
        items={[
          { label: 'Kelas Saya', to: '/mahasiswa/classes' },
          { label: 'Tugas', to: `/mahasiswa/classes/${classId}/assignments` },
          { label: assignment.title },
        ]}
      />

      <BackButton fallback={`/mahasiswa/classes/${classId}/assignments`} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Detail Tugas (Mendominasi ruang) */}
        <div className="lg:col-span-2 space-y-6">
          <AssignmentInfo
            assignment={assignment}
            deadlineStatus={deadlineStatus}
            formatDate={formatDate}
          />
        </div>

        {/* Kolom Kanan: Status & Form Submission */}
        <div className="space-y-6">
          {/* Status Panel (Prioritas pertama jika sudah submit) */}
          {isSubmitted ? (
            <SubmissionStatusInfo
              status={status}
              isSubmitted={isSubmitted}
              formatDate={formatDate}
              getFileNameFromUrl={getFileNameFromUrl}
              handleDownload={handleDownload}
            />
          ) : (
            <SubmissionForm
              submitType={submitType}
              handleSubmitTypeChange={handleSubmitTypeChange}
              fileUrl={fileUrl}
              setFileUrl={setFileUrl}
              selectedFile={selectedFile}
              handleFileSelect={handleFileSelect}
              note={note}
              setNote={setNote}
              handleSubmit={handleSubmit}
              submitting={submitting}
              isLate={isLate}
            />
          )}

          {/* Warning Message if past deadline and unsubmitted */}
          {isLate && !isSubmitted && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700">
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5" />
                Batas Waktu Terlewati
              </h4>
              <p className="text-sm">
                Tugas ini sudah melewati tenggat waktu yang ditentukan. Menghubungi dosen Anda mungkin
                diperlukan, pengumpulan akan ditandai sebagai terlambat.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
