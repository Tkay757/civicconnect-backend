import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '..', 'civicconnect.db');

export const db = new DatabaseSync(DB_PATH);

// Initialize database tables
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS issues (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      category_label TEXT NOT NULL,
      description TEXT,
      location_name TEXT,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      severity TEXT NOT NULL CHECK(severity IN ('HIGH', 'MEDIUM', 'LOW')),
      status TEXT NOT NULL DEFAULT 'reported' CHECK(status IN ('reported', 'under_review', 'in_progress', 'resolved')),
      image_url TEXT NOT NULL,
      reporter_id TEXT NOT NULL,
      reporter_name TEXT NOT NULL,
      reporter_handle TEXT,
      reporter_avatar TEXT,
      authority_notes TEXT DEFAULT '',
      assigned_worker TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS upvotes (
      id TEXT PRIMARY KEY,
      issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(issue_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      user_handle TEXT,
      user_avatar TEXT,
      text TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS timeline (
      id TEXT PRIMARY KEY,
      issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
      status TEXT NOT NULL,
      actor TEXT NOT NULL,
      note TEXT,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      department TEXT NOT NULL,
      category TEXT NOT NULL,
      phone TEXT NOT NULL,
      whatsapp TEXT,
      email TEXT,
      hours TEXT,
      address TEXT,
      avatar TEXT,
      is_emergency INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_issues_lat_lng ON issues(lat, lng);
    CREATE INDEX IF NOT EXISTS idx_upvotes_issue_id ON upvotes(issue_id);
    CREATE INDEX IF NOT EXISTS idx_comments_issue_id ON comments(issue_id);
  `);

  console.log('✅ SQLite Database initialized at:', DB_PATH);
}
