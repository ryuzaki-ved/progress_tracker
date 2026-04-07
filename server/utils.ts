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
