export function formatDate(date: string | Date): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString();
}

export function formatDateTime(date: string | Date): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString();
}

export function formatNumber(num: number): string {
  if (!num) return '0';
  return num.toLocaleString();
}