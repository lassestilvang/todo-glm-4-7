import { describe, it, expect } from 'bun:test';
import { recurringTaskUtils } from '@/features/tasks/views';
import type { Task } from '@/features/tasks/types';
import { addDays, addWeeks, addMonths, addYears, startOfDay } from 'date-fns';

describe('Recurring Task Utils', () => {
  describe('getNextOccurrence', () => {
    it('should return null for non-recurring tasks', () => {
      const task: Task = {
        id: 1,
        name: 'Test Task',
        description: null,
        list_id: 1,
        deadline: new Date().toISOString(),
        reminder_time: null,
        estimated_time: null,
        actual_time: null,
        priority: 'none',
        status: 'todo',
        completed_at: null,
        recurring_pattern: 'none',
        recurring_end_date: null,
        recurrence_count: null,
        parent_task_id: null,
        position: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const next = recurringTaskUtils.getNextOccurrence(task);
      expect(next).toBeNull();
    });

    it('should calculate next daily occurrence', () => {
      const today = startOfDay(new Date());
      const task: Task = {
        id: 1,
        name: 'Test Task',
        description: null,
        list_id: 1,
        deadline: today.toISOString(),
        reminder_time: null,
        estimated_time: null,
        actual_time: null,
        priority: 'none',
        status: 'todo',
        completed_at: null,
        recurring_pattern: 'daily',
        recurring_end_date: null,
        recurrence_count: null,
        parent_task_id: null,
        position: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const next = recurringTaskUtils.getNextOccurrence(task);
      expect(next).toBeDefined();
      expect(next!.getDate()).toBe(addDays(today, 1).getDate());
    });

    it('should calculate next weekly occurrence', () => {
      const today = startOfDay(new Date());
      const task: Task = {
        id: 1,
        name: 'Test Task',
        description: null,
        list_id: 1,
        deadline: today.toISOString(),
        reminder_time: null,
        estimated_time: null,
        actual_time: null,
        priority: 'none',
        status: 'todo',
        completed_at: null,
        recurring_pattern: 'weekly',
        recurring_end_date: null,
        recurrence_count: null,
        parent_task_id: null,
        position: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const next = recurringTaskUtils.getNextOccurrence(task);
      expect(next).toBeDefined();
      expect(next!.getTime()).toBe(addWeeks(today, 1).getTime());
    });

    it('should calculate next monthly occurrence', () => {
      const today = startOfDay(new Date());
      const task: Task = {
        id: 1,
        name: 'Test Task',
        description: null,
        list_id: 1,
        deadline: today.toISOString(),
        reminder_time: null,
        estimated_time: null,
        actual_time: null,
        priority: 'none',
        status: 'todo',
        completed_at: null,
        recurring_pattern: 'monthly',
        recurring_end_date: null,
        recurrence_count: null,
        parent_task_id: null,
        position: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const next = recurringTaskUtils.getNextOccurrence(task);
      expect(next).toBeDefined();
    });

    it('should calculate next yearly occurrence', () => {
      const today = startOfDay(new Date());
      const task: Task = {
        id: 1,
        name: 'Test Task',
        description: null,
        list_id: 1,
        deadline: today.toISOString(),
        reminder_time: null,
        estimated_time: null,
        actual_time: null,
        priority: 'none',
        status: 'todo',
        completed_at: null,
        recurring_pattern: 'yearly',
        recurring_end_date: null,
        recurrence_count: null,
        parent_task_id: null,
        position: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const next = recurringTaskUtils.getNextOccurrence(task);
      expect(next).toBeDefined();
    });

    it('should skip weekends for weekday pattern', () => {
      const friday = new Date();
      friday.setDate(friday.getDate() + (5 - friday.getDay()));
      friday.setHours(0, 0, 0, 0);

      const task: Task = {
        id: 1,
        name: 'Test Task',
        description: null,
        list_id: 1,
        deadline: friday.toISOString(),
        reminder_time: null,
        estimated_time: null,
        actual_time: null,
        priority: 'none',
        status: 'todo',
        completed_at: null,
        recurring_pattern: 'weekdays',
        recurring_end_date: null,
        recurrence_count: null,
        parent_task_id: null,
        position: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const next = recurringTaskUtils.getNextOccurrence(task);
      expect(next).toBeDefined();
      expect(next!.getDay()).not.toBe(0);
      expect(next!.getDay()).not.toBe(6);
    });

    it('should handle custom recurrence count', () => {
      const today = startOfDay(new Date());
      const task: Task = {
        id: 1,
        name: 'Test Task',
        description: null,
        list_id: 1,
        deadline: today.toISOString(),
        reminder_time: null,
        estimated_time: null,
        actual_time: null,
        priority: 'none',
        status: 'todo',
        completed_at: null,
        recurring_pattern: 'custom',
        recurring_end_date: null,
        recurrence_count: 2,
        parent_task_id: null,
        position: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const next = recurringTaskUtils.getNextOccurrence(task);
      expect(next).toBeDefined();
      expect(next!.getTime()).toBe(addWeeks(today, 2).getTime());
    });
  });

  describe('shouldCreateNextInstance', () => {
    it('should return false for non-recurring tasks', () => {
      const task: Task = {
        id: 1,
        name: 'Test Task',
        description: null,
        list_id: 1,
        deadline: new Date().toISOString(),
        reminder_time: null,
        estimated_time: null,
        actual_time: null,
        priority: 'none',
        status: 'todo',
        completed_at: null,
        recurring_pattern: 'none',
        recurring_end_date: null,
        recurrence_count: null,
        parent_task_id: null,
        position: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      expect(recurringTaskUtils.shouldCreateNextInstance(task)).toBeFalse();
    });

    it('should return false for incomplete tasks', () => {
      const task: Task = {
        id: 1,
        name: 'Test Task',
        description: null,
        list_id: 1,
        deadline: new Date().toISOString(),
        reminder_time: null,
        estimated_time: null,
        actual_time: null,
        priority: 'none',
        status: 'todo',
        completed_at: null,
        recurring_pattern: 'daily',
        recurring_end_date: null,
        recurrence_count: null,
        parent_task_id: null,
        position: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      expect(recurringTaskUtils.shouldCreateNextInstance(task)).toBeFalse();
    });

    it('should return true for completed recurring tasks', () => {
      const task: Task = {
        id: 1,
        name: 'Test Task',
        description: null,
        list_id: 1,
        deadline: new Date().toISOString(),
        reminder_time: null,
        estimated_time: null,
        actual_time: null,
        priority: 'none',
        status: 'done',
        completed_at: new Date().toISOString(),
        recurring_pattern: 'daily',
        recurring_end_date: null,
        recurrence_count: null,
        parent_task_id: null,
        position: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      expect(recurringTaskUtils.shouldCreateNextInstance(task)).toBeTrue();
    });

    it('should return false if recurring end date has passed', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const task: Task = {
        id: 1,
        name: 'Test Task',
        description: null,
        list_id: 1,
        deadline: new Date().toISOString(),
        reminder_time: null,
        estimated_time: null,
        actual_time: null,
        priority: 'none',
        status: 'done',
        completed_at: new Date().toISOString(),
        recurring_pattern: 'daily',
        recurring_end_date: yesterday.toISOString(),
        recurrence_count: null,
        parent_task_id: null,
        position: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      expect(recurringTaskUtils.shouldCreateNextInstance(task)).toBeFalse();
    });
  });
});
