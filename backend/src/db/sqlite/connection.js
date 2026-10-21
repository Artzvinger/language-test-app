import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SCHEMA = `
CREATE TABLE IF NOT EXISTS tests (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	title TEXT NOT NULL,
	time_limit INTEGER NOT NULL DEFAULT 1800,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS questions (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	test_id INTEGER NOT NULL REFERENCES tests (id) ON DELETE CASCADE,
	question TEXT NOT NULL,
	type TEXT NOT NULL DEFAULT 'text',
	audio_url TEXT,
	image_url TEXT,
	correct_answer TEXT
);

CREATE TABLE IF NOT EXISTS options (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	question_id INTEGER NOT NULL REFERENCES questions (id) ON DELETE CASCADE,
	text TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS results (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	test_id INTEGER NOT NULL REFERENCES tests (id) ON DELETE CASCADE,
	student_name TEXT NOT NULL DEFAULT 'Студент',
	group_name TEXT NOT NULL DEFAULT 'Группа',
	score INTEGER NOT NULL DEFAULT 0,
	total INTEGER NOT NULL DEFAULT 0,
	answers_json TEXT,
	time_spent INTEGER NOT NULL DEFAULT 0,
	tab_switches INTEGER NOT NULL DEFAULT 0,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_questions_test_id ON questions (test_id);
CREATE INDEX IF NOT EXISTS idx_options_question_id ON options (question_id);
CREATE INDEX IF NOT EXISTS idx_results_test_id ON results (test_id);
`;

let db = null;

// Ленивое открытие: на Vercel этот модуль не используется и базу не создаёт.
export const getDb = async () => {
	if (db) {
		return db;
	}

	// Встроенный SQLite импортируем только в режиме SQLite.
	const { DatabaseSync } = await import('node:sqlite');

	const dataDir =
		process.env.SQLITE_DIR || path.resolve(__dirname, '../../../data');

	fs.mkdirSync(dataDir, { recursive: true });

	const dbPath = process.env.SQLITE_PATH || path.join(dataDir, 'app.db');

	db = new DatabaseSync(dbPath);

	db.exec('PRAGMA foreign_keys = ON;');
	db.exec(SCHEMA);

	console.log(`✅ SQLite: база данных ${dbPath}`);

	return db;
};
