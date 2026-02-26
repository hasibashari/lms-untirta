import { Clock, CheckCircle, XCircle } from 'lucide-react';

const STATUS_CONFIG = {
  PENDING: {
    label: 'Menunggu',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Clock,
  },
  APPROVED: {
    label: 'Disetujui',
    className: 'bg-green-50 text-green-700 border-green-200',
    icon: CheckCircle,
  },
  REJECTED: {
    label: 'Ditolak',
    className: 'bg-red-50 text-red-700 border-red-200',
    icon: XCircle,
  },
};

const KrsStatusBadge = ({ status, className = '' }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.className} ${className}`}
    >
      <Icon size={12} />
      {config.label}
    </span>
  );
};

export default KrsStatusBadge;
