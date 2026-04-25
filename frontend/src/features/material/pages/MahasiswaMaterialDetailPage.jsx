import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Menu,
  FileText,
  CheckCircle,
  Clock,
  MonitorPlay} from 'lucide-react';
import { motion } from 'motion/react';
import { getMaterialDetail, getMaterials } from '../materialService';
import { getMyCourses } from '../../course/courseService';
import LearningSidebar from '../components/LearningSidebar';
import MarkdownPreview from '../../../components/ui/MarkdownPreview';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

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

  const currentIndex = materials.findIndex(
    m => m.id === parseInt(materialId) || m.id === materialId
  );
  const prevMaterial = currentIndex > 0 ? materials[currentIndex - 1] : null;
  const nextMaterial = currentIndex < materials.length - 1 ? materials[currentIndex + 1] : null;

  // Handle Mark as Complete Flow
  const handleCompleteAndNext = () => {
    toast.success('Materi ditandai selesai!');
    if (nextMaterial) {
      navigate(`/mahasiswa/courses/${courseId}/materials/${nextMaterial.id}`);
    } else {
      navigate(`/mahasiswa/courses/${courseId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex">
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
        <main className={`flex-1 min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-80'}`}>
          <div className="px-6 lg:px-12 py-8 lg:py-12 max-w-7xl mx-auto w-full">
            <div className="max-w-3xl space-y-6 animate-pulse">
              <div className="h-6 bg-muted rounded w-1/4"></div>
              <div className="h-12 bg-muted rounded w-3/4"></div>
              <div className="space-y-4 pt-8">
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
              <Button asChild variant="outline">
                <Link to={`/mahasiswa/courses/${courseId}/materials`}>
                  Kembali ke Daftar Materi
                </Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
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

      <main className={`flex-1 min-w-0 flex flex-col min-h-screen transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-80'}`}>

        {/* Top Navigation Bar (Mobile Header & Toggle) */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border supports-backdrop-filter:bg-background/60">
          <div className="flex items-center justify-between h-16 px-4 lg:px-8 max-w-7xl mx-auto w-full">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu size={24} className="text-muted-foreground" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex items-center justify-center text-muted-foreground hover:text-primary transition-colors h-10 w-10"
              title={sidebarCollapsed ? 'Buka Sidebar' : 'Tutup Sidebar'}
            >
              <div className="relative w-5 h-5 flex flex-col items-center justify-center">
                <motion.span
                  animate={sidebarCollapsed ? { rotate: 0, y: -6 } : { rotate: 45, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute w-5 h-0.5 bg-current rounded-full"
                />
                <motion.span
                  animate={sidebarCollapsed ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute w-5 h-0.5 bg-current rounded-full"
                />
                <motion.span
                  animate={sidebarCollapsed ? { rotate: 0, y: 6 } : { rotate: -45, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute w-5 h-0.5 bg-current rounded-full"
                />
              </div>
            </Button>

            <div className="w-10 lg:w-24" />
          </div>
        </header>

        {/* 3-Column Grid Layout Area */}
        <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full">

          {/* Center Column: Reading Area */}
          <div className="flex-1 px-6 lg:px-12 py-8 min-w-0 pb-24 lg:pb-32">
            <div className="max-w-3xl mx-auto w-full">

              {/* Breadcrumb Navigation */}
              <Breadcrumb className="mb-6 hidden sm:flex">
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href={`/mahasiswa/courses/${courseId}`}>
                      {course?.title || 'Course'}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="max-w-37.5 md:max-w-xs truncate">
                      {material.title}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>

              {/* Material Header */}
              <header className="mb-6">
                <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground leading-tight mb-4">
                  {material.title}
                </h1>

                {/* Metadata Badges */}
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="secondary" className="px-3 py-1 font-medium bg-primary/10 text-primary hover:bg-primary/20">
                    Materi {currentIndex + 1}
                  </Badge>
                  <div className="flex items-center text-sm text-muted-foreground gap-1.5 font-medium">
                    <Clock size={15} />
                    <span>Estimasi 15-20 Menit</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground gap-1.5 font-medium">
                    <MonitorPlay size={15} />
                    <span>Teori / Konsep</span>
                  </div>
                </div>
              </header>

              <Separator className="my-8" />

              {/* Video Player Section - Non-aktifkan sementara sesua permintaan */}
              {/* {(material.videoUrl || (material.attachments && material.attachments.some(a => a.type === 'video'))) && (
                <div className="mb-10 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary uppercase tracking-wider">
                    <PlayCircle size={18} />
                    <span>Video Pembelajaran</span>
                  </div>
                  <div className="rounded-3xl overflow-hidden shadow-2xl border border-border aspect-video bg-black relative ring-1 ring-black/5">
                    <ReactPlayer
                      url={material.videoUrl || material.attachments.find(a => 
                        a.type === 'video' || 
                        a.url?.includes('youtube.com') || 
                        a.url?.includes('youtu.be') || 
                        a.url?.includes('vimeo.com')
                      )?.url}
                      width="100%"
                      height="100%"
                      controls
                      className="absolute top-0 left-0"
                    />
                  </div>
                </div>
              )} */}

              {/* Markdown Content */}
              <article className="prose prose-slate max-w-none text-slate-800 dark:prose-invert">
                <MarkdownPreview content={material.content} />
              </article>

              {/* Attachments Section - Non-aktifkan sementara sesua permintaan */}
              {/* {material.attachments && material.attachments.length > 0 && (
                <section className="mt-12">
                  <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <FileText size={20} className="text-primary" />
                    Lampiran & Referensi
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {material.attachments.map((file, i) => {
                      const fileName = file.url?.split('/').pop() || 'File';
                      const fileType = file.type?.toUpperCase() || 'FILE';
                      const isPDF = fileType === 'PDF';
                      const isVideo = file.type === 'video' || file.url?.includes('youtube.com') || file.url?.includes('youtu.be');

                      return (
                        <Card key={i} className={`group hover:border-primary/50 transition-colors cursor-pointer bg-card/50 ${isVideo ? 'border-primary/20' : ''}`} onClick={() => window.open(file.url, '_blank')}>
                          <CardContent className="p-4 flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-lg flex shrink-0 items-center justify-center ${isPDF ? 'bg-red-500/10' : isVideo ? 'bg-amber-500/10' : 'bg-primary/10'}`}>
                              {isPDF ? (
                                <FileText size={24} className="text-red-500" />
                              ) : isVideo ? (
                                <Youtube size={24} className="text-amber-600" />
                              ) : (
                                <ExternalLink size={24} className="text-primary" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                                {fileName}
                              </p>
                              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                                {isPDF ? 'Dokumen PDF' : isVideo ? 'Materi Video YouTube' : 'Tautan Eksternal'}
                              </p>
                            </div>
                            {isVideo ? (
                               <MonitorPlay size={18} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                            ) : (
                               <Download size={18} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </section>
              )} */}

              <Separator className="my-12" />

              {/* Inline Footer Navigation */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 mt-8">
                {prevMaterial ? (
                  <Button variant="ghost" className="w-full sm:w-auto gap-2" asChild>
                    <Link to={`/mahasiswa/courses/${courseId}/materials/${prevMaterial.id}`}>
                      <ChevronLeft size={16} />
                      Materi Sebelumnya
                    </Link>
                  </Button>
                ) : (
                  <div className="hidden sm:block"></div>
                )}

                <Button
                  size="lg"
                  className="w-full sm:w-auto gap-2 shadow-md hover:shadow-lg transition-all"
                  onClick={handleCompleteAndNext}
                >
                  <CheckCircle size={18} />
                  {nextMaterial ? 'Selesai & Lanjut' : 'Tandai Selesai'}
                </Button>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default MaterialDetail;

