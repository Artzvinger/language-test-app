import { getDb } from '../../db/sqlite/connection.js';

const toQuestion = (row) => ({ ...row });

export const listQuestionsByTestId = async (testId) => {
	const db = await getDb();

	return db
		.prepare('SELECT * FROM questions WHERE test_id = ? ORDER BY id ASC')
		.all(testId)
		.map(toQuestion);
};

export const listQuestionIdsByTestId = async (testId) => {
	const db = await getDb();

	return db
		.prepare('SELECT id FROM questions WHERE test_id = ?')
		.all(testId)
		.map(toQuestion);
};

export const createQuestion = async (question) => {
	const db = await getDb();

	const info = db
		.prepare(
			`INSERT INTO questions
				(test_id, question, type, audio_url, image_url, correct_answer)
			 VALUES (?, ?, ?, ?, ?, ?)`
		)
		.run(
			question.test_id,
			question.question,
			question.type,
			question.audio_url,
			question.image_url,
			question.correct_answer
		);

	return toQuestion(
		db
			.prepare('SELECT * FROM questions WHERE id = ?')
			.get(info.lastInsertRowid)
	);
};

export const deleteQuestionsByTestId = async (testId) => {
	const db = await getDb();

	db.prepare('DELETE FROM questions WHERE test_id = ?').run(testId);
};
