import { deleteTemporaryFile } from '../lib/utils.js';
import {
	readWorkbook,
	extractTimeLimit,
	parseRows
} from '../services/excel.service.js';
import * as testService from '../services/test.service.js';

export const uploadTestHandler = async (req, res) => {
	if (!req.file) {
		return res.status(400).json({
			message: 'Файл не загружен'
		});
	}

	try {
		console.log('📥 Получен Excel-файл:', req.file.originalname);

		const { sheet, data } = readWorkbook(req.file.path);

		const timeLimitSeconds = extractTimeLimit(sheet);

		const testTitle =
			req.body?.title?.toString().trim() ||
			'Новый тест';

		const questions = parseRows(data);

		if (questions.length === 0) {
			throw new Error('В Excel не найдено ни одного вопроса');
		}

		const { testId, questionsCount } =
			await testService.createTestWithQuestions({
				title: testTitle,
				timeLimitSeconds,
				questions
			});

		deleteTemporaryFile(req.file.path);

		console.log(
			`🎉 Тест ${testId} успешно загружен. Вопросов: ${questionsCount}`
		);

		return res.json({
			message: 'Тест успешно загружен!',
			testId,
			questionsCount,
			timeLimit: timeLimitSeconds
		});
	} catch (error) {
		console.error('❌ Ошибка загрузки теста:', error);

		deleteTemporaryFile(req.file?.path);

		return res.status(500).json({
			error: error?.message || 'Неизвестная ошибка сервера'
		});
	}
};
