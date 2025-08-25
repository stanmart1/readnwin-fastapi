export function formatNaira(amount: number): string {
  if (!amount) return '₦0.00';
  return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function calculateVAT(amount: number, rate: number = 0.075): number {
  return amount * rate;
}