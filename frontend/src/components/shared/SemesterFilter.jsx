import { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getAllSemesters } from '@/features/academic/academicService';

/**
 * SemesterFilter — Reusable filter bar for selecting an AcademicSemester.
 * Fetches semester list from API and lets user pick by ID.
 * Used across Admin KRS Approval, Transcript, and Class management pages.
 */
const SemesterFilter = ({
  academicSemesterId,
  onAcademicSemesterChange,
  className = '',
}) => {
  const [semesters, setSemesters] = useState([]);

  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const res = await getAllSemesters();
        setSemesters(res.data?.data || []);
      } catch {
        setSemesters([]);
      }
    };
    fetchSemesters();
  }, []);

  return (
    <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 ${className}`}>
      <div className="w-full sm:w-64">
        <label className="text-xs text-slate-500 mb-1 block">Semester Akademik</label>
        <Select value={academicSemesterId || 'all'} onValueChange={onAcademicSemesterChange}>
          <SelectTrigger className="w-full bg-white">
            <SelectValue placeholder="Pilih Semester" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Semester</SelectItem>
            {semesters.map(sem => (
              <SelectItem key={sem.id} value={sem.id}>
                {sem.academicYear} {sem.semesterType === 'GANJIL' ? 'Ganjil' : 'Genap'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default SemesterFilter;
