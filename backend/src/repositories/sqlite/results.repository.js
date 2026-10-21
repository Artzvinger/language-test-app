import { getDb } from '../../db/sqlite/connection.js';

const toResult = (row) => ({ ...row });

export const createResult = async (result) => {
	const db = await getDb();

	const info = db
		.prepare(
			`INSERT INTO results
				(test_id, student_name, group_name, score, total, answers_json, time_spent, tab_switches)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.run(
			result.test_id,
			result.student_name,
			result.group_name,
			result.score,
			result.total,
			result.answers_json,
			result.time_spent,
			result.tab_switches
		);

	return toResult(
		db.prepare('SELECT * FROM results WHERE id = ?').get(info.lastInsertRowid)
	);
};

export const listResults = async () => {
	const db = await getDb();

	return db
		.prepare('SELECT * FROM results ORDER BY id DESC')
		.all()
		.map(toResult);
};

export const deleteResult = async (id) => {
	const db = await getDb();

	db.prepare('DELETE FROM results WHERE id = ?').run(id);
};

export const deleteResultsByTestId = async (testId) => {
	const db = await getDb();

	db.prepare('DELETE FROM results WHERE test_id = ?').run(testId);
};
