import { z } from 'zod';
import type { Priority, RecurringPattern, TaskStatus } from '../tasks/types';

export const taskSchema = z.object({
  name: z.string().min(1, 'Task name is required').max(200, 'Task name must be less than 200 characters'),
  description: z.string().optional(),
  list_id: z.number().int().positive('List ID is required'),
  deadline: z.string().datetime().optional().or(z.literal('')),
  reminder_time: z.string().datetime().optional().or(z.literal('')),
  estimated_time: z.string().regex(/^\d{1,3}:[0-5]\d$/, 'Estimated time must be in HH:mm format').optional(),
  actual_time: z.string().regex(/^\d{1,3}:[0-5]\d$/, 'Actual time must be in HH:mm format').optional(),
  priority: z.enum(['high', 'medium', 'low', 'none'] as const),
  labels: z.array(z.number().int().positive()).default([]),
  recurring_pattern: z.enum(['none', 'daily', 'weekly', 'weekdays', 'monthly', 'yearly', 'custom'] as const),
  recurring_end_date: z.string().datetime().optional().or(z.literal('')),
  subtasks: z.array(z.object({
    name: z.string().min(1, 'Subtask name is required'),
    description: z.string().optional(),
    estimated_time: z.string().regex(/^\d{1,3}:[0-5]\d$/, 'Estimated time must be in HH:mm format').optional(),
    actual_time: z.string().regex(/^\d{1,3}:[0-5]\d$/, 'Actual time must be in HH:mm format').optional(),
    priority: z.enum(['high', 'medium', 'low', 'none'] as const),
  })).default([])
});

export const updateTaskSchema = taskSchema.partial().extend({
  id: z.number().int().positive(),
  status: z.enum(['todo', 'in_progress', 'done'] as const).optional()
});

export const listSchema = z.object({
  name: z.string().min(1, 'List name is required').max(50, 'List name must be less than 50 characters'),
  emoji: z.string().min(1, 'Emoji is required').max(10, 'Emoji must be a single character'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color code')
});

export const labelSchema = z.object({
  name: z.string().min(1, 'Label name is required').max(30, 'Label name must be less than 30 characters'),
  emoji: z.string().min(1, 'Emoji is required').max(10, 'Emoji must be a single character'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color code')
});

export const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};
