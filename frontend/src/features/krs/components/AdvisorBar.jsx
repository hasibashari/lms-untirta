import { memo } from 'react';
import { UserCheck } from 'lucide-react';

const AdvisorBar = memo(({ advisor }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-3">
    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
      <UserCheck size={20} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dosen Pembimbing Akademik</p>
      {advisor ? (
        <div className="flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-2">
          <p className="text-sm font-bold text-slate-800 truncate">{advisor.name}</p>
          <span className="hidden sm:inline text-slate-300">•</span>
          <p className="text-xs text-slate-500 truncate">{advisor.email}</p>
        </div>
      ) : (
        <p className="text-xs text-amber-600 italic font-medium">Belum ada dosen pembimbing yang ditugaskan.</p>
      )}
    </div>
  </div>
));

export default AdvisorBar;
