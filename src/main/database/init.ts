import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { getConfig } from '../config/store'

const getDbPath = (): string => {
  const base = app.isPackaged
    ? join(app.getAppPath(), '..', '..')
    : join(process.cwd())
  return join(base, 'data', 'lunamanager.db')
}

let db: Database.Database | null = null

function columnExists(table: string, col: string): boolean {
  const r = db!.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]
  return r.some(c => c.name === col)
}

function migrateGamesTable(): void {
  const additions: [string, string][] = [
    ['title_cn', 'TEXT DEFAULT ""'],
    ['status', 'TEXT DEFAULT "want"'],
    ['personal_rating', 'INTEGER DEFAULT 0'],
    ['vndb_id', 'TEXT DEFAULT ""'],
    ['bangumi_id', 'TEXT DEFAULT ""'],
    ['notes', 'TEXT DEFAULT ""'],
    ['custom_tags', 'TEXT DEFAULT "[]"'],
    ['last_launch_method', 'TEXT DEFAULT "normal"']
  ]
  for (const [name, def] of additions) {
    if (!columnExists('games', name)) {
      db!.exec(`ALTER TABLE games ADD COLUMN ${name} ${def}`)
    }
  }
  if (!columnExists('games', 'status')) {
    try { db!.exec('CREATE INDEX IF NOT EXISTS idx_games_status ON games(status)') } catch { /* skip */ }
  }
}

export const initDatabase = (): Database.Database => {
  if (db) return db

  const dbPath = getConfig('dbPath') || getDbPath()
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      cover TEXT DEFAULT '',
      rating REAL DEFAULT 0,
      size TEXT DEFAULT '',
      installed INTEGER DEFAULT 0,
      favorite INTEGER DEFAULT 0,
      last_played TEXT,
      description TEXT,
      developer TEXT,
      publisher TEXT,
      release_date TEXT,
      playtime TEXT,
      executable_path TEXT,
      save_path TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS play_sessions (
      id TEXT PRIMARY KEY,
      game_id TEXT NOT NULL,
      start_time INTEGER NOT NULL,
      end_time INTEGER,
      duration INTEGER,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      parent_id TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (parent_id) REFERENCES collections(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS game_collections (
      game_id TEXT NOT NULL,
      collection_id TEXT NOT NULL,
      PRIMARY KEY (game_id, collection_id),
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
      FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS save_snapshots (
      id TEXT PRIMARY KEY,
      game_id TEXT NOT NULL,
      snapshot_path TEXT NOT NULL,
      file_size INTEGER DEFAULT 0,
      notes TEXT DEFAULT '',
      created_at INTEGER NOT NULL,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_games_favorite ON games(favorite);
    CREATE INDEX IF NOT EXISTS idx_games_installed ON games(installed);
    CREATE INDEX IF NOT EXISTS idx_play_sessions_game_id ON play_sessions(game_id);
    CREATE INDEX IF NOT EXISTS idx_play_sessions_start_time ON play_sessions(start_time);
    CREATE INDEX IF NOT EXISTS idx_collections_sort ON collections(sort_order);
    CREATE INDEX IF NOT EXISTS idx_save_snapshots_game ON save_snapshots(game_id);
  `)

  migrateGamesTable()

  console.log('Database initialized at:', dbPath)
  return db
}

export const getDatabase = (): Database.Database => {
  if (!db) return initDatabase()
  return db
}

export const closeDatabase = (): void => {
  if (db) {
    db.close()
    db = null
    console.log('Database closed')
  }
}
