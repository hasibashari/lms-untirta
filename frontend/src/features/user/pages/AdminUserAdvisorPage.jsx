import { Loader2, AlertCircle, UserCheck, Users, Search, Shield } from 'lucide-react';
import { useAdminUserAdvisor } from '../hooks/useAdminUserAdvisor';
import DashboardJumbotron from '@/shared/components/layout/Jumbotron';
import { AdvisorStats } from '../components/AdvisorStats';
import { AdvisorTabContent } from '../components/AdvisorTabContent';
import { StudentTabContent } from '../components/StudentTabContent';

// ============================================================
// Admin — Dosen Pembimbing (Advisor) Assignment Page
// ============================================================

const AdvisorAssignmentPage = () => {
  const {
    activeTab,
    setActiveTab,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    processingId,
    selectedStudents,
    setSelectedStudents,
    bulkAdvisorId,
    setBulkAdvisorId,
    bulkProcessing,
    expandedAdvisor,
    setExpandedAdvisor,
    fetchData,
    handleToggleDospem,
    handleAssignAdvisor,
    handleBulkAssign,
    toggleStudent,
    toggleSelectAllStudents,
    activeDospem,
    filteredDosen,
    filteredStudents,
    stats,
    advisorSummary,
  } = useAdminUserAdvisor();

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <DashboardJumbotron
        icon={UserCheck}
        title="Dosen Pembimbing Akademik"
        subtitle="Kelola status Dospem dan tetapkan dosen pembimbing untuk setiap mahasiswa."
      />

      {/* Stats */}
      <AdvisorStats stats={stats} />

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => { setActiveTab('advisors'); setSearchQuery(''); }}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'advisors' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <Shield size={14} className="inline mr-1.5" />
          Dosen Pembimbing
        </button>
        <button
          onClick={() => { setActiveTab('students'); setSearchQuery(''); }}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'students' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <Users size={14} className="inline mr-1.5" />
          Mahasiswa
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-72">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder={activeTab === 'advisors' ? 'Cari dosen...' : 'Cari mahasiswa atau dosen...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-blue-600" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-red-500 gap-2">
          <AlertCircle size={32} />
          <p className="text-sm">{error}</p>
          <button onClick={fetchData} className="text-blue-600 text-sm underline">Coba lagi</button>
        </div>
      ) : activeTab === 'advisors' ? (
        /* ============ ADVISORS TAB ============ */
        <AdvisorTabContent
          filteredDosen={filteredDosen}
          processingId={processingId}
          handleToggleDospem={handleToggleDospem}
          advisorSummary={advisorSummary}
          expandedAdvisor={expandedAdvisor}
          setExpandedAdvisor={setExpandedAdvisor}
        />
      ) : (
        /* ============ STUDENTS TAB ============ */
        <StudentTabContent
          selectedStudents={selectedStudents}
          bulkAdvisorId={bulkAdvisorId}
          setBulkAdvisorId={setBulkAdvisorId}
          activeDospem={activeDospem}
          handleBulkAssign={handleBulkAssign}
          bulkProcessing={bulkProcessing}
          setSelectedStudents={setSelectedStudents}
          filteredStudents={filteredStudents}
          toggleStudent={toggleStudent}
          toggleSelectAllStudents={toggleSelectAllStudents}
          handleAssignAdvisor={handleAssignAdvisor}
          processingId={processingId}
        />
      )}
    </div>
  );
};

export default AdvisorAssignmentPage;
