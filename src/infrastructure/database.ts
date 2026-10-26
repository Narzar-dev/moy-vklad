import * as SQLite from 'expo-sqlite';

export const DB_VERSION = 1;
export async function openDatabase() {
  const db = await SQLite.openDatabaseAsync('moy-vklad.db');
  await db.execAsync(`PRAGMA foreign_keys = ON; CREATE TABLE IF NOT EXISTS schema_meta (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL); CREATE TABLE IF NOT EXISTS child_profiles (id TEXT PRIMARY KEY NOT NULL, display_name TEXT, child_gender TEXT NOT NULL CHECK(child_gender IN ('male','female')), age_band TEXT NOT NULL, created_at INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS task_occurrences (id TEXT PRIMARY KEY NOT NULL, child_profile_id TEXT NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE, local_date TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('planned','started','completed','skipped')), UNIQUE(child_profile_id, local_date, id)); CREATE TABLE IF NOT EXISTS task_completions (id TEXT PRIMARY KEY NOT NULL, occurrence_id TEXT NOT NULL UNIQUE REFERENCES task_occurrences(id) ON DELETE CASCADE, assistance_level TEXT NOT NULL, outcome TEXT NOT NULL, awarded_xp INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS xp_ledger (id TEXT PRIMARY KEY NOT NULL, child_profile_id TEXT NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE, source_id TEXT NOT NULL, idempotency_key TEXT NOT NULL UNIQUE, awarded_amount INTEGER NOT NULL, local_date TEXT NOT NULL, created_at INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS initiatives (id TEXT PRIMARY KEY NOT NULL, child_profile_id TEXT NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE, text TEXT NOT NULL, status TEXT NOT NULL, awarded_xp INTEGER NOT NULL DEFAULT 0, local_date TEXT NOT NULL, created_at INTEGER NOT NULL); CREATE INDEX IF NOT EXISTS idx_occurrences_date ON task_occurrences(local_date,status); CREATE INDEX IF NOT EXISTS idx_ledger_day ON xp_ledger(child_profile_id,local_date);`);
  await db.runAsync('INSERT OR REPLACE INTO schema_meta(key,value) VALUES(?,?)', 'version', String(DB_VERSION));
  return db;
}

export async function completeTask(db: SQLite.SQLiteDatabase, input: { occurrenceId: string; childId: string; assistance: string; outcome: string; awardedXp: number; date: string }) {
  let result = { idempotent: false, awardedXp: input.awardedXp };
  await db.withTransactionAsync(async () => {
    const existing = await db.getFirstAsync<{ id: string }>('SELECT id FROM task_completions WHERE occurrence_id = ?', input.occurrenceId);
    if (existing) { result = { idempotent: true, awardedXp: 0 }; return; }
    const now = Date.now(); const id = `${input.occurrenceId}:${now}`;
    await db.runAsync('UPDATE task_occurrences SET status = ? WHERE id = ?', 'completed', input.occurrenceId);
    await db.runAsync('INSERT INTO task_completions(id,occurrence_id,assistance_level,outcome,awarded_xp,created_at) VALUES(?,?,?,?,?,?)', id, input.occurrenceId, input.assistance, input.outcome, input.awardedXp, now);
    await db.runAsync('INSERT INTO xp_ledger(id,child_profile_id,source_id,idempotency_key,awarded_amount,local_date,created_at) VALUES(?,?,?,?,?,?,?)', id, input.childId, input.occurrenceId, `task:${input.occurrenceId}`, input.awardedXp, input.date, now);
  });
  return result;
}
