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

function seedIfEmpty(): void {
  const count = (db!.prepare('SELECT COUNT(*) as c FROM games').get() as { c: number }).c
  if (count > 0) return

  const now = Date.now()
  const games = [
    { id:'g1', title:'Summer Pockets REFLECTION BLUE', title_cn:'夏日口袋', category:'visual_novel', rating:9.2, size:'6.8 GB', installed:1, favorite:1, status:'played', personal_rating:9, description:'Key社开发的恋爱冒险游戏。主人公鹰原羽依里来到鸟白岛，在与岛上少女们的交流中逐渐发现岛上的秘密。', developer:'Key', publisher:'Visual Arts', release_date:'2021-02-04', playtime:'45小时', executable_path:'D:\\Games\\SummerPockets\\SummerPockets.exe', vndb_id:'v25228', bangumi_id:'316479', last_played:new Date(now-2*864e5).toISOString(), last_launch_method:'le' },
    { id:'g2', title:'ATRI -My Dear Moments-', title_cn:'ATRI', category:'visual_novel', rating:8.8, size:'3.2 GB', installed:1, favorite:1, status:'played', personal_rating:9, description:'在未来海平面上升的世界，少年斑鸠夏生与机器人少女阿特里的故事。', developer:'Aniplex.exe', publisher:'Frontwing', release_date:'2020-06-19', playtime:'12小时', executable_path:'D:\\Games\\ATRI\\ATRI.exe', vndb_id:'v27988', bangumi_id:'266804', last_played:new Date(now-5*864e5).toISOString(), last_launch_method:'le' },
    { id:'g3', title:'STEINS;GATE', title_cn:'命运石之门', category:'visual_novel', rating:9.5, size:'8.1 GB', installed:1, favorite:1, status:'played', personal_rating:9, description:'自称疯狂科学家的冈部伦太郎偶然间发明了时间机器，被卷入席卷世界的阴谋之中。', developer:'Nitroplus', publisher:'MAGES.', release_date:'2009-10-15', playtime:'35小时', executable_path:'D:\\Games\\SteinsGate\\SteinsGate.exe', vndb_id:'v1988', bangumi_id:'1265', last_played:new Date(now-30*864e5).toISOString(), last_launch_method:'normal' },
    { id:'g4', title:'Fate/stay night [Réalta Nua]', title_cn:'命运之夜', category:'visual_novel', rating:9.3, size:'5.6 GB', installed:1, favorite:1, status:'played', personal_rating:8, description:'围绕圣杯展开的魔术师与英灵之间的战斗。七名魔术师召唤七位英灵，为争夺能实现愿望的圣杯而战。', developer:'TYPE-MOON', publisher:'TYPE-MOON', release_date:'2004-01-30', playtime:'60小时', executable_path:'D:\\Games\\FateSN\\FateSN.exe', vndb_id:'v11', bangumi_id:'301', last_played:new Date(now-90*864e5).toISOString(), last_launch_method:'normal' },
    { id:'g5', title:'WHITE ALBUM 2', title_cn:'白色相簿2', category:'visual_novel', rating:9.1, size:'7.5 GB', installed:1, favorite:0, status:'played', personal_rating:9, description:'Leaf社名作。以学园为舞台，描绘了主人公与两位女主角之间复杂深刻的感情纠葛。', developer:'Leaf', publisher:'Aquaplus', release_date:'2010-03-26', playtime:'80小时', executable_path:'D:\\Games\\WA2\\WA2.exe', vndb_id:'v4654', bangumi_id:'13316', last_played:new Date(now-60*864e5).toISOString(), last_launch_method:'le' },
    { id:'g6', title:'Tsukihime -A piece of blue glass moon-', title_cn:'月姬', category:'visual_novel', rating:9.0, size:'4.5 GB', installed:1, favorite:0, status:'playing', personal_rating:8, description:'TYPE-MOON重制版。远野志贵拥有直死之魔眼，能看到事物的死线。与神秘少女爱尔奎特的相遇将他卷入非日常的世界。', developer:'TYPE-MOON', publisher:'TYPE-MOON', release_date:'2021-08-26', playtime:'18小时', executable_path:'D:\\Games\\Tsukihime\\Tsukihime.exe', vndb_id:'v31124', bangumi_id:'213548', last_played:new Date(now-864e5).toISOString(), last_launch_method:'normal' },
    { id:'g7', title:'Rewrite', title_cn:'Rewrite', category:'visual_novel', rating:8.7, size:'5.8 GB', installed:1, favorite:0, status:'played', personal_rating:8, description:'Key社作品。天王寺瑚太朗在风祭学院都市中追寻超自然现象，逐渐接近世界的真相。', developer:'Key', publisher:'Visual Arts', release_date:'2011-06-24', playtime:'55小时', executable_path:'D:\\Games\\Rewrite\\Rewrite.exe', vndb_id:'v7514', bangumi_id:'13475', last_played:new Date(now-200*864e5).toISOString(), last_launch_method:'normal' },
    { id:'g8', title:'Harmonia', title_cn:'Harmonia', category:'visual_novel', rating:7.8, size:'1.5 GB', installed:1, favorite:0, status:'played', personal_rating:7, description:'Key社短篇。在荒废的世界中，少年机器人"我"与少女相遇的感人故事。', developer:'Key', publisher:'Visual Arts', release_date:'2016-09-23', playtime:'3小时', executable_path:'D:\\Games\\Harmonia\\Harmonia.exe', vndb_id:'v19641', bangumi_id:'193450', last_played:new Date(now-120*864e5).toISOString(), last_launch_method:'le' }
  ]

  const insert = db!.prepare(`INSERT INTO games (id,title,title_cn,cover,category,rating,size,installed,favorite,status,personal_rating,last_played,description,developer,publisher,release_date,playtime,executable_path,vndb_id,bangumi_id,notes,custom_tags,last_launch_method,created_at,updated_at) VALUES (@id,@title,@title_cn,@cover,@category,@rating,@size,@installed,@favorite,@status,@personal_rating,@last_played,@description,@developer,@publisher,@release_date,@playtime,@executable_path,@vndb_id,@bangumi_id,@notes,@custom_tags,@last_launch_method,@created_at,@updated_at)`)

  const txn = db!.transaction(() => {
    for (const g of games) {
      insert.run({ ...g, cover: '', notes: '', custom_tags: '[]', created_at: now, updated_at: now })
    }
  })
  txn()
  console.log(`Seeded ${games.length} games`)
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

    CREATE INDEX IF NOT EXISTS idx_games_category ON games(category);
    CREATE INDEX IF NOT EXISTS idx_games_favorite ON games(favorite);
    CREATE INDEX IF NOT EXISTS idx_games_installed ON games(installed);
    CREATE INDEX IF NOT EXISTS idx_play_sessions_game_id ON play_sessions(game_id);
    CREATE INDEX IF NOT EXISTS idx_play_sessions_start_time ON play_sessions(start_time);
    CREATE INDEX IF NOT EXISTS idx_collections_sort ON collections(sort_order);
    CREATE INDEX IF NOT EXISTS idx_save_snapshots_game ON save_snapshots(game_id);
  `)

  migrateGamesTable()
  seedIfEmpty()

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
