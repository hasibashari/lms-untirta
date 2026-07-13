import { CheckCircle, Clock, ExternalLink, MessageSquare, Award, FileText } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

export const SubmissionStatusInfo = ({
  status,
  formatDate,
  getFileNameFromUrl,
  handleDownload,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-green-100 overflow-hidden">
      <div className="bg-green-50 px-6 py-4 border-b border-green-100 flex items-center justify-between">
        <div className="flex items-center gap-2 text-green-700 font-semibold">
          <CheckCircle className="w-5 h-5" />
          Status: {status.status === 'graded' ? 'Sudah Dinilai' : 'Telah Dikumpulkan'}
        </div>
        <span className="text-sm text-green-600 bg-green-100 px-3 py-1 rounded-full font-medium">
          {formatDate(status.submittedAt)}
        </span>
      </div>

      <div className="p-6 space-y-6">
        {/* File yang dikumpulkan */}
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            File Tugas
          </h4>
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-100 group hover:border-blue-200 transition-colors">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="p-2 bg-white rounded shadow-sm">
                <FileText className="w-5 h-5 text-blue-500" />
              </div>
              <span className="font-medium text-gray-700 truncate" title={status.fileUrl}>
                {getFileNameFromUrl(status.fileUrl)}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload(status.fileUrl)}
              className="ml-4 shrink-0 bg-white hover:bg-blue-50 hover:text-blue-600 border-gray-200"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Buka File
            </Button>
          </div>
        </div>

        {/* Catatan Mahasiswa */}
        {status.note && (
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Catatan Anda
            </h4>
            <div className="bg-gray-50 p-4 rounded-lg text-gray-700 italic border border-gray-100">
              "{status.note}"
            </div>
          </div>
        )}

        {/* Nilai & Feedback Dosen */}
        {status.status === 'graded' && (
          <div className="bg-blue-50 rounded-xl p-5 border border-blue-100 mt-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Award className="w-24 h-24 text-blue-600" />
            </div>
            <div className="relative z-10">
              <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2 uppercase tracking-wider">
                <Award className="w-4 h-4" />
                Hasil Penilaian
              </h4>
              <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100 text-center min-w-[120px]">
                  <div className="text-sm text-gray-500 mb-1 font-medium">Nilai Akhir</div>
                  <div className="text-4xl font-bold text-blue-700">{status.grade}</div>
                  <div className="text-xs text-gray-400 mt-1">/ 100</div>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700 mb-1">Feedback Dosen:</div>
                  <p className="text-gray-600 bg-white/60 p-4 rounded-lg border border-blue-100/50 leading-relaxed min-h-[88px]">
                    {status.feedback || <span className="italic text-gray-400">Tidak ada feedback tertulis.</span>}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {status.status === 'submitted' && (
          <div className="flex items-center gap-3 text-yellow-600 bg-yellow-50 p-4 rounded-lg border border-yellow-100">
            <Clock className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">
              Tugas sudah dikumpulkan dan sedang menunggu penilaian dari dosen.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
