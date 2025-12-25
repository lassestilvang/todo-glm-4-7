import { startOfDay, endOfDay, addDays } from 'date-fns';
import { taskRepository } from './actions';
import type { Task, ViewType, CreateTaskInput } from './types';

export const viewUtils = {
  getTodayTasks: async (showCompleted: boolean = false): Promise<Task[]> => {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    
    const allTasks = await taskRepository.findByDeadlineRange(todayStart, todayEnd);
    
    if (!showCompleted) {
      return allTasks.filter(t => t.status !== 'done');
    }
    
    return allTasks;
  },

  getNext7DaysTasks: async (showCompleted: boolean = false): Promise<Task[]> => {
    const today = startOfDay(new Date());
    const weekEnd = endOfDay(addDays(today, 7));
    
    const allTasks = await taskRepository.findByDeadlineRange(today, weekEnd);
    
    if (!showCompleted) {
      return allTasks.filter(t => t.status !== 'done');
    }
    
    return allTasks;
  },

  getUpcomingTasks: async (showCompleted: boolean = false): Promise<Task[]> => {
    const today = startOfDay(new Date());
    const allTasks = await taskRepository.findAll();
    
    const upcoming = allTasks.filter(t => {
      if (t.deadline && new Date(t.deadline) >= today) {
        return true;
      }
      return false;
    });
    
    if (!showCompleted) {
      return upcoming.filter(t => t.status !== 'done');
    }
    
    return upcoming;
  },

  getAllTasks: async (showCompleted: boolean = false): Promise<Task[]> => {
    const allTasks = await taskRepository.findAll();
    
    if (!showCompleted) {
      return allTasks.filter(t => t.status !== 'done');
    }
    
    return allTasks;
  },

  getOverdueTasks: async (): Promise<Task[]> => {
    return taskRepository.findOverdue();
  },

  getTasksByView: async (view: ViewType, showCompleted: boolean = false): Promise<Task[]> => {
    switch (view) {
      case 'today':
        return viewUtils.getTodayTasks(showCompleted);
      case 'next_7_days':
        return viewUtils.getNext7DaysTasks(showCompleted);
      case 'upcoming':
        return viewUtils.getUpcomingTasks(showCompleted);
      case 'all':
        return viewUtils.getAllTasks(showCompleted);
      default:
        return [];
    }
  }
};

export const recurringTaskUtils = {
  getNextOccurrence: (task: Task): Date | null => {
    if (!task.deadline || task.recurring_pattern === 'none') {
      return null;
    }

    const baseDate = new Date(task.deadline);
    const daysToAdd = task.recurrence_count ? task.recurrence_count : 1;
    
    switch (task.recurring_pattern) {
      case 'daily':
        return addDays(baseDate, 1);
      case 'weekly':
        return addDays(baseDate, 7);
      case 'weekdays':
        let nextDay = addDays(baseDate, 1);
        while (nextDay.getDay() === 0 || nextDay.getDay() === 6) {
          nextDay = addDays(nextDay, 1);
        }
        return nextDay;
      case 'monthly':
        const monthlyDate = new Date(baseDate);
        monthlyDate.setMonth(monthlyDate.getMonth() + 1);
        return monthlyDate;
      case 'yearly':
        const yearlyDate = new Date(baseDate);
        yearlyDate.setFullYear(yearlyDate.getFullYear() + 1);
        return yearlyDate;
      case 'custom':
        return addDays(baseDate, daysToAdd * 7);
      default:
        return null;
    }
  },

  shouldCreateNextInstance: (task: Task): boolean => {
    if (task.status !== 'done' || task.recurring_pattern === 'none') {
      return false;
    }

    if (task.recurring_end_date) {
      const endDate = new Date(task.recurring_end_date);
      if (new Date() > endDate) {
        return false;
      }
    }

    return true;
  },

  createNextInstance: async (task: Task): Promise<Task | null> => {
    if (!recurringTaskUtils.shouldCreateNextInstance(task)) {
      return null;
    }

    const nextDeadline = recurringTaskUtils.getNextOccurrence(task);
    if (!nextDeadline) {
      return null;
    }

    const createInput: CreateTaskInput = {
      name: task.name,
      description: task.description,
      list_id: task.list_id,
      deadline: (nextDeadline as Date | undefined),
      estimated_time: task.estimated_time,
      priority: task.priority,
      recurring_pattern: task.recurring_pattern,
      recurrence_count: task.recurrence_count
    };

    if (task.recurring_end_date) {
      createInput.recurring_end_date = new Date(task.recurring_end_date);
    }

    return taskRepository.create(createInput);
  }
};
