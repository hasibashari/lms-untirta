import { Search } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';

export const ClassFilter = ({
  searchQuery,
  setSearchQuery,
  filterSemester,
  setFilterSemester,
  filterEnrollment,
  setFilterEnrollment,
  semesters,
  getSemesterLabel,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Cari mata kuliah, kode, dosen, atau section..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>
      <Select value={filterSemester} onValueChange={setFilterSemester}>
        <SelectTrigger className="w-full sm:w-56 bg-white">
          <SelectValue placeholder="Semua Semester" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Semester</SelectItem>
          {semesters.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {getSemesterLabel(s)} {s.isActive ? '(Aktif)' : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={filterEnrollment} onValueChange={setFilterEnrollment}>
        <SelectTrigger className="w-full sm:w-44 bg-white">
          <SelectValue placeholder="Status Pendaftaran" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Status</SelectItem>
          <SelectItem value="open">Dibuka</SelectItem>
          <SelectItem value="closed">Ditutup</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
