type Scope = '3m' | '1y' | 'all';

export function getScopeRange(scope: Scope): { from?: string; to?: string } {
  const now = new Date();
  const to = now.toISOString().split('T')[0];
  if (scope === 'all') return {};
  if (scope === '1y') {
    const from = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    return { from: from.toISOString().split('T')[0], to };
  }
  // 3m
  const from = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
  return { from: from.toISOString().split('T')[0], to };
}

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function formatFullDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
