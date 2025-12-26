import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  FileText,
  ExternalLink,
  Download,
  BookOpen,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import { getMaterialDetail, getMaterials } from '../../services/dosen.service';
import { getMyCourses } from '../../services/mahasiswa.service';
import { LearningSidebar } from '../../components/learning';

/**
 * MaterialDetail - Halaman Detail Materi / Content View
 * Terinspirasi dari Dicoding: fokus membaca, minim distraksi, long-form content
 * Mendukung rendering Markdown/HTML dengan styling yang baik
 */
const MaterialDetail = () => {
  const { courseId, materialId } = useParams();
  const navigate = useNavigate();
  const [material, setMaterial] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!materialId || !courseId) return;

    Promise.all([
      getMaterialDetail(materialId),
      getMaterials(courseId),
      getMyCourses(),
    ])
      .then(([materialRes, materialsRes, coursesRes]) => {
        setMaterial(materialRes.data);
        setMaterials(materialsRes.data);

        const foundCourse = coursesRes.data.find(
          item => item.course.id === parseInt(courseId) || item.course.id === courseId
        );
        setCourse(foundCourse?.course);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [materialId, courseId]);

  // Find current index for navigation
  const currentIndex = materials.findIndex(
    m => m.id === parseInt(materialId) || m.id === materialId
  );
  const prevMaterial = currentIndex > 0 ? materials[currentIndex - 1] : null;
  const nextMaterial = currentIndex < materials.length - 1 ? materials[currentIndex + 1] : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto p-6 lg:p-8 space-y-6 animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/4"></div>
          <div className="h-12 bg-slate-200 rounded w-3/4"></div>
          <div className="space-y-4">
            <div className="h-4 bg-slate-200 rounded"></div>
            <div className="h-4 bg-slate-200 rounded w-5/6"></div>
            <div className="h-4 bg-slate-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <FileText size={32} className="text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">
            Materi Tidak Ditemukan
          </h2>
          <p className="text-slate-500 mb-4">
            Materi yang Anda cari tidak tersedia.
          </p>
          <Link
            to={`/mahasiswa/courses/${courseId}/materials`}
            className="text-blue-600 hover:underline font-medium"
          >
            Kembali ke Daftar Materi
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Learning Sidebar - handles both desktop and mobile */}
      <LearningSidebar
        materials={materials}
        currentMaterialId={materialId}
        courseId={courseId}
        course={course}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition"
            >
              <Menu size={24} className="text-slate-700" />
            </button>

            {/* Back to materials (desktop) */}
            <button
              onClick={() => navigate(`/mahasiswa/courses/${courseId}/materials`)}
              className="hidden lg:flex items-center gap-2 text-slate-600 hover:text-blue-600 transition"
            >
              <ArrowLeft size={18} />
              <span className="font-medium">Daftar Materi</span>
            </button>

            {/* Progress indicator */}
            <div className="text-sm text-slate-500">
              <span className="font-medium text-blue-600">{currentIndex + 1}</span>
              <span> / {materials.length}</span>
            </div>

            {/* Placeholder for alignment */}
            <div className="w-10 lg:hidden"></div>
          </div>
        </header>

        {/* Content Area */}
        <div className="max-w-4xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
          {/* Material Header */}
          <header className="mb-8">
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
              <BookOpen size={16} />
              <span>Materi {currentIndex + 1} dari {materials.length}</span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 leading-tight">
              {material.title}
            </h1>
          </header>

          {/* Content - Markdown/HTML rendered */}
          <article className="bg-white rounded-2xl border border-slate-200 p-6 lg:p-10 shadow-sm">
            {/* 
              Prose styling untuk konten Markdown
              Menggunakan Tailwind Typography atau custom styling
            */}
            <div
              className="prose prose-slate max-w-none
                prose-headings:font-bold prose-headings:text-slate-900
                prose-h1:text-2xl prose-h1:mt-8 prose-h1:mb-4
                prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3
                prose-h3:text-lg prose-h3:mt-4 prose-h3:mb-2
                prose-p:text-slate-700 prose-p:leading-relaxed prose-p:mb-4
                prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                prose-strong:text-slate-900 prose-strong:font-semibold
                prose-ul:my-4 prose-li:text-slate-700
                prose-ol:my-4
                prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:rounded-xl prose-pre:p-4 prose-pre:overflow-x-auto
                prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-[''] prose-code:after:content-['']
                prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:px-4 prose-blockquote:py-2 prose-blockquote:rounded-r-lg prose-blockquote:italic
                prose-img:rounded-xl prose-img:shadow-md
              "
              dangerouslySetInnerHTML={{ __html: material.content }}
            />
          </article>

          {/* Attachments */}
          {material.attachments && material.attachments.length > 0 && (
            <section className="mt-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                <FileText size={20} className="text-blue-600" />
                Lampiran & Resource
              </h2>
              <div className="grid gap-3">
                {material.attachments.map((file, i) => {
                  const fileName = file.url?.split('/').pop() || 'File';
                  const fileType = file.type?.toUpperCase() || 'FILE';

                  return (
                    <a
                      key={i}
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition group"
                    >
                      <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                        {fileType === 'PDF' ? (
                          <FileText size={24} className="text-red-500" />
                        ) : (
                          <ExternalLink size={24} className="text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate group-hover:text-blue-600 transition">
                          {fileName}
                        </p>
                        <p className="text-sm text-slate-500">
                          {fileType}
                        </p>
                      </div>
                      <Download size={20} className="text-slate-400 group-hover:text-blue-600 transition" />
                    </a>
                  );
                })}
              </div>
            </section>
          )}

          {/* Navigation Buttons */}
          <nav className="mt-10 flex flex-col sm:flex-row gap-4">
            {prevMaterial ? (
              <Link
                to={`/mahasiswa/courses/${courseId}/materials/${prevMaterial.id}`}
                className="flex-1 flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition group"
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-100 transition">
                  <ChevronLeft size={24} className="text-slate-500 group-hover:text-blue-600 transition" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm text-slate-500">Sebelumnya</p>
                  <p className="font-medium text-slate-900 truncate group-hover:text-blue-600 transition">
                    {prevMaterial.title}
                  </p>
                </div>
              </Link>
            ) : (
              <div className="flex-1"></div>
            )}

            {nextMaterial ? (
              <Link
                to={`/mahasiswa/courses/${courseId}/materials/${nextMaterial.id}`}
                className="flex-1 flex items-center gap-4 p-5 bg-blue-600 rounded-2xl hover:bg-blue-700 transition group text-white shadow-lg shadow-blue-200"
              >
                <div className="flex-1 min-w-0 text-right">
                  <p className="text-sm text-blue-200">Selanjutnya</p>
                  <p className="font-medium truncate">
                    {nextMaterial.title}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <ChevronRight size={24} />
                </div>
              </Link>
            ) : (
              <Link
                to={`/mahasiswa/courses/${courseId}`}
                className="flex-1 flex items-center justify-center gap-2 p-5 bg-emerald-600 rounded-2xl hover:bg-emerald-700 transition text-white shadow-lg shadow-emerald-200"
              >
                <span className="font-medium">🎉 Selesai! Kembali ke Kelas</span>
              </Link>
            )}
          </nav>
        </div>
      </main>
    </div>
  );
};

export default MaterialDetail;
