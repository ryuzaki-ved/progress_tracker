import { addDays, isBefore, isSameDay } from 'date-fns';

export function calculateTaskScore({
  priority,
  complexity,
  type,
  dueDate,
  completedAt,
}: {
  priority: 'low' | 'medium' | 'high' | 'critical';
  complexity: number;
  type?: string;
  dueDate?: Date | null;
  completedAt?: Date | null;
}): number {
  const priorityMap = { low: 1, medium: 2, high: 3, critical: 4 };
  const p = priorityMap[priority] || 1;
  const c = complexity || 1;
  let baseScore = p * c * 6;
  if (type === 'milestone') baseScore *= 1.2;
  if (type === 'recurring') baseScore *= 0.9;
  let timeMultiplier = 1.0;
  if (dueDate && completedAt) {
    const due = dueDate.getTime();
    const done = completedAt.getTime();
    const diff = done - due;
    if (diff < -1000 * 60 * 5) {
      timeMultiplier = 1.1;
    } else if (Math.abs(diff) <= 1000 * 60 * 5) {
      timeMultiplier = 1.0;
    } else if (diff > 0 && diff <= 1000 * 60 * 60 * 24) {
      timeMultiplier = 0.7;
    } else if (diff > 1000 * 60 * 60 * 24) {
      timeMultiplier = 0.4;
    }
  }
  return Math.round(baseScore * timeMultiplier);
}

export function generateRecurringDates(pattern: any, startDate: Date): Date[] {
  const dates: Date[] = [startDate];
  const maxInstances = 30; // Safety cap
  const maxDaysForward = 90; // Safety cap
  
  if (!pattern || pattern.type === 'none') return dates;

  const endDate = pattern.endDate ? new Date(pattern.endDate) : addDays(startDate, maxDaysForward);
  
  if (pattern.type === 'daily') {
    let current = addDays(startDate, 1);
    while ((isBefore(current, endDate) || isSameDay(current, endDate)) && dates.length < maxInstances) {
      dates.push(new Date(current));
      current = addDays(current, 1);
    }
  } else if (pattern.type === 'weekly') {
    const daysOfWeek = pattern.daysOfWeek || []; // 0-6
    if (daysOfWeek.length === 0) return dates;
    
    let current = addDays(startDate, 1);
    while ((isBefore(current, endDate) || isSameDay(current, endDate)) && dates.length < maxInstances) {
      if (daysOfWeek.includes(current.getDay())) {
        dates.push(new Date(current));
      }
      current = addDays(current, 1);
    }
  } else if (pattern.type === 'custom') {
    const customDates = (pattern.customDates || []).map((d: string) => new Date(d));
    customDates.forEach((d: Date) => {
      if (!dates.some(existingDate => isSameDay(existingDate, d))) {
        dates.push(new Date(d));
      }
    });
    dates.sort((a, b) => a.getTime() - b.getTime());
  }

  return dates;
}
