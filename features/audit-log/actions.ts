import { getAsync, allAsync, runAsync } from '@/lib/db';
import type { ChangeLog } from '../tasks/types';

export const auditLogRepository = {
  findByTask: async (taskId: number): Promise<ChangeLog[]> => {
    return allAsync<ChangeLog>(`
      SELECT * FROM change_logs 
      WHERE task_id = ? 
      ORDER BY changed_at DESC
      LIMIT 100
    `, [taskId]);
  },

  findByTaskPaginated: async (taskId: number, page: number = 0, limit: number = 20): Promise<ChangeLog[]> => {
    return allAsync<ChangeLog>(`
      SELECT * FROM change_logs 
      WHERE task_id = ? 
      ORDER BY changed_at DESC
      LIMIT ? OFFSET ?
    `, [taskId, limit, page * limit]);
  },

  countByTask: async (taskId: number): Promise<number> => {
    const result = await getAsync<{ count: number }>('SELECT COUNT(*) as count FROM change_logs WHERE task_id = ?', [taskId]);
    return result?.count || 0;
  },

  deleteOldLogs: async (days: number = 90): Promise<number> => {
    const result = await runAsync(`
      DELETE FROM change_logs 
      WHERE changed_at < datetime('now', '-' || ? || ' days')
    `, [days]);
    return result.changes;
  }
};
