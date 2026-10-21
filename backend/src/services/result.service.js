import { cleanString } from '../lib/utils.js';
import * as repositories from '../repositories/index.js';

export const gradeAnswers = (questions, answers) => {
	const safeAnswers = answers || {};

	let score = 0;

	const details = {};
	const fullReport = [];

	questions.forEach((question) => {
		const userAnswer = cleanString(safeAnswers[question.id]);
		const correctAnswer = cleanString(question.correct_answer);

		const isCorrect =
			userAnswer !== '' && userAnswer === correctAnswer;

		if (isCorrect) {
			score++;
		}

		details[question.id] = {
			question: question.question,
			userAnswer: userAnswer,
			correctAnswer: question.correct_answer,
			isCorrect: isCorrect
		};

		fullReport.push({
			question_text: question.question,
			user_answer: userAnswer,
			correct_answer: question.correct_answer,
			is_correct: isCorrect
		});
	});

	return {
		score,
		total: questions.length,
		details,
		fullReport
	};
};

export const saveResult = async ({
	testId,
	name,
	group,
	score,
	total,
	fullReport,
	timeSpent,
	tabSwitches
}) => {
	return repositories.createResult({
		test_id: testId,
		student_name: name?.toString().trim() || 'Студент',
		group_name: group?.toString().trim() || 'Группа',
		score: score,
		total: total,
		answers_json: JSON.stringify(fullReport),
		time_spent: Number(timeSpent) || 0,
		tab_switches: Number(tabSwitches) || 0
	});
};
