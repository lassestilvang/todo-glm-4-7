import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { db } from '@/lib/db';
import { taskRepository } from '@/features/tasks/actions';
import { listRepository } from '@/features/lists/actions';
import { viewUtils } from '@/features/tasks/views';
import { startOfDay, endOfDay, addDays } from 'date-fns';

describe('View Utils', () => {
  let listId: number;

  beforeEach(async () => {
    await db.run('DELETE FROM tasks');
    await db.run('DELETE FROM lists');
    await db.run('DELETE FROM labels');
    await db.run('DELETE FROM task_labels');

    const list = await listRepository.create('Test List', '📋', '#3b82f6');
    listId = list.id;
  });

  afterEach(async () => {
    await db.run('DELETE FROM tasks');
    await db.run('DELETE FROM lists');
    await db.run('DELETE FROM labels');
    await db.run('DELETE FROM task_labels');
  });

  describe('getTodayTasks', () => {
    it('should return tasks scheduled for today', async () => {
      const today = new Date();
      const task1 = await taskRepository.create({
        name: 'Today Task',
        list_id: listId,
        deadline: today,
      });

      const task2 = await taskRepository.create({
        name: 'Tomorrow Task',
        list_id: listId,
        deadline: addDays(today, 1),
      });

      const todayTasks = await viewUtils.getTodayTasks();

      expect(todayTasks.length).toBe(1);
      expect(todayTasks[0].id).toBe(task1.id);
    });

    it('should include completed tasks when showCompleted is true', async () => {
      const today = new Date();
      const task = await taskRepository.create({
        name: 'Task',
        list_id: listId,
        deadline: today,
      });

      await taskRepository.update({ id: task.id, status: 'done' });

      const todayTasks = await viewUtils.getTodayTasks(true);
      expect(todayTasks.length).toBe(1);
    });

    it('should exclude completed tasks by default', async () => {
      const today = new Date();
      const task = await taskRepository.create({
        name: 'Task',
        list_id: listId,
        deadline: today,
      });

      await taskRepository.update({ id: task.id, status: 'done' });

      const todayTasks = await viewUtils.getTodayTasks();
      expect(todayTasks.length).toBe(0);
    });
  });

  describe('getNext7DaysTasks', () => {
    it('should return tasks scheduled for the next 7 days', async () => {
      const today = new Date();
      await taskRepository.create({
        name: 'Today Task',
        list_id: listId,
        deadline: today,
      });
      await taskRepository.create({
        name: 'Day 3 Task',
        list_id: listId,
        deadline: addDays(today, 3),
      });
      await taskRepository.create({
        name: 'Day 10 Task',
        list_id: listId,
        deadline: addDays(today, 10),
      });

      const next7DaysTasks = await viewUtils.getNext7DaysTasks();

      expect(next7DaysTasks.length).toBe(2);
    });
  });

  describe('getUpcomingTasks', () => {
    it('should return all future tasks', async () => {
      const today = new Date();
      await taskRepository.create({
        name: 'Today Task',
        list_id: listId,
        deadline: today,
      });
      await taskRepository.create({
        name: 'Future Task',
        list_id: listId,
        deadline: addDays(today, 30),
      });
      await taskRepository.create({
        name: 'Past Task',
        list_id: listId,
        deadline: addDays(today, -1),
      });

      const upcomingTasks = await viewUtils.getUpcomingTasks();

      expect(upcomingTasks.length).toBe(2);
    });
  });

  describe('getAllTasks', () => {
    it('should return all tasks including unscheduled ones', async () => {
      const today = new Date();
      await taskRepository.create({
        name: 'Scheduled Task',
        list_id: listId,
        deadline: today,
      });
      await taskRepository.create({
        name: 'Unscheduled Task',
        list_id: listId,
      });

      const allTasks = await viewUtils.getAllTasks();

      expect(allTasks.length).toBe(2);
    });
  });

  describe('getOverdueTasks', () => {
    it('should return tasks that are past their deadline and not done', async () => {
      const yesterday = addDays(new Date(), -1);
      const task1 = await taskRepository.create({
        name: 'Overdue Task',
        list_id: listId,
        deadline: yesterday,
      });
      
      const task2 = await taskRepository.create({
        name: 'Completed Overdue Task',
        list_id: listId,
        deadline: yesterday,
      });

      await taskRepository.update({ id: task2.id, status: 'done' });

      const overdueTasks = await viewUtils.getOverdueTasks();

      expect(overdueTasks.length).toBe(1);
      expect(overdueTasks[0].id).toBe(task1.id);
    });
  });

  describe('getTasksByView', () => {
    it('should return correct tasks for each view type', async () => {
      const today = new Date();
      await taskRepository.create({
        name: 'Today Task',
        list_id: listId,
        deadline: today,
      });

      const todayTasks = await viewUtils.getTasksByView('today');
      const allTasks = await viewUtils.getTasksByView('all');

      expect(todayTasks.length).toBe(1);
      expect(allTasks.length).toBe(1);
    });
  });
});
