import { Loader2, UserCheck, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';

export const AdvisorTabContent = ({
  filteredDosen,
  processingId,
  handleToggleDospem,
  advisorSummary,
  expandedAdvisor,
  setExpandedAdvisor,
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Mobile Card View */}
        <div className="lg:hidden divide-y divide-slate-100">
          {filteredDosen.length === 0 ? (
            <div className="text-center text-slate-400 py-10 text-sm">Tidak ada dosen ditemukan</div>
          ) : filteredDosen.map((dosen) => {
            const studentCount = dosen.advisedStudentCount || 0;
            return (
              <div key={dosen.id} className="p-4 hover:bg-slate-50">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                      {dosen.name?.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-slate-900 truncate">{dosen.name}</p>
                      <p className="text-xs text-slate-500 truncate">{dosen.email}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {dosen.isDospem ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            <UserCheck size={12} /> Aktif
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded-full text-xs">Tidak aktif</span>
                        )}
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                          {studentCount} mahasiswa
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleDospem(dosen.id, dosen.isDospem)}
                    disabled={processingId === dosen.id}
                    className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${dosen.isDospem
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                  >
                    {processingId === dosen.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : dosen.isDospem ? (
                      <><X size={12} /> Nonaktifkan</>
                    ) : (
                      <><UserCheck size={12} /> Aktifkan</>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-12 text-center">No.</TableHead>
                <TableHead>Dosen</TableHead>
                <TableHead className="text-center">Status Dospem</TableHead>
                <TableHead className="text-center">Jumlah Mahasiswa</TableHead>
                <TableHead className="w-28 text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDosen.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-400 py-10">
                    Tidak ada dosen ditemukan
                  </TableCell>
                </TableRow>
              ) : filteredDosen.map((dosen, index) => {
                const studentCount = dosen.advisedStudentCount || 0;
                return (
                  <TableRow key={dosen.id} className="hover:bg-slate-50">
                    <TableCell className="text-center text-slate-500">{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">
                          {dosen.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{dosen.name}</p>
                          <p className="text-xs text-slate-500">{dosen.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {dosen.isDospem ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          <UserCheck size={12} /> Aktif
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Tidak aktif</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {studentCount > 0 ? (
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">{studentCount}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        onClick={() => handleToggleDospem(dosen.id, dosen.isDospem)}
                        disabled={processingId === dosen.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${dosen.isDospem
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                          }`}
                      >
                        {processingId === dosen.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : dosen.isDospem ? (
                          <><X size={12} /> Nonaktifkan</>
                        ) : (
                          <><UserCheck size={12} /> Aktifkan</>
                        )}
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Advisor Summary Cards */}
      {advisorSummary.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Ringkasan Dospem Aktif</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {advisorSummary.map(advisor => (
              <div
                key={advisor.id}
                className="bg-white rounded-xl border p-4 hover:shadow-sm transition-shadow cursor-pointer"
                onClick={() => setExpandedAdvisor(expandedAdvisor === advisor.id ? null : advisor.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                      {advisor.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{advisor.name}</p>
                      <p className="text-xs text-slate-500">{advisor.advisedStudentCount || 0} mahasiswa</p>
                    </div>
                  </div>
                  {expandedAdvisor === advisor.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </div>
                {expandedAdvisor === advisor.id && advisor.students?.length > 0 && (
                  <div className="mt-3 pt-3 border-t space-y-1.5">
                    {advisor.students.map(s => (
                      <div key={s.id} className="flex items-center gap-2 text-sm text-slate-600">
                        <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 text-xs font-medium">
                          {s.name?.charAt(0)}
                        </div>
                        <span>{s.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
