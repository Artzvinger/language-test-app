import * as testsRepository from '../repositories/tests.repository.js';
import * as questionsRepository from '../repositories/questions.repository.js';
import * as optionsRepository from '../repositories/options.repository.js';
import * as resultsRepository from '../repositories/results.repository.js';

export const getTestDetail = async (id) => {
	const test = await testsRepository.findTestById(id);

	if (!test) {
		return null;
	}

	const questions = await questionsRepository.listQuestionsByTestId(id);

	const questionsWithOptions = await Promise.all(
		questions.map(async (question) => {
			const options =
				await optionsRepository.listOptionsByQuestionId(
					question.id
				);

			return {
				id: question.id,
				question: question.question,
				type: question.type,
				audio_url: question.audio_url,
				image_url: question.image_url,
				options: options.map((option) => option.text)
			};
		})
	);

	return {
		id: test.id,
		title: test.title,
		time_limit: test.time_limit,
		questions: questionsWithOptions
	};
};

export const createTestWithQuestions = async ({
	title,
	timeLimitSeconds,
	questions
}) => {
	const testData = await testsRepository.createTest({
		title,
		time_limit: timeLimitSeconds
	});

	if (!testData) {
		throw new Error('Supabase не вернул созданный тест');
	}

	const testId = testData.id;

	console.log('✅ Создан тест:', testId);

	let questionsCreated = 0;

	for (const question of questions) {
		const questionData = await questionsRepository.createQuestion({
			test_id: testId,
			question: question.question,
			type: question.type,
			audio_url: question.audio_url,
			image_url: question.image_url,
			correct_answer: question.correct_answer
		});

		if (!questionData) {
			throw new Error('Не удалось создать вопрос');
		}

		const questionId = questionData.id;

		if (question.options.length > 0) {
			await optionsRepository.createOptions(
				question.options.map((text) => ({
					question_id: questionId,
					text
				}))
			);
		}

		questionsCreated++;

		console.log(`✅ Вопрос ${questionsCreated}: ${question.question}`);
	}

	return { testId, questionsCount: questionsCreated };
};

export const deleteTestCascade = async (id) => {
	const questions =
		await questionsRepository.listQuestionIdsByTestId(id);

	const questionIds = (questions || []).map(
		(question) => question.id
	);

	if (questionIds.length > 0) {
		await optionsRepository.deleteOptionsByQuestionIds(questionIds);
	}

	await questionsRepository.deleteQuestionsByTestId(id);
	await resultsRepository.deleteResultsByTestId(id);
	await testsRepository.deleteTest(id);
};
