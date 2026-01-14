import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { runAsync, allAsync } from '@/lib/db';
import { listRepository } from '@/features/lists/actions';

describe('List Repository', () => {
  beforeEach(async () => {
    await runAsync('DELETE FROM lists');
    await runAsync('DELETE FROM tasks');
  });

  afterEach(async () => {
    await runAsync('DELETE FROM lists');
    await runAsync('DELETE FROM tasks');
  });

  describe('create', () => {
    it('should create a list successfully', async () => {
      const list = await listRepository.create('Work', '💼', '#3b82f6');

      expect(list.id).toBeNumber();
      expect(list.name).toBe('Work');
      expect(list.emoji).toBe('💼');
      expect(list.color).toBe('#3b82f6');
      expect(list.is_inbox).toBeFalse();
    });

    it('should set default emoji and color if not provided', async () => {
      const list = await listRepository.create('Work', '📋', '#3b82f6');

      expect(list.emoji).toBe('📋');
      expect(list.color).toBe('#3b82f6');
    });
  });

  describe('findById', () => {
    it('should find a list by id', async () => {
      const list = await listRepository.create('Work', '💼', '#3b82f6');
      const found = await listRepository.findById(list.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(list.id);
      expect(found?.name).toBe('Work');
    });

    it('should return null for non-existent list', async () => {
      const found = await listRepository.findById(999);
      expect(found).toBeNull();
    });
  });

  describe('findInbox', () => {
    it('should find the inbox list', async () => {
      await runAsync("INSERT INTO lists (name, emoji, color, is_inbox) VALUES ('Inbox', '📥', '#3b82f6', 1)");
      const inbox = await listRepository.findInbox();

      expect(inbox).toBeDefined();
      expect(inbox?.is_inbox).toBeTrue();
    });

    it('should return null if inbox does not exist', async () => {
      const inbox = await listRepository.findInbox();
      expect(inbox).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all lists ordered by inbox first', async () => {
      const list1 = await listRepository.create('Work', '💼', '#3b82f6');
      const list2 = await listRepository.create('Personal', '🏠', '#10b981');
      await runAsync("INSERT INTO lists (name, emoji, color, is_inbox) VALUES ('Inbox', '📥', '#3b82f6', 1)");

      const lists = await listRepository.findAll();

      expect(lists.length).toBe(3);
      expect(lists[0].is_inbox).toBeTrue();
      expect(lists[1].id).toBe(list1.id);
      expect(lists[2].id).toBe(list2.id);
    });
  });

  describe('update', () => {
    it('should update list fields', async () => {
      const list = await listRepository.create('Work', '💼', '#3b82f6');
      const updated = await listRepository.update(list.id, 'Updated Work', '🔧', '#ef4444');

      expect(updated.name).toBe('Updated Work');
      expect(updated.emoji).toBe('🔧');
      expect(updated.color).toBe('#ef4444');
    });

    it('should update updated_at timestamp', async () => {
      const list = await listRepository.create('Work', '💼', '#3b82f6');

      await new Promise(resolve => setTimeout(resolve, 1100));

      const updated = await listRepository.update(list.id, 'Updated Work', '🔧', '#ef4444');

      expect(new Date(updated.updated_at).getTime()).toBeGreaterThan(new Date(list.updated_at).getTime());
    });
  });

  describe('delete', () => {
    it('should delete a list', async () => {
      const list = await listRepository.create('Work', '💼', '#3b82f6');

      await listRepository.delete(list.id);

      const found = await listRepository.findById(list.id);
      expect(found).toBeNull();
    });

    it('should throw error when trying to delete inbox', async () => {
      await runAsync("INSERT INTO lists (name, emoji, color, is_inbox) VALUES ('Inbox', '📥', '#3b82f6', 1)");
      const inbox = await listRepository.findInbox();

      await expect(listRepository.delete(inbox!.id)).rejects.toThrow('Cannot delete Inbox list');
    });

    it('should cascade delete tasks when list is deleted', async () => {
      const list = await listRepository.create('Work', '💼', '#3b82f6');
      await runAsync('INSERT INTO tasks (name, list_id) VALUES (?, ?)', ['Test Task', list.id]);

      await listRepository.delete(list.id);

      const tasks = await allAsync('SELECT * FROM tasks WHERE list_id = ?', [list.id]);
      expect(tasks.length).toBe(0);
    });
  });
});
