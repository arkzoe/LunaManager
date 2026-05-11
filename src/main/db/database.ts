import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { getConfig } from '../config/store'

// 获取数据库存储路径（项目目录下的 data 文件夹）
const getDbPath = (): string => {
  // 在生产环境中使用应用程序所在目录
  // 在开发环境中使用项目根目录
  const basePath = app.isPackaged
    ? join(app.getAppPath(), '..', '..')
    : join(process.cwd())
  return join(basePath, 'data', 'lunamanager.db')
}

let db: Database.Database | null = null

export interface GameRecord {
  id: string
  title: string
  cover: string
  category: string
  rating: number
  size: string
  installed: number
  favorite: number
  last_played?: string
  description?: string
  developer?: string
  publisher?: string
  release_date?: string
  playtime?: string
  executable_path?: string
  save_path?: string
  created_at: number
  updated_at: number
}

export interface PlaySession {
  id: string
  game_id: string
  start_time: number
  end_time?: number
  duration?: number
}

export const initDatabase = (): Database.Database => {
  if (db) return db

  const dbPath = getConfig('dbPath') || getDbPath()
  
  db = new Database(dbPath)
  
  // 启用外键约束
  db.pragma('journal_mode = WAL')
  
  // 创建游戏表
  db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      cover TEXT DEFAULT '',
      category TEXT DEFAULT '',
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
    )
  `)

  // 创建游玩记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS play_sessions (
      id TEXT PRIMARY KEY,
      game_id TEXT NOT NULL,
      start_time INTEGER NOT NULL,
      end_time INTEGER,
      duration INTEGER,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `)

  // 创建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_games_category ON games(category);
    CREATE INDEX IF NOT EXISTS idx_games_favorite ON games(favorite);
    CREATE INDEX IF NOT EXISTS idx_games_installed ON games(installed);
    CREATE INDEX IF NOT EXISTS idx_play_sessions_game_id ON play_sessions(game_id);
    CREATE INDEX IF NOT EXISTS idx_play_sessions_start_time ON play_sessions(start_time);
  `)

  console.log('Database initialized at:', dbPath)
  return db
}

export const getDatabase = (): Database.Database => {
  if (!db) {
    return initDatabase()
  }
  return db
}

export const closeDatabase = (): void => {
  if (db) {
    db.close()
    db = null
    console.log('Database closed')
  }
}

// 游戏 CRUD 操作
export const gameOperations = {
  getAll: (): GameRecord[] => {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM games ORDER BY created_at DESC')
    return stmt.all() as GameRecord[]
  },

  getById: (id: string): GameRecord | undefined => {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM games WHERE id = ?')
    return stmt.get(id) as GameRecord | undefined
  },

  create: (game: Omit<GameRecord, 'created_at' | 'updated_at'>): GameRecord => {
    const db = getDatabase()
    const now = Date.now()
    const gameWithTimestamps = {
      ...game,
      created_at: now,
      updated_at: now
    }
    
    const stmt = db.prepare(`
      INSERT INTO games (
        id, title, cover, category, rating, size, installed, favorite,
        last_played, description, developer, publisher, release_date, playtime,
        executable_path, save_path, created_at, updated_at
      ) VALUES (
        @id, @title, @cover, @category, @rating, @size, @installed, @favorite,
        @last_played, @description, @developer, @publisher, @release_date, @playtime,
        @executable_path, @save_path, @created_at, @updated_at
      )
    `)
    
    stmt.run(gameWithTimestamps)
    return gameWithTimestamps as GameRecord
  },

  update: (id: string, updates: Partial<Omit<GameRecord, 'id' | 'created_at'>>): void => {
    const db = getDatabase()
    const fields = Object.keys(updates).map(key => `${key} = @${key}`).join(', ')
    
    const stmt = db.prepare(`
      UPDATE games 
      SET ${fields}, updated_at = @updated_at
      WHERE id = @id
    `)
    
    stmt.run({
      ...updates,
      updated_at: Date.now(),
      id
    })
  },

  delete: (id: string): void => {
    const db = getDatabase()
    const stmt = db.prepare('DELETE FROM games WHERE id = ?')
    stmt.run(id)
  },

  search: (query: string): GameRecord[] => {
    const db = getDatabase()
    const stmt = db.prepare(`
      SELECT * FROM games 
      WHERE title LIKE ? OR category LIKE ? OR developer LIKE ?
      ORDER BY title ASC
    `)
    const searchPattern = `%${query}%`
    return stmt.all(searchPattern, searchPattern, searchPattern) as GameRecord[]
  },

  getByCategory: (category: string): GameRecord[] => {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM games WHERE category = ? ORDER BY title ASC')
    return stmt.all(category) as GameRecord[]
  },

  getFavorites: (): GameRecord[] => {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM games WHERE favorite = 1 ORDER BY title ASC')
    return stmt.all() as GameRecord[]
  },

  getInstalled: (): GameRecord[] => {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM games WHERE installed = 1 ORDER BY title ASC')
    return stmt.all() as GameRecord[]
  }
}

// 游玩记录操作
export const playSessionOperations = {
  start: (gameId: string): PlaySession => {
    const db = getDatabase()
    const session: PlaySession = {
      id: `session-${Date.now()}`,
      game_id: gameId,
      start_time: Date.now()
    }
    
    const stmt = db.prepare(`
      INSERT INTO play_sessions (id, game_id, start_time)
      VALUES (@id, @game_id, @start_time)
    `)
    
    stmt.run(session)
    return session
  },

  end: (sessionId: string): void => {
    const db = getDatabase()
    const endTime = Date.now()
    
    const stmt = db.prepare(`
      UPDATE play_sessions 
      SET end_time = @end_time, duration = @end_time - start_time
      WHERE id = @id
    `)
    
    stmt.run({ id: sessionId, end_time: endTime })
  },

  getByGameId: (gameId: string): PlaySession[] => {
    const db = getDatabase()
    const stmt = db.prepare(`
      SELECT * FROM play_sessions 
      WHERE game_id = ? 
      ORDER BY start_time DESC
    `)
    return stmt.all(gameId) as PlaySession[]
  },

  getRecent: (limit: number = 10): PlaySession[] => {
    const db = getDatabase()
    const stmt = db.prepare(`
      SELECT * FROM play_sessions 
      ORDER BY start_time DESC 
      LIMIT ?
    `)
    return stmt.all(limit) as PlaySession[]
  },

  getTotalPlaytime: (gameId: string): number => {
    const db = getDatabase()
    const stmt = db.prepare(`
      SELECT COALESCE(SUM(duration), 0) as total
      FROM play_sessions 
      WHERE game_id = ? AND duration IS NOT NULL
    `)
    const result = stmt.get(gameId) as { total: number }
    return result.total
  }
}
