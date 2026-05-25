import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { Plus, MessageSquare, Search, Loader2 } from 'lucide-react';
import { getThreads } from '../forumService';
import ThreadCard from '../components/ThreadCard';
import Breadcrumb from '@/shared/components/navigation/Breadcrumb';

/**
 * ForumThreadListPage — Halaman daftar thread diskusi per kelas.
 * Shared antara Dosen dan Mahasiswa, dengan path-aware navigation.
 */
export default function ForumThreadListPage() {
  const { classId } = useParams();
  const location = useLocation();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const isDosen = location.pathname.startsWith('/dosen');
  const rolePrefix = isDosen ? '/dosen' : '/mahasiswa';

  useEffect(() => {
    if (!classId) return;
    const startTimer = setTimeout(() => {
      setLoading(true);
    }, 0);

    getThreads(classId)
      .then((res) => setThreads(res.data || []))
      .catch((err) => setError(err.message || 'Gagal memuat diskusi'))
      .finally(() => setLoading(false));

    return () => clearTimeout(startTimer);
  }, [classId]);

  // Filter threads by search
  const filteredThreads = threads.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.content.toLowerCase().includes(search.toLowerCase()) ||
      t.author?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: isDosen ? 'Dashboard' : 'Kelas Saya', to: isDosen ? '/dosen/dashboard' : '/mahasiswa/classes' },
          { label: 'Kelas', to: `${rolePrefix}/classes/${classId}` },
          { label: 'Forum Diskusi' },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Forum Diskusi</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Diskusikan materi, ajukan pertanyaan, dan berbagi ide
          </p>
        </div>
        <Link
          to={`${rolePrefix}/classes/${classId}/forum/new`}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 shadow-sm transition self-start"
        >
          <Plus size={18} />
          Buat Diskusi
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Cari diskusi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
        />
      </div>

      {/* Thread List */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 size={24} className="animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Memuat diskusi...</span>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-destructive font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 text-sm text-primary hover:underline"
            >
              Coba lagi
            </button>
          </div>
        ) : filteredThreads.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <MessageSquare size={28} className="text-muted-foreground" />
            </div>
            <h3 className="text-foreground font-semibold mb-1">
              {search ? 'Tidak ada hasil' : 'Belum ada diskusi'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {search
                ? `Tidak ditemukan diskusi dengan kata kunci "${search}"`
                : 'Jadilah yang pertama memulai diskusi!'
              }
            </p>
            {!search && (
              <Link
                to={`${rolePrefix}/classes/${classId}/forum/new`}
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition"
              >
                <Plus size={16} />
                Buat Diskusi Pertama
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredThreads.map((thread) => (
              <ThreadCard key={thread.id} thread={thread} classId={classId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
