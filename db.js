import Database from 'better-sqlite3';

const db = new Database('servidor.sqlite');

// Cria a tabela de aniversários
db.prepare(`
  CREATE TABLE IF NOT EXISTS birthdays (
    name TEXT,
    user_id TEXT PRIMARY KEY,
    birthday TEXT,
    image_url TEXT
  )
`).run();

// NOVA TABELA: Regista as mensagens de aniversário que já foram enviadas
db.prepare(`
  CREATE TABLE IF NOT EXISTS sent_messages (
    user_id TEXT,
    date TEXT,
    PRIMARY KEY (user_id, date)
  )
`).run();

export default db;