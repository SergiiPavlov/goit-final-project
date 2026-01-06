import ms from 'ms';

export function addMs(date: Date, duration: string): Date {
  const delta = ms(duration);
  if (typeof delta !== 'number' || !Number.isFinite(delta) || delta <= 0) {
    throw new Error(`Invalid duration: ${duration}`);
  }
  return new Date(date.getTime() + delta);
}

export function parseDateYYYYMMDD(value: string): Date {
  // We store dates as @db.Date in Postgres. Use UTC midnight to avoid local timezone shifts.
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid date: ${value}`);
  }
  return d;
}
