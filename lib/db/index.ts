import * as sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'planner.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  }
});

db.serialize(() => {
  db.run('PRAGMA journal_mode = WAL');
  db.run('PRAGMA foreign_keys = ON');
});

function runAsync(sql: string, params: unknown[] = []): Promise<{ lastID: number; changes: number }> {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  });
}

function convertRow<T>(row: any): T {
  const converted = { ...row };
  for (const key in converted) {
    if (typeof converted[key] === 'number' && (converted[key] === 0 || converted[key] === 1)) {
      converted[key] = Boolean(converted[key]);
    }
  }
  return converted as T;
}

function getAsync<T>(sql: string, params: unknown[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row ? convertRow<T>(row) : undefined);
      });
    });
  });
}

function allAsync<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve((rows as any[]).map(row => convertRow<T>(row)));
      });
    });
  });
}

export { db, dbPath, runAsync, getAsync, allAsync, convertRow };
