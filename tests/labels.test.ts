import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { db } from '@/lib/db';
import { labelRepository } from '@/features/labels/actions';
import { listRepository } from '@/features/lists/actions';
import { taskRepository } from '@/features/tasks/actions';

describe('Label Repository', () => {
  beforeEach(async () => {
    await db.run('DELETE FROM labels');
    await db.run('DELETE FROM lists');
    await db.run('DELETE FROM tasks');
    await db.run('DELETE FROM task_labels');
  });

  afterEach(async () => {
    await db.run('DELETE FROM labels');
    await db.run('DELETE FROM lists');
    await db.run('DELETE FROM tasks');
    await db.run('DELETE FROM task_labels');
  });

  describe('create', () => {
    it('should create a label successfully', async () => {
      const label = await labelRepository.create('Urgent', '🔥', '#ef4444');

      expect(label.id).toBeNumber();
      expect(label.name).toBe('Urgent');
      expect(label.emoji).toBe('🔥');
      expect(label.color).toBe('#ef4444');
    });

    it('should set default emoji and color if not provided', async () => {
      const label = await labelRepository.create('Default', '🏷️', '#8b5cf6');

      expect(label.emoji).toBe('🏷️');
      expect(label.color).toBe('#8b5cf6');
    });
  });

  describe('findById', () => {
    it('should find a label by id', async () => {
      const label = await labelRepository.create('Urgent', '🔥', '#ef4444');
      const found = await labelRepository.findById(label.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(label.id);
      expect(found?.name).toBe('Urgent');
    });

    it('should return null for non-existent label', async () => {
      const found = await labelRepository.findById(999);
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all labels', async () => {
      await labelRepository.create('Urgent', '🔥', '#ef4444');
      await labelRepository.create('Work', '💼', '#3b82f6');
      await labelRepository.create('Personal', '🏠', '#10b981');

      const labels = await labelRepository.findAll();

      expect(labels.length).toBe(3);
    });

    it('should return empty array when no labels exist', async () => {
      const labels = await labelRepository.findAll();
      expect(labels).toBeArray();
      expect(labels.length).toBe(0);
    });
  });

  describe('update', () => {
    it('should update label fields', async () => {
      const label = await labelRepository.create('Urgent', '🔥', '#ef4444');
      const updated = await labelRepository.update(label.id, 'Updated', '✅', '#10b981');

      expect(updated.name).toBe('Updated');
      expect(updated.emoji).toBe('✅');
      expect(updated.color).toBe('#10b981');
    });

    it('should update updated_at timestamp', async () => {
      const label = await labelRepository.create('Urgent', '🔥', '#ef4444');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const updated = await labelRepository.update(label.id, 'Updated', '✅', '#10b981');

      expect(new Date(updated.updated_at).getTime()).toBeGreaterThan(new Date(label.updated_at).getTime());
    });
  });

  describe('delete', () => {
    it('should delete a label', async () => {
      const label = await labelRepository.create('Urgent', '🔥', '#ef4444');

      await labelRepository.delete(label.id);

      const found = await labelRepository.findById(label.id);
      expect(found).toBeNull();
    });

    it('should cascade delete from task_labels', async () => {
      const list = await listRepository.create('Test List', '📋', '#3b82f6');
      const label = await labelRepository.create('Urgent', '🔥', '#ef4444');
      
      const task = await taskRepository.create({
        name: 'Test Task',
        list_id: list.id,
        labels: [label.id],
      });

      await labelRepository.delete(label.id);

      const taskLabels = await db.all('SELECT * FROM task_labels WHERE label_id = ?', [label.id]);
      expect(taskLabels.length).toBe(0);
    });
  });

  describe('findUsedLabels', () => {
    it('should return only labels that are used by tasks', async () => {
      const list = await listRepository.create('Test List', '📋', '#3b82f6');
      const label1 = await labelRepository.create('Urgent', '🔥', '#ef4444');
      const label2 = await labelRepository.create('Work', '💼', '#3b82f6');
      await labelRepository.create('Unused', '🗑️', '#6b7280');

      await taskRepository.create({
        name: 'Test Task 1',
        list_id: list.id,
        labels: [label1.id],
      });

      await taskRepository.create({
        name: 'Test Task 2',
        list_id: list.id,
        labels: [label2.id],
      });

      const usedLabels = await labelRepository.findUsedLabels();

      expect(usedLabels.length).toBe(2);
      expect(usedLabels.some(l => l.id === label1.id)).toBeTrue();
      expect(usedLabels.some(l => l.id === label2.id)).toBeTrue();
      expect(usedLabels.some(l => l.name === 'Unused')).toBeFalse();
    });

    it('should return empty array when no labels are used', async () => {
      await labelRepository.create('Unused', '🗑️', '#6b7280');

      const usedLabels = await labelRepository.findUsedLabels();

      expect(usedLabels.length).toBe(0);
    });
  });
});
