import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { runAsync, allAsync } from '@/lib/db';
import { taskRepository } from '@/features/tasks/actions';
import { listRepository } from '@/features/lists/actions';
import type { CreateTaskInput } from '@/features/tasks/types';

describe('Task Repository', () => {
  beforeEach(async () => {
    await runAsync('DELETE FROM tasks');
    await runAsync('DELETE FROM lists');
    await runAsync('DELETE FROM labels');
    await runAsync('DELETE FROM task_labels');
    await runAsync('DELETE FROM change_logs');
  });

  afterEach(async () => {
    await runAsync('DELETE FROM tasks');
    await runAsync('DELETE FROM lists');
    await runAsync('DELETE FROM labels');
    await runAsync('DELETE FROM task_labels');
    await runAsync('DELETE FROM change_logs');
  });

  describe('create', () => {
    it('should create a task successfully', async () => {
      const list = await listRepository.create('Test List', '📋', '#3b82f6');
      
      const taskData: CreateTaskInput = {
        name: 'Test Task',
        description: 'Test Description',
        list_id: list.id,
        priority: 'high',
        estimated_time: 60,
      };

      const task = await taskRepository.create(taskData);

      expect(task.id).toBeNumber();
      expect(task.name).toBe('Test Task');
      expect(task.description).toBe('Test Description');
      expect(task.list_id).toBe(list.id);
      expect(task.priority).toBe('high');
      expect(task.estimated_time).toBe(60);
      expect(task.status).toBe('todo');
    });

    it('should create a task with labels', async () => {
      const list = await listRepository.create('Test List', '📋', '#3b82f6');
      const labelResult = await runAsync('INSERT INTO labels (name, emoji, color) VALUES (?, ?, ?)', ['Test Label', '🏷️', '#8b5cf6']);
      const labelId = (labelResult as any).lastID;

      const taskData: CreateTaskInput = {
        name: 'Test Task',
        list_id: list.id,
        labels: [labelId],
      };

      const task = await taskRepository.create(taskData);
      const taskLabels = await allAsync<any>('SELECT * FROM task_labels WHERE task_id = ?', [task.id]);

      expect(taskLabels.length).toBe(1);
      expect(taskLabels[0].label_id).toBe(labelId);
    });
  });

  describe('findById', () => {
    it('should find a task by id', async () => {
      const list = await listRepository.create('Test List', '📋', '#3b82f6');
      const task = await taskRepository.create({
        name: 'Test Task',
        list_id: list.id,
      });

      const found = await taskRepository.findById(task.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(task.id);
      expect(found?.name).toBe('Test Task');
    });

    it('should return null for non-existent task', async () => {
      const found = await taskRepository.findById(999);
      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    it('should update task fields', async () => {
      const list = await listRepository.create('Test List', '📋', '#3b82f6');
      const task = await taskRepository.create({
        name: 'Test Task',
        list_id: list.id,
        priority: 'low',
      });

      const updated = await taskRepository.update({
        id: task.id,
        name: 'Updated Task',
        priority: 'high',
      });

      expect(updated.name).toBe('Updated Task');
      expect(updated.priority).toBe('high');
    });

    it('should log changes when updating', async () => {
      const list = await listRepository.create('Test List', '📋', '#3b82f6');
      const task = await taskRepository.create({
        name: 'Test Task',
        list_id: list.id,
        priority: 'low',
      });

      await taskRepository.update({
        id: task.id,
        name: 'Updated Task',
      });

      const changeLogs = await allAsync<any>('SELECT * FROM change_logs WHERE task_id = ?', [task.id]);
      expect(changeLogs.length).toBeGreaterThan(0);

      const nameChange = changeLogs.find((cl: any) => cl.field_name === 'name');
      expect(nameChange).toBeDefined();
      expect(nameChange!.old_value).toBe('Test Task');
      expect(nameChange!.new_value).toBe('Updated Task');
    });

    it('should set completed_at when status changes to done', async () => {
      const list = await listRepository.create('Test List', '📋', '#3b82f6');
      const task = await taskRepository.create({
        name: 'Test Task',
        list_id: list.id,
      });

      const updated = await taskRepository.update({
        id: task.id,
        status: 'done',
      });

      expect(updated.status).toBe('done');
      expect(updated.completed_at).toBeDefined();
    });
  });

  describe('delete', () => {
    it('should delete a task', async () => {
      const list = await listRepository.create('Test List', '📋', '#3b82f6');
      const task = await taskRepository.create({
        name: 'Test Task',
        list_id: list.id,
      });

      await taskRepository.delete(task.id);

      const found = await taskRepository.findById(task.id);
      expect(found).toBeNull();
    });
  });

  describe('findWithDetails', () => {
    it('should return task with labels and attachments', async () => {
      const list = await listRepository.create('Test List', '📋', '#3b82f6');
      const labelResult = await runAsync('INSERT INTO labels (name, emoji, color) VALUES (?, ?, ?)', ['Test Label', '🏷️', '#8b5cf6']);
      const labelId = (labelResult as any).lastID;

      const task = await taskRepository.create({
        name: 'Test Task',
        list_id: list.id,
        labels: [labelId],
      });

      const taskWithDetails = await taskRepository.findWithDetails(task.id);

      expect(taskWithDetails).toBeDefined();
      expect(taskWithDetails?.list.id).toBe(list.id);
      expect(taskWithDetails?.labels.length).toBe(1);
      expect(taskWithDetails?.labels[0].name).toBe('Test Label');
    });
  });

  describe('labels', () => {
    it('should add labels to a task', async () => {
      const list = await listRepository.create('Test List', '📋', '#3b82f6');
      const label1Result = await runAsync('INSERT INTO labels (name, emoji, color) VALUES (?, ?, ?)', ['Label 1', '🏷️', '#8b5cf6']);
      const label2Result = await runAsync('INSERT INTO labels (name, emoji, color) VALUES (?, ?, ?)', ['Label 2', '🏷️', '#8b5cf6']);
      const label1Id = (label1Result as any).lastID;
      const label2Id = (label2Result as any).lastID;

      const task = await taskRepository.create({
        name: 'Test Task',
        list_id: list.id,
      });

      await taskRepository.addLabels(task.id, [label1Id, label2Id]);

      const taskLabels = await allAsync<any>('SELECT * FROM task_labels WHERE task_id = ?', [task.id]);
      expect(taskLabels.length).toBe(2);
    });

    it('should remove a label from a task', async () => {
      const list = await listRepository.create('Test List', '📋', '#3b82f6');
      const labelResult = await runAsync('INSERT INTO labels (name, emoji, color) VALUES (?, ?, ?)', ['Test Label', '🏷️', '#8b5cf6']);
      const labelId = (labelResult as any).lastID;

      const task = await taskRepository.create({
        name: 'Test Task',
        list_id: list.id,
        labels: [labelId],
      });

      await taskRepository.removeLabel(task.id, labelId);

      const taskLabels = await allAsync<any>('SELECT * FROM task_labels WHERE task_id = ?', [task.id]);
      expect(taskLabels.length).toBe(0);
    });
  });
});
