import { memo } from 'react';
import { Printer, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Breadcrumb from '@/components/navigation/Breadcrumb';

const KrsHeader = memo(({ currentSemester, handlePrintKrs, isPrinting, hasEnrollments, handleRefresh, isRefreshing }) => (
  <>
    <Breadcrumb
      items={[
        { label: 'Dashboard', to: '/mahasiswa/dashboard' },
        { label: 'Rencana Studi' },
      ]}
    />
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
          Kartu Rencana Studi
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Tahun Akademik {currentSemester?.year || '-'} • Semester {currentSemester?.term || '-'}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
          className="bg-white hover:bg-slate-50 text-blue-600 border-slate-200 shadow-sm"
        >
          <Loader2 className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <Button
          onClick={handlePrintKrs}
          disabled={isPrinting || !hasEnrollments}
          className="bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm transition-all"
          variant="outline"
          size="sm"
        >
          {isPrinting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Printer className="mr-2 h-4 w-4" />
          )}
          Cetak KRS
        </Button>
      </div>
    </div>
  </>
));

export default KrsHeader;
