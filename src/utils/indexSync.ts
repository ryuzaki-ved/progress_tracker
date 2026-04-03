import { calculateIndexValue } from './stockUtils';
import type { Stock } from '../types';

export const LIFESTOCK_STOCKS_MUTATED = 'lifestock-stocks-mutated';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('lifestock_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * After the server updates stock scores (e.g. task complete/fail), re-fetch stocks and
 * POST the weighted index so today's index_history row is updated once per event.
 * That keeps open/high/low/close moving sequentially instead of only on the next full-page refresh.
 */
export async function pushSequentialIndexUpdate(): Promise<void> {
  const headers = authHeaders();
  try {
    const res = await fetch('/api/stocks', { headers });
    if (!res.ok) return;
    const result = await res.json();
    const data = result.data;
    if (!Array.isArray(data)) return;

    const stocks: Stock[] = data.map((s: any) => ({
      ...s,
      lastActivity: new Date(s.lastActivity),
      history: (s.history || []).map((h: any) => ({ date: new Date(h.date), value: h.value })),
    }));

    const currentValue = calculateIndexValue(stocks);
    const upd = await fetch('/api/index/update', {
      method: 'POST',
      headers,
      body: JSON.stringify({ currentValue }),
    });
    if (!upd.ok) {
      const err = await upd.json().catch(() => ({}));
      console.warn('Index history sync failed:', err);
    }
  } catch (e) {
    console.warn('pushSequentialIndexUpdate:', e);
  }
}

export function notifyStocksMutated(): void {
  window.dispatchEvent(new CustomEvent(LIFESTOCK_STOCKS_MUTATED));
}
