
export function getNextRun(cronExpression: string, from: Date = new Date()): Date {
  const parts = cronExpression.trim().split(/\s+/);
  if (parts.length !== 5) {
    // Fallback — 1 hour from now if the expression is malformed
    return new Date(from.getTime() + 60 * 60 * 1000);
  }

  const [minuteStr, hourStr, dayOfMonthStr, , dayOfWeekStr] = parts;
  const minute = parseInt(minuteStr, 10);
  const hour = parseInt(hourStr, 10);
  const dayOfMonth = dayOfMonthStr === "*" ? null : parseInt(dayOfMonthStr, 10);
  const dayOfWeek = dayOfWeekStr === "*" ? null : parseInt(dayOfWeekStr, 10); // 0=Sunday..6=Saturday

  const candidate = new Date(from);
  candidate.setSeconds(0, 0);
  candidate.setMinutes(minute);
  candidate.setHours(hour);

  if (dayOfWeek !== null) {
    // Weekly pattern — find the next matching day-of-week at the target time
    for (let i = 0; i < 8; i++) {
      if (candidate.getDay() === dayOfWeek && candidate.getTime() > from.getTime()) {
        return candidate;
      }
      candidate.setDate(candidate.getDate() + 1);
    }
    return candidate; // safety fallback, should never reach here
  }

  if (dayOfMonth !== null) {
    // Monthly pattern — target day of the current month, or next month if passed
    candidate.setDate(dayOfMonth);
    if (candidate.getTime() <= from.getTime()) {
      candidate.setMonth(candidate.getMonth() + 1);
      candidate.setDate(dayOfMonth);
    }
    return candidate;
  }

  // Daily pattern — today at the target time, or tomorrow if already passed
  if (candidate.getTime() <= from.getTime()) {
    candidate.setDate(candidate.getDate() + 1);
  }
  return candidate;
}