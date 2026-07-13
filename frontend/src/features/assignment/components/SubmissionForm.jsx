import { LinkIcon, Upload, Loader2, Send } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

export const SubmissionForm = ({
  submitType,
  handleSubmitTypeChange,
  fileUrl,
  setFileUrl,
  selectedFile,
  handleFileSelect,
  note,
  setNote,
  handleSubmit,
  submitting,
  isLate,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900">Pengumpulan Tugas</h2>
        {isLate && (
          <p className="mt-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
            Peringatan: Anda mengumpulkan tugas melewati batas waktu yang ditentukan.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Submit Type Selector */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => handleSubmitTypeChange('url')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              submitType === 'url'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            URL / Link
          </button>
          <button
            type="button"
            onClick={() => handleSubmitTypeChange('file')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              submitType === 'file'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload File
          </button>
        </div>

        {/* Input Area */}
        {submitType === 'url' ? (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">URL File/Tugas</label>
            <input
              type="url"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://docs.google.com/..."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
            <p className="text-xs text-gray-500">
              Pastikan URL dapat diakses (public/anyone with link)
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Upload File</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition-colors bg-gray-50">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600 justify-center">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 px-2 py-1"
                  >
                    <span>Pilih file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      onChange={handleFileSelect}
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.rar,.jpg,.png"
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500">
                  PDF, DOCX, PPTX, ZIP, RAR, JPG, PNG (Max 10MB)
                </p>
                {selectedFile && (
                  <p className="text-sm font-medium text-blue-600 mt-2 bg-blue-50 py-1 px-3 rounded-full inline-block">
                    {selectedFile.name}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Note */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Catatan Tambahan (Opsional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Tambahkan pesan untuk dosen..."
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <Button
          type="submit"
          disabled={submitting || (submitType === 'url' ? !fileUrl : !selectedFile)}
          className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Mengumpulkan...
            </>
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" />
              Kumpulkan Tugas
            </>
          )}
        </Button>
      </form>
    </div>
  );
};
