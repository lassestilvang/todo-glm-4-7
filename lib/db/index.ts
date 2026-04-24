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

export interface RunAsyncResult {
  lastID: number;
  changes: number;
}

interface DbRow {
  [key: string]: unknown;
}

function runAsync(sql: string, params: unknown[] = []): Promise<RunAsyncResult> {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  });
}

function convertRow<T>(row: DbRow): T {
  const converted: DbRow = { ...row };
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
        else resolve(row ? convertRow<T>(row as DbRow) : undefined);
      });
    });
  });
}

function allAsync<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve((rows as unknown[]).map((row) => convertRow<T>(row as DbRow)));
      });
    });
  });
}

export { db, dbPath, runAsync, getAsync, allAsync, convertRow };
