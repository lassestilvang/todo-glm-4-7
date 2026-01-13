import { parseISO } from 'date-fns';
import { format as formatTz, toZonedTime, fromZonedTime } from 'date-fns-tz';

export type Timezone = string;

export const getUserTimezone = (): Timezone => {
  if (typeof window === 'undefined') {
    return 'UTC';
  }
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
};

export const toUTC = (date: Date | string, timezone?: Timezone): Date => {
  const tz = timezone || getUserTimezone();
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return fromZonedTime(dateObj, tz);
};

export const fromUTC = (date: Date | string, timezone?: Timezone): Date => {
  const tz = timezone || getUserTimezone();
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return toZonedTime(dateObj, tz);
};

export const formatDate = (date: Date | string, formatStr: string, timezone?: Timezone): string => {
  const tz = timezone || getUserTimezone();
  const localDate = fromUTC(date, tz);
  return formatTz(localDate, formatStr, { timeZone: tz });
};

export const formatDateDisplay = (date: Date | string, timezone?: Timezone): string => {
  return formatDate(date, 'MMM d, h:mm a', timezone);
};

export const formatDateShort = (date: Date | string, timezone?: Timezone): string => {
  return formatDate(date, 'MMM d', timezone);
};

export const formatDateInput = (date: Date | string, timezone?: Timezone): string => {
  const tz = timezone || getUserTimezone();
  const localDate = fromUTC(date, tz);
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  const hours = String(localDate.getHours()).padStart(2, '0');
  const minutes = String(localDate.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const parseDateInput = (dateStr: string, timezone?: Timezone): Date | null => {
  if (!dateStr) return null;
  try {
    const tz = timezone || getUserTimezone();
    const date = parseISO(dateStr);
    return toUTC(date, tz);
  } catch {
    return null;
  }
};

export const isToday = (date: Date | string, timezone?: Timezone): boolean => {
  const tz = timezone || getUserTimezone();
  const localDate = fromUTC(date, tz);
  const today = toZonedTime(new Date(), tz);
  return (
    localDate.getFullYear() === today.getFullYear() &&
    localDate.getMonth() === today.getMonth() &&
    localDate.getDate() === today.getDate()
  );
};

export const isPast = (date: Date | string, timezone?: Timezone): boolean => {
  const tz = timezone || getUserTimezone();
  const localDate = fromUTC(date, tz);
  const now = toZonedTime(new Date(), tz);
  return localDate < now;
};

export const isFuture = (date: Date | string, timezone?: Timezone): boolean => {
  return !isPast(date, timezone);
};

export const isOverdue = (date: Date | string, status: string, timezone?: Timezone): boolean => {
  if (status === 'done') return false;
  return isPast(date, timezone);
};

export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

export const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};
