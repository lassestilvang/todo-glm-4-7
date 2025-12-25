import { runAsync, getAsync, allAsync } from '@/lib/db';
import type { Label } from '../tasks/types';

export const labelRepository = {
  findAll: async (): Promise<Label[]> => {
    return allAsync<Label>('SELECT * FROM labels ORDER BY created_at');
  },

  findById: async (id: number): Promise<Label | null> => {
    return getAsync<Label>('SELECT * FROM labels WHERE id = ?', [id]);
  },

  create: async (name: string, emoji: string, color: string): Promise<Label> => {
    const result = await runAsync('INSERT INTO labels (name, emoji, color) VALUES (?, ?, ?)', [name, emoji, color]);
    return (await labelRepository.findById(result.lastID))!;
  },

  update: async (id: number, name: string, emoji: string, color: string): Promise<Label> => {
    await runAsync(`
      UPDATE labels 
      SET name = ?, emoji = ?, color = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [name, emoji, color, id]);
    return (await labelRepository.findById(id))!;
  },

  delete: async (id: number): Promise<void> => {
    await runAsync('DELETE FROM labels WHERE id = ?', [id]);
  },

  findUsedLabels: async (): Promise<Label[]> => {
    return allAsync<Label>(`
      SELECT DISTINCT l.* FROM labels l
      JOIN task_labels tl ON l.id = tl.label_id
      ORDER BY l.created_at
    `);
  }
};
