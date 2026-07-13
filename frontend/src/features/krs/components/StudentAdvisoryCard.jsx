import React from 'react';
import { ChevronDown, ChevronUp, ShieldOff, Loader2, XCircle } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/shared/components/ui/table';
import KrsStatusBadge from './KrsStatusBadge';

const StudentAdvisoryCard = ({
  student,
  isExpanded,
  onToggleExpand,
  revokeNoteId,
  setRevokeNoteId,
  revokeNote,
  setRevokeNote,
  revokingId,
  handleRevoke,
  bulkUpdate,
  showToast,
  refetch
}) => {
  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      {/* Student Header */}
      <div
        className="flex flex-col md:flex-row md:items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors gap-4"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-3 min-w-[240px]">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
            {student.name?.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">{student.name}</h3>
            <p className="text-xs text-slate-500">{student.email}</p>
          </div>
        </div>

        {/* Monitoring SKS Progress */}
        <div className="flex-1 max-w-xs">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Beban SKS</span>
            <span className={`text-xs font-bold ${student.stats.totalSks > 20 ? 'text-orange-600' : 'text-blue-600'}`}>
              {student.stats.totalSks} / 24
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${student.stats.totalSks > 22 ? 'bg-red-500' :
                student.stats.totalSks > 18 ? 'bg-orange-500' : 'bg-blue-500'
                }`}
              style={{ width: `${Math.min((student.stats.totalSks / 24) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 justify-end">
          <div className="hidden sm:flex flex-wrap items-center gap-2">
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-full whitespace-nowrap">{student.stats?.total || 0} Mata Kuliah</span>
            {student.stats?.pending > 0 && (
              <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-1 rounded-full whitespace-nowrap">{student.stats.pending} Pending</span>
            )}
            {student.stats?.approved > 0 && (
              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full whitespace-nowrap">{student.stats.approved} Disetujui</span>
            )}
          </div>

          {/* Quick Action: Approve All for this student */}
          {student.stats.pending > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const pendingIds = student.enrollments
                  .filter(en => en.status === 'PENDING')
                  .map(en => en.id);
                if (pendingIds.length > 0) {
                  bulkUpdate({
                    enrollmentIds: pendingIds,
                    status: 'APPROVED'
                  }).then(() => {
                    showToast(`Berhasil menyetujui ${pendingIds.length} mata kuliah ${student.name}`);
                    refetch();
                  }).catch(err => {
                    showToast(err?.message || 'Gagal menyetujui KRS', 'error');
                  });
                }
              }}
              className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-shadow shadow-sm"
            >
              Setujui Semua
            </button>
          )}

          <div className="text-slate-400">
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
      </div>

      {/* Expanded Enrollment Details */}
      {isExpanded && student.enrollments.length > 0 && (
        <div className="border-t">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Mata Kuliah</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead className="text-center">SKS</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {student.enrollments.map(enrollment => {
                  const semesterStatus = enrollment.class?.academicSemester?.status;
                  const canRevoke = enrollment.status === 'APPROVED' && semesterStatus === 'OPEN';

                  return (
                    <TableRow key={enrollment.id}>
                      <TableCell className="font-mono text-xs">{enrollment.class?.course?.code}</TableCell>
                      <TableCell className="font-medium">{enrollment.class?.course?.title}</TableCell>
                      <TableCell>{enrollment.class?.section}</TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {enrollment.class?.course?.semester
                          ? `Semester ${enrollment.class.course.semester}`
                          : '-'}
                      </TableCell>
                      <TableCell className="text-center">{enrollment.class?.course?.sks || 3}</TableCell>
                      <TableCell>
                        <KrsStatusBadge status={enrollment.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {canRevoke && (
                          <div>
                            {revokeNoteId === enrollment.id ? (
                              <div className="flex items-center justify-end gap-2">
                                <input
                                  type="text"
                                  value={revokeNote}
                                  onChange={(e) => setRevokeNote(e.target.value)}
                                  placeholder="Alasan pencabutan..."
                                  className="text-xs border rounded-md px-2 py-1 w-44 focus:outline-none focus:ring-1 focus:ring-orange-400"
                                  autoFocus
                                  onKeyDown={(e) => e.key === 'Enter' && handleRevoke(enrollment.id)}
                                />
                                <button
                                  onClick={() => handleRevoke(enrollment.id)}
                                  disabled={revokingId === enrollment.id}
                                  className="px-2 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700 disabled:opacity-50"
                                >
                                  {revokingId === enrollment.id ? <Loader2 size={12} className="animate-spin" /> : 'Cabut'}
                                </button>
                                <button
                                  onClick={() => { setRevokeNoteId(null); setRevokeNote(''); }}
                                  className="text-slate-400 hover:text-slate-600"
                                >
                                  <XCircle size={16} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => { setRevokeNoteId(enrollment.id); setRevokeNote(''); }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-md hover:bg-orange-100 transition-colors"
                                title="Cabut persetujuan KRS ini"
                              >
                                <ShieldOff size={12} />
                                Cabut Persetujuan
                              </button>
                            )}
                          </div>
                        )}
                        {enrollment.status === 'REJECTED' && enrollment.note && (
                          <span className="text-xs text-slate-400 italic" title={enrollment.note}>
                            {enrollment.note.length > 30 ? enrollment.note.substring(0, 30) + '...' : enrollment.note}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {isExpanded && student.enrollments.length === 0 && (
        <div className="border-t px-4 py-6 text-center text-sm text-slate-400">
          Belum ada KRS yang diajukan untuk semester ini.
        </div>
      )}
    </div>
  );
};

export default StudentAdvisoryCard;
