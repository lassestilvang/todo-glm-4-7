import { describe, it, expect } from 'bun:test';
import {
  getUserTimezone,
  toUTC,
  fromUTC,
  formatDateDisplay,
  formatDateInput,
  parseDateInput,
  isToday,
  isPast,
  isFuture,
  isOverdue,
  minutesToTime,
  timeToMinutes,
} from '@/lib/utils/time';

describe('Time Utilities', () => {
  describe('getUserTimezone', () => {
    it('should return a timezone string', () => {
      const tz = getUserTimezone();
      expect(tz).toBeString();
      expect(tz.length).toBeGreaterThan(0);
    });
  });

  describe('toUTC and fromUTC', () => {
    it('should convert date to UTC and back', () => {
      const date = new Date('2026-01-12T12:00:00');
      const utcDate = toUTC(date);
      expect(utcDate).toBeInstanceOf(Date);

      const localDate = fromUTC(utcDate);
      expect(localDate).toBeInstanceOf(Date);
    });
  });

  describe('formatDateDisplay', () => {
    it('should format date in readable format', () => {
      const date = new Date('2026-01-12T12:00:00');
      const formatted = formatDateDisplay(date);
      expect(formatted).toBeString();
      expect(formatted).toContain('Jan');
    });
  });

  describe('formatDateInput', () => {
    it('should format date for datetime-local input', () => {
      const date = new Date('2026-01-12T12:00:00');
      const formatted = formatDateInput(date);
      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    });
  });

  describe('parseDateInput', () => {
    it('should parse datetime-local input to Date', () => {
      const dateStr = '2026-01-12T12:00';
      const parsed = parseDateInput(dateStr);
      expect(parsed).toBeInstanceOf(Date);
      expect(parsed?.getFullYear()).toBe(2026);
    });

    it('should return null for empty string', () => {
      const parsed = parseDateInput('');
      expect(parsed).toBeNull();
    });
  });

  describe('isToday', () => {
    it('should correctly identify today', () => {
      const now = new Date();
      expect(isToday(now)).toBeTrue();
    });

    it('should identify non-today dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isToday(tomorrow)).toBeFalse();
    });
  });

  describe('isPast', () => {
    it('should identify past dates', () => {
      const past = new Date('2025-01-01');
      expect(isPast(past)).toBeTrue();
    });

    it('should identify future dates', () => {
      const future = new Date('2030-01-01');
      expect(isPast(future)).toBeFalse();
    });
  });

  describe('isFuture', () => {
    it('should identify future dates', () => {
      const future = new Date('2030-01-01');
      expect(isFuture(future)).toBeTrue();
    });
  });

  describe('isOverdue', () => {
    it('should identify overdue tasks', () => {
      const past = new Date('2025-01-01');
      expect(isOverdue(past, 'todo')).toBeTrue();
    });

    it('should not mark completed tasks as overdue', () => {
      const past = new Date('2025-01-01');
      expect(isOverdue(past, 'done')).toBeFalse();
    });

    it('should not mark future tasks as overdue', () => {
      const future = new Date('2030-01-01');
      expect(isOverdue(future, 'todo')).toBeFalse();
    });
  });

  describe('minutesToTime', () => {
    it('should convert minutes to HH:mm format', () => {
      expect(minutesToTime(90)).toBe('01:30');
      expect(minutesToTime(60)).toBe('01:00');
      expect(minutesToTime(30)).toBe('00:30');
      expect(minutesToTime(0)).toBe('00:00');
    });
  });

  describe('timeToMinutes', () => {
    it('should convert HH:mm to minutes', () => {
      expect(timeToMinutes('01:30')).toBe(90);
      expect(timeToMinutes('01:00')).toBe(60);
      expect(timeToMinutes('00:30')).toBe(30);
      expect(timeToMinutes('00:00')).toBe(0);
    });
  });
});
