import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * SemesterFilter — Reusable filter bar for selecting an AcademicSemester.
 * Receives semester list via props (fetched by the consumer page).
 * Used across Admin KRS Approval, Transcript, and Class management pages.
 */
const SemesterFilter = ({
  semesters = [],
  selectedId,
  onSelect,
  academicSemesterId,
  onAcademicSemesterChange,
  className = '',
  hideAllOption = false,
}) => {
  // Handle flexible prop names
  const currentId = selectedId || academicSemesterId;
  const handleChange = onSelect || onAcademicSemesterChange;

  const activeSemesters = semesters.filter(s => s.status === 'OPEN');
  const pastSemesters = semesters.filter(s => s.status !== 'OPEN');

  // Find selected semester object to help SelectValue if needed
  const selectedSemester = semesters.find(s => s.id === currentId);

  return (
    <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 ${className}`}>
      <div className="w-full sm:w-64">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
          Periode Akademik
        </label>
        <Select 
          value={currentId || (hideAllOption ? '' : 'all')} 
          onValueChange={handleChange}
          disabled={semesters.length === 0}
        >
          <SelectTrigger className="w-full bg-white border-slate-200">
            <SelectValue>
              {selectedSemester 
                ? `${selectedSemester.academicYear} ${selectedSemester.semesterType === 'GANJIL' ? 'Ganjil' : 'Genap'}`
                : semesters.length === 0 ? 'Memuat data...' : 'Pilih Semester'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-80">
            {!hideAllOption && <SelectItem value="all" className="font-medium">Semua Semester</SelectItem>}
            
            {activeSemesters.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-[10px] font-bold text-blue-600 uppercase mt-2">Periode Aktif</div>
                {activeSemesters.map(sem => (
                  <SelectItem key={sem.id} value={sem.id} className="text-blue-700">
                    {sem.academicYear} {sem.semesterType === 'GANJIL' ? 'Ganjil' : 'Genap'} (SEKARANG)
                  </SelectItem>
                ))}
              </>
            )}

            {pastSemesters.length > 0 && (
              <>
                <div className="px-2 py-1.5 mt-2 text-[10px] font-bold text-slate-400 border-t uppercase">Riwayat / Lampau</div>
                {pastSemesters.map(sem => (
                  <SelectItem key={sem.id} value={sem.id}>
                    {sem.academicYear} {sem.semesterType === 'GANJIL' ? 'Ganjil' : 'Genap'}
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default SemesterFilter;
