import { runAsync, getAsync, allAsync } from '@/lib/db';
import type { List } from '../tasks/types';

export const listRepository = {
  findAll: async (): Promise<List[]> => {
    return allAsync<List>('SELECT * FROM lists ORDER BY is_inbox DESC, created_at');
  },

  findById: async (id: number): Promise<List | null> => {
    console.log('findById: id =', id, 'typeof id =', typeof id);
    const result = await getAsync<any>('SELECT * FROM lists WHERE id = ?', [id]);
    console.log('findById: result =', result);
    return result || null;
  },

  findInbox: async (): Promise<List | null> => {
    const result = await getAsync<any>('SELECT * FROM lists WHERE is_inbox = 1');
    return result || null;
  },

  create: async (name: string, emoji: string, color: string): Promise<List> => {
    const result = await runAsync('INSERT INTO lists (name, emoji, color, is_inbox) VALUES (?, ?, ?, 0)', [name, emoji, color]);
    return (await listRepository.findById(result.lastID))!;
  },

  update: async (id: number, name: string, emoji: string, color: string): Promise<List> => {
    await runAsync(`
      UPDATE lists 
      SET name = ?, emoji = ?, color = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [name, emoji, color, id]);
    return (await listRepository.findById(id))!;
  },

  delete: async (id: number): Promise<void> => {
    const list = await listRepository.findById(id);
    if (list?.is_inbox) {
      throw new Error('Cannot delete Inbox list');
    }
    await runAsync('DELETE FROM lists WHERE id = ?', [id]);
  }
};
