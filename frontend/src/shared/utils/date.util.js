export const formatRelativeTime = (date) => {
  const now = new Date();
  const submitted = new Date(date);
  const diff = now - submitted;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  if (days < 7) return `${days} hari lalu`;
  return submitted.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
};
