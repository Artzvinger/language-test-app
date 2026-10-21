import { getDb } from '../../db/sqlite/connection.js';

const toTest = (row) => (row ? { ...row } : null);

export const findTestById = async (id) => {
	const db = await getDb();

	return toTest(db.prepare('SELECT * FROM tests WHERE id = ?').get(id));
};

export const listTests = async () => {
	const db = await getDb();

	return db
		.prepare('SELECT * FROM tests ORDER BY id DESC')
		.all()
		.map(toTest);
};

export const createTest = async ({ title, time_limit }) => {
	const db = await getDb();

	const info = db
		.prepare('INSERT INTO tests (title, time_limit) VALUES (?, ?)')
		.run(title, time_limit);

	return toTest(
		db.prepare('SELECT * FROM tests WHERE id = ?').get(info.lastInsertRowid)
	);
};

export const deleteTest = async (id) => {
	const db = await getDb();

	db.prepare('DELETE FROM tests WHERE id = ?').run(id);
};
