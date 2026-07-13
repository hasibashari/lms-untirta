import { Loader2, UserPlus } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';

export const StudentTabContent = ({
  selectedStudents,
  bulkAdvisorId,
  setBulkAdvisorId,
  activeDospem,
  handleBulkAssign,
  bulkProcessing,
  setSelectedStudents,
  filteredStudents,
  toggleStudent,
  toggleSelectAllStudents,
  handleAssignAdvisor,
  processingId,
}) => {
  return (
    <div className="space-y-4">
      {/* Bulk Assign Bar */}
      {selectedStudents.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <span className="text-sm text-blue-700 font-medium">
            {selectedStudents.size} mahasiswa dipilih
          </span>
          <div className="flex items-center gap-2">
            <select
              value={bulkAdvisorId}
              onChange={(e) => setBulkAdvisorId(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih Dospem...</option>
              {activeDospem.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <button
              onClick={handleBulkAssign}
              disabled={!bulkAdvisorId || bulkProcessing}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {bulkProcessing ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
              Tetapkan
            </button>
            <button
              onClick={() => setSelectedStudents(new Set())}
              className="text-slate-400 hover:text-slate-600 text-sm"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Mobile Card View */}
        <div className="lg:hidden divide-y divide-slate-100">
          {filteredStudents.length === 0 ? (
            <div className="text-center text-slate-400 py-10 text-sm">Tidak ada mahasiswa ditemukan</div>
          ) : filteredStudents.map(student => (
            <div key={student.id} className="p-4 hover:bg-slate-50">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedStudents.has(student.id)}
                  onChange={() => toggleStudent(student.id)}
                  className="rounded mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm shrink-0">
                      {student.name?.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-slate-900 truncate">{student.name}</p>
                      <p className="text-xs text-slate-500 truncate">{student.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-slate-500">Pembimbing:</span>
                    {student.advisor ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-[10px] font-bold">
                          {student.advisor.name?.charAt(0)}
                        </div>
                        <span className="text-xs text-slate-700">{student.advisor.name}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Belum ditetapkan</span>
                    )}
                  </div>
                  <div className="mt-2">
                    <select
                      value={student.advisorId || ''}
                      onChange={(e) => handleAssignAdvisor(student.id, e.target.value)}
                      disabled={processingId === student.id}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 w-full"
                    >
                      <option value="">— Tidak ada —</option>
                      {activeDospem.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                    {processingId === student.id && (
                      <Loader2 size={14} className="inline ml-2 animate-spin text-blue-600" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={filteredStudents.length > 0 && filteredStudents.every(s => selectedStudents.has(s.id))}
                    onChange={toggleSelectAllStudents}
                    className="rounded"
                  />
                </TableHead>
                <TableHead className="w-12 text-center">No.</TableHead>
                <TableHead>Mahasiswa</TableHead>
                <TableHead>Dosen Pembimbing</TableHead>
                <TableHead className="w-40 text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-400 py-10">
                    Tidak ada mahasiswa ditemukan
                  </TableCell>
                </TableRow>
              ) : filteredStudents.map((student, index) => (
                <TableRow key={student.id} className="hover:bg-slate-50">
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedStudents.has(student.id)}
                      onChange={() => toggleStudent(student.id)}
                      className="rounded"
                    />
                  </TableCell>
                  <TableCell className="text-center text-slate-500">{index + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-xs">
                        {student.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{student.name}</p>
                        <p className="text-xs text-slate-500">{student.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {student.advisor ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold">
                          {student.advisor.name?.charAt(0)}
                        </div>
                        <span className="text-sm">{student.advisor.name}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Belum ditetapkan</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <select
                      value={student.advisorId || ''}
                      onChange={(e) => handleAssignAdvisor(student.id, e.target.value)}
                      disabled={processingId === student.id}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 w-36"
                    >
                      <option value="">— Tidak ada —</option>
                      {activeDospem.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                    {processingId === student.id && (
                      <Loader2 size={14} className="inline ml-2 animate-spin text-blue-600" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};
