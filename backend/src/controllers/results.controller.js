import { parseId } from '../lib/utils.js';
import * as repositories from '../repositories/index.js';
import * as resultService from '../services/result.service.js';

export const submitResultHandler = async (req, res) => {
	const {
		testId,
		name,
		group,
		answers,
		timeSpent,
		tabSwitches
	} = req.body || {};

	try {
		const parsedTestId = parseId(testId);

		if (parsedTestId === null) {
			return res.status(400).json({
				message: 'Некорректный ID теста'
			});
		}

		const questions = await repositories.listQuestionsByTestId(
			parsedTestId
		);

		if (questions.length === 0) {
			return res.status(404).json({
				message: 'В тесте нет вопросов'
			});
		}

		const { score, total, details, fullReport } =
			resultService.gradeAnswers(questions, answers);

		const data = await resultService.saveResult({
			testId: parsedTestId,
			name,
			group,
			score,
			total,
			fullReport,
			timeSpent,
			tabSwitches
		});

		console.log(`📊 Результат сохранён: ${score}/${total}`);

		return res.json({
			score,
			total,
			details,
			resultId: data.id
		});
	} catch (error) {
		console.error('❌ Ошибка сохранения результата:', error);

		return res.status(500).json({
			error: error?.message || 'Ошибка сервера'
		});
	}
};

export const listResultsHandler = async (req, res) => {
	try {
		const data = await repositories.listResults();

		return res.json(data);
	} catch (error) {
		console.error('❌ Ошибка получения результатов:', error);

		return res.status(500).json({
			error: error?.message || 'Ошибка сервера'
		});
	}
};

export const deleteResultHandler = async (req, res) => {
	const id = parseId(req.params.id);

	try {
		if (id === null) {
			return res.status(400).json({
				message: 'Некорректный ID результата'
			});
		}

		await repositories.deleteResult(id);

		console.log(`🗑 Результат ${id} удалён`);

		return res.json({
			message: 'Результат удален'
		});
	} catch (error) {
		console.error('❌ Ошибка удаления результата:', error);

		return res.status(500).json({
			error: error?.message || 'Ошибка сервера'
		});
	}
};
