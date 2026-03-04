import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  FileText,
  ExternalLink,
  Download,
  BookOpen,
  ArrowLeft,
} from 'lucide-react';
import { getMaterialDetail, getMaterials } from '../materialService';
import { getMyCourses } from '../../course/courseService';
import LearningSidebar from '../components/LearningSidebar';
import MarkdownPreview from '../../../components/ui/MarkdownPreview';
import { Button } from '@/components/ui/button';

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
      .catch(err => toast.error(err?.message || 'Gagal memuat detail materi'))
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
      <div className="min-h-screen bg-background flex">
        {/* Learning Sidebar */}
        <LearningSidebar
          materials={materials}
          currentMaterialId={materialId}
          courseId={courseId}
          course={course}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onBackClick={() => navigate(`/mahasiswa/courses/${courseId}`)}
          basePath="/mahasiswa"
          collapsed={sidebarCollapsed}
        />

        {/* Main Content - Loading State */}
        <main className={`flex-1 min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-80'}`}>
          <div className="px-6 lg:px-16 py-8 lg:py-12">
            <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
              <div className="h-6 bg-muted rounded w-1/4"></div>
              <div className="h-12 bg-muted rounded w-3/4"></div>
              <div className="space-y-4">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-5/6"></div>
                <div className="h-4 bg-muted rounded w-4/6"></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="min-h-screen bg-background flex">
        {/* Learning Sidebar */}
        <LearningSidebar
          materials={materials}
          currentMaterialId={materialId}
          courseId={courseId}
          course={course}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onBackClick={() => navigate(`/mahasiswa/courses/${courseId}`)}
          basePath="/mahasiswa"
          collapsed={sidebarCollapsed}
        />

        {/* Main Content - Not Found State */}
        <main className={`flex-1 min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-80'}`}>
          <div className="flex items-center justify-center min-h-screen px-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <FileText size={32} className="text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Materi Tidak Ditemukan
              </h2>
              <p className="text-muted-foreground mb-4">
                Materi yang Anda cari tidak tersedia.
              </p>
              <Link
                to={`/mahasiswa/courses/${courseId}/materials`}
                className="text-primary hover:underline font-medium"
              >
                Kembali ke Daftar Materi
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Learning Sidebar */}
      <LearningSidebar
        materials={materials}
        currentMaterialId={materialId}
        courseId={courseId}
        course={course}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onBackClick={() => navigate(`/mahasiswa/courses/${courseId}`)}
        basePath="/mahasiswa"
        collapsed={sidebarCollapsed}
      />

      {/* Main Content */}
      <main className={`flex-1 min-w-0 flex flex-col min-h-screen transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-80'
        }`}>
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border supports-backdrop-filter:bg-background/60">
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu size={24} className="text-muted-foreground" />
            </Button>

            {/* Desktop Toggle Collapse Button */}
            <Button
              variant="ghost"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex items-center gap-2 text-muted-foreground hover:text-primary"
            >
              <Menu size={18} />
              <span className="font-medium">
                {sidebarCollapsed}
              </span>
            </Button>

            {/* Spacer untuk balance */}
            <div className="w-10 lg:w-24" />
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 px-6 lg:px-16 py-8 lg:py-12 pb-32">
          <div className="max-w-3xl mx-auto w-full">
            {/* Material Header */}
            <header className="mb-8">
              <div className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                Materi {currentIndex + 1} dari {materials.length}
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground leading-tight">
                {material.title}
              </h1>
            </header>

            {/* Content - Markdown/HTML rendered */}
            <article className="bg-card text-card-foreground rounded-lg border border-border p-8 lg:p-12 shadow-sm text-justify">
              {/* 
              Menggunakan komponen MarkdownPreview yang sama dengan dosen
              untuk konsistensi tampilan
            */}
              <MarkdownPreview content={material.content} />
            </article>

            {/* Attachments */}
            {material.attachments && material.attachments.length > 0 && (
              <section className="mt-8 bg-card text-card-foreground rounded-lg border border-border p-6 shadow-sm">
                <h2 className="font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                  <FileText size={20} className="text-primary" />
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
                        className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border border-border hover:border-primary/50 hover:bg-accent transition group"
                      >
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          {fileType === 'PDF' ? (
                            <FileText size={24} className="text-red-500" />
                          ) : (
                            <ExternalLink size={24} className="text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate group-hover:text-primary transition">
                            {fileName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {fileType}
                          </p>
                        </div>
                        <Download size={20} className="text-muted-foreground group-hover:text-primary transition" />
                      </a>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Sticky Footer Navigation */}
        <div className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 py-4 px-6 lg:px-16 z-20 mt-auto">
          <nav className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-4">
            {prevMaterial ? (
              <Link
                to={`/mahasiswa/courses/${courseId}/materials/${prevMaterial.id}`}
                className="flex-1 flex items-center gap-4 p-4 bg-card rounded-lg border border-border hover:border-primary/50 hover:shadow-md transition group"
              >
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition">
                  <ChevronLeft size={20} className="text-muted-foreground group-hover:text-primary transition" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs text-muted-foreground">Sebelumnya</p>
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition">
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
                className="flex-1 flex items-center gap-4 p-4 bg-primary rounded-lg hover:bg-primary/90 transition group text-primary-foreground shadow-sm"
              >
                <div className="flex-1 min-w-0 text-right">
                  <p className="text-xs text-primary-foreground/80">Selanjutnya</p>
                  <p className="text-sm font-medium truncate">
                    {nextMaterial.title}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <ChevronRight size={20} />
                </div>
              </Link>
            ) : (
              <Link
                to={`/mahasiswa/courses/${courseId}`}
                className="flex-1 flex items-center justify-center gap-2 p-4 bg-secondary border border-border text-secondary-foreground rounded-lg hover:bg-secondary/80 transition shadow-sm"
              >
                <span className="font-medium">Kembali ke Kelas</span>
              </Link>
            )}
          </nav>
        </div>
      </main>
    </div>
  );
};

export default MaterialDetail;
