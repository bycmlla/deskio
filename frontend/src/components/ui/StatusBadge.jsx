export default function StatusBadge({ status }) {
  const map = {
    'Aberto': 'badge-aberto',
    'Em andamento': 'badge-andamento',
    'Fechado': 'badge-fechado',
  };
  return <span className={`badge ${map[status] || 'badge-aberto'}`}>{status}</span>;
}
