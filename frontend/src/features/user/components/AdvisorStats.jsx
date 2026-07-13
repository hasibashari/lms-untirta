import { AlertCircle, Shield, UserPlus, Users } from 'lucide-react';

export const AdvisorStats = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
          <Shield size={20} className="text-blue-600" />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-800">{stats.totalDospem}</p>
          <p className="text-xs text-slate-500">Total Dospem</p>
        </div>
      </div>
      <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
          <Users size={20} className="text-indigo-600" />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-800">{stats.totalStudents}</p>
          <p className="text-xs text-slate-500">Total Mahasiswa</p>
        </div>
      </div>
      <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
          <UserPlus size={20} className="text-green-600" />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-800">{stats.assigned}</p>
          <p className="text-xs text-slate-500">Sudah Ditetapkan</p>
        </div>
      </div>
      <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
          <AlertCircle size={20} className="text-amber-600" />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-800">{stats.unassigned}</p>
          <p className="text-xs text-slate-500">Belum Ditetapkan</p>
        </div>
      </div>
    </div>
  );
};
