import Database from 'better-sqlite3'
import { getDbPath } from '../config/paths'
import { getConfig } from '../config/store'

let db: Database.Database | null = null

function columnExists(table: string, col: string): boolean {
  const r = db!.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]
  return r.some((c) => c.name === col)
}

function migrateCollectionsTable(): void {
  if (!columnExists('collections', 'updated_at')) {
    db!.exec('ALTER TABLE collections ADD COLUMN updated_at INTEGER NOT NULL DEFAULT 0')
    db!.exec('UPDATE collections SET updated_at = created_at WHERE updated_at = 0')
  }
}

function migrateGamesTable(): void {
  const columns = (db!.prepare('PRAGMA table_info(games)').all() as { name: string }[]).map(
    (c) => c.name
  )
  const hasColumn = (col: string): boolean => columns.includes(col)

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
    if (!hasColumn(name)) {
      db!.exec(`ALTER TABLE games ADD COLUMN ${name} ${def}`)
    }
  }
  try {
    db!.exec('CREATE INDEX IF NOT EXISTS idx_games_status ON games(status)')
  } catch {
    /* skip */
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
      size TEXT DEFAULT '',
      favorite INTEGER DEFAULT 0,
      last_played TEXT,
      description TEXT,
      developer TEXT,
      release_date TEXT,
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
    CREATE INDEX IF NOT EXISTS idx_play_sessions_game_id ON play_sessions(game_id);
    CREATE INDEX IF NOT EXISTS idx_play_sessions_start_time ON play_sessions(start_time);
    CREATE INDEX IF NOT EXISTS idx_collections_sort ON collections(sort_order);
    CREATE INDEX IF NOT EXISTS idx_save_snapshots_game ON save_snapshots(game_id);
    CREATE INDEX IF NOT EXISTS idx_game_collections_col ON game_collections(collection_id);
    CREATE INDEX IF NOT EXISTS idx_games_executable_path ON games(executable_path);
    CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at);

    CREATE VIRTUAL TABLE IF NOT EXISTS games_fts USING fts5(
      title, title_cn, developer, content='games', content_rowid='rowid'
    );
  `)

  // FTS sync triggers (idempotent — IF NOT EXISTS not supported for triggers, use try/catch)
  const triggers = [
    `CREATE TRIGGER IF NOT EXISTS games_fts_insert AFTER INSERT ON games BEGIN
       INSERT INTO games_fts(rowid, title, title_cn, developer) VALUES (new.rowid, new.title, new.title_cn, new.developer);
     END`,
    `CREATE TRIGGER IF NOT EXISTS games_fts_delete AFTER DELETE ON games BEGIN
       INSERT INTO games_fts(games_fts, rowid, title, title_cn, developer) VALUES ('delete', old.rowid, old.title, old.title_cn, old.developer);
     END`,
    `CREATE TRIGGER IF NOT EXISTS games_fts_update AFTER UPDATE ON games BEGIN
       INSERT INTO games_fts(games_fts, rowid, title, title_cn, developer) VALUES ('delete', old.rowid, old.title, old.title_cn, old.developer);
       INSERT INTO games_fts(rowid, title, title_cn, developer) VALUES (new.rowid, new.title, new.title_cn, new.developer);
     END`
  ]
  for (const sql of triggers) {
    try {
      db!.exec(sql)
    } catch {
      /* trigger may already exist */
    }
  }

  // Populate FTS if empty
  const ftsCount = db!.prepare('SELECT count(*) as c FROM games_fts').get() as { c: number }
  if (ftsCount.c === 0) {
    db!.exec(`
      INSERT INTO games_fts(rowid, title, title_cn, developer)
      SELECT rowid, title, title_cn, developer FROM games
    `)
  }

  migrateGamesTable()
  migrateCollectionsTable()
  if (!columnExists('games', 'playtime_seconds')) {
    db!.exec('ALTER TABLE games ADD COLUMN playtime_seconds INTEGER DEFAULT 0')
  }

  const dropCols = ['rating', 'installed', 'publisher', 'playtime']
  for (const col of dropCols) {
    if (columnExists('games', col)) {
      db!.exec(`DROP INDEX IF EXISTS idx_games_${col}`)
      db!.exec(`ALTER TABLE games DROP COLUMN ${col}`)
    }
  }

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
