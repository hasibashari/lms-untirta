import { Search } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import SemesterFilter from '@/shared/components/forms/SemesterFilter';

export const ClassFilter = ({
  searchQuery,
  setSearchQuery,
  filterSemester,
  setFilterSemester,
  filterEnrollment,
  setFilterEnrollment,
  semesters,
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
      <div className="w-full sm:w-56 shrink-0">
        <SemesterFilter
          semesters={semesters}
          selectedId={filterSemester}
          onSelect={setFilterSemester}
          showLabel={false}
          className="w-full"
        />
      </div>
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
