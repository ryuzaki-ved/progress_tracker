// Option utilities for pricing and contract generation
import { OptionContract } from '../types';

// Calculate option price (simple intrinsic value + linear time decay)
export function calculateOptionPrice(
  currentIndexValue: number,
  strikePrice: number,
  expiryDate: string,
  optionType: 'CE' | 'PE',
  createdAt: string
): number {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const created = new Date(createdAt);
  const daysToExpiry = Math.max(0, (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const totalDays = Math.max(1, (expiry.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  let intrinsic = 0;
  if (optionType === 'CE') {
    intrinsic = Math.max(0, currentIndexValue - strikePrice);
  } else {
    intrinsic = Math.max(0, strikePrice - currentIndexValue);
  }
  // Simple time value: 10% of index value * (days to expiry / total days)
  const timeValue = 0.1 * currentIndexValue * (daysToExpiry / totalDays);
  return Math.max(1, intrinsic + timeValue); // Minimum premium 1
}

// Generate weekly options contracts for the current week
export function generateWeeklyOptionsContracts(
  currentIndexValue: number
): OptionContract[] {
  // Find this week's Monday and Sunday
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  // Strike prices: nearest 100, and +/- 200, 100, 0, +100, +200
  const base = Math.round(currentIndexValue / 100) * 100;
  const strikes = [base - 200, base - 100, base, base + 100, base + 200];
  const contracts: OptionContract[] = [];
  for (const strike of strikes) {
    contracts.push({
      id: 0, // to be set by DB
      strikePrice: strike,
      expiryDate: sunday.toISOString(),
      optionType: 'CE',
      underlyingIndexValueAtCreation: currentIndexValue,
      createdAt: monday.toISOString(),
    });
    contracts.push({
      id: 0,
      strikePrice: strike,
      expiryDate: sunday.toISOString(),
      optionType: 'PE',
      underlyingIndexValueAtCreation: currentIndexValue,
      createdAt: monday.toISOString(),
    });
  }
  return contracts;
} 