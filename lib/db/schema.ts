import { runAsync, allAsync } from './index';

const createTables = async () => {
  await runAsync(`
    CREATE TABLE IF NOT EXISTS lists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL DEFAULT '📋',
      color TEXT NOT NULL DEFAULT '#3b82f6',
      is_inbox INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      list_id INTEGER NOT NULL,
      deadline DATETIME,
      reminder_time DATETIME,
      estimated_time INTEGER,
      actual_time INTEGER,
      priority TEXT NOT NULL DEFAULT 'none',
      status TEXT NOT NULL DEFAULT 'todo',
      completed_at DATETIME,
      recurring_pattern TEXT,
      recurring_end_date DATETIME,
      recurrence_count INTEGER,
      parent_task_id INTEGER,
      position INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE CASCADE
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS labels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL DEFAULT '🏷️',
      color TEXT NOT NULL DEFAULT '#8b5cf6',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS task_labels (
      task_id INTEGER NOT NULL,
      label_id INTEGER NOT NULL,
      PRIMARY KEY (task_id, label_id),
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS task_attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      mime_type TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS change_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      field_name TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    )
  `);

  await runAsync('CREATE INDEX IF NOT EXISTS idx_tasks_list_id ON tasks(list_id)');
  await runAsync('CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)');
  await runAsync('CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline)');
  await runAsync('CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id)');
  await runAsync('CREATE INDEX IF NOT EXISTS idx_change_logs_task_id ON change_logs(task_id)');
  await runAsync('CREATE INDEX IF NOT EXISTS idx_change_logs_changed_at ON change_logs(changed_at)');
};

export const initializeInbox = async () => {
  const lists = await allAsync<{ id: number }>('SELECT id FROM lists WHERE is_inbox = 1');
  
  if (lists.length === 0) {
    await runAsync(`
      INSERT INTO lists (name, emoji, color, is_inbox)
      VALUES ('Inbox', '📥', '#3b82f6', 1)
    `);
    console.log('✓ Inbox list created');
  }
};

export const migrate = async () => {
  await createTables();
  console.log('✓ Database initialized');
  await initializeInbox();
};
