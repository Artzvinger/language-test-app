import { getDb } from '../../db/sqlite/connection.js';

const toOption = (row) => ({ ...row });

export const listOptionsByQuestionId = async (questionId) => {
	const db = await getDb();

	return db
		.prepare('SELECT * FROM options WHERE question_id = ? ORDER BY id ASC')
		.all(questionId)
		.map(toOption);
};

export const createOptions = async (options) => {
	const db = await getDb();

	const stmt = db.prepare(
		'INSERT INTO options (question_id, text) VALUES (?, ?)'
	);

	for (const option of options) {
		stmt.run(option.question_id, option.text);
	}
};

export const deleteOptionsByQuestionIds = async (questionIds) => {
	if (!questionIds.length) {
		return;
	}

	const db = await getDb();

	const placeholders = questionIds.map(() => '?').join(', ');

	db.prepare(`DELETE FROM options WHERE question_id IN (${placeholders})`).run(
		...questionIds
	);
};
