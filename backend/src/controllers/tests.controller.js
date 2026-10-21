import { parseId } from '../lib/utils.js';
import * as repositories from '../repositories/index.js';
import * as testService from '../services/test.service.js';

export const listTestsHandler = async (req, res) => {
	try {
		const data = await repositories.listTests();

		return res.json(data);
	} catch (error) {
		console.error('❌ Ошибка получения тестов:', error);

		return res.status(500).json({
			error: error?.message || 'Ошибка сервера'
		});
	}
};

export const getTestHandler = async (req, res) => {
	try {
		const testId = parseId(req.params.id);

		if (testId === null) {
			return res.status(400).json({
				message: 'Некорректный ID теста'
			});
		}

		const test = await testService.getTestDetail(testId);

		if (!test) {
			return res.status(404).json({
				message: 'Тест не найден'
			});
		}

		if (test.questions.length === 0) {
			return res.status(404).json({
				message: 'В тесте нет вопросов'
			});
		}

		return res.json(test);
	} catch (error) {
		console.error('❌ Ошибка получения теста:', error);

		return res.status(500).json({
			error: error?.message || 'Ошибка сервера'
		});
	}
};

export const deleteTestHandler = async (req, res) => {
	const id = parseId(req.params.id);

	try {
		if (id === null) {
			return res.status(400).json({
				message: 'Некорректный ID теста'
			});
		}

		await testService.deleteTestCascade(id);

		console.log(`🗑 Тест ${id} удалён`);

		return res.json({
			message: 'Тест удален'
		});
	} catch (error) {
		console.error('❌ Ошибка удаления теста:', error);

		return res.status(500).json({
			error: error?.message || 'Ошибка сервера'
		});
	}
};
