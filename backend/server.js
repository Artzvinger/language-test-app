import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import cors from 'cors';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const app = express();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
	console.error('❌ Не заданы SUPABASE_URL и SUPABASE_KEY');
}

const supabase = createClient(
	supabaseUrl || '',
	supabaseKey || ''
);

app.use(cors());
app.use(express.json());

const upload = multer({
	dest: '/tmp/uploads/',
	limits: {
		fileSize: 10 * 1024 * 1024
	}
});

const getTestById = async (id) => {
	const { data, error } = await supabase
		.from('tests')
		.select('*')
		.eq('id', id)
		.single();

	if (error) {
		throw error;
	}

	return data;
};


const getQuestionsByTestId = async (testId) => {
	const { data, error } = await supabase
		.from('questions')
		.select('*')
		.eq('test_id', testId)
		.order('id', { ascending: true });

	if (error) {
		throw error;
	}

	return data || [];
};


const getOptionsByQuestionId = async (questionId) => {
	const { data, error } = await supabase
		.from('options')
		.select('*')
		.eq('question_id', questionId)
		.order('id', { ascending: true });

	if (error) {
		throw error;
	}

	return data || [];
};


const deleteTemporaryFile = (filePath) => {
	try {
		if (filePath && fs.existsSync(filePath)) {
			fs.unlinkSync(filePath);
		}
	} catch (error) {
		console.error('⚠️ Не удалось удалить временный файл:', error);
	}
};


const cleanString = (value) => {
	if (value === undefined || value === null) {
		return '';
	}

	return value
		.toString()
		.replace(/[\u200B-\u200D\uFEFF]/g, '')
		.replace(/\s+/g, ' ')
		.trim()
		.toLowerCase();
};


app.get('/', (req, res) => {
	res.json({
		status: 'ok',
		message: 'Language Test API работает',
		supabase: Boolean(supabaseUrl && supabaseKey)
	});
});

app.post('/upload', upload.single('file'), async (req, res) => {

	if (!req.file) {
		return res.status(400).json({
			message: 'Файл не загружен'
		});
	}

	try {
		console.log('📥 Получен Excel-файл:', req.file.originalname);

		const workbook = xlsx.readFile(req.file.path);

		if (!workbook.SheetNames.length) {
			throw new Error('Excel-файл не содержит листов');
		}

		const sheet = workbook.Sheets[workbook.SheetNames[0]];

		const data = xlsx.utils.sheet_to_json(sheet, {
			header: 1,
			defval: ''
		});

		if (!data || data.length < 2) {
			throw new Error('Excel-файл не содержит вопросов');
		}

		let timeLimitSeconds = 1800;

		try {
			const cell = sheet['I2'];

			if (cell) {

				// Excel хранит время как долю суток.
				if (
					cell.t === 'n' &&
					typeof cell.v === 'number' &&
					cell.v > 0 &&
					cell.v < 1
				) {
					timeLimitSeconds = Math.round(cell.v * 86400);
				} else {

					const cellText = (
						cell.w ??
						cell.v?.toString() ??
						''
					)
						.toString()
						.trim();

					if (cellText.includes(':')) {

						const parts = cellText.split(':');

						if (parts.length === 3) {

							const hours = parseInt(parts[0], 10) || 0;
							const minutes = parseInt(parts[1], 10) || 0;
							const seconds = parseInt(parts[2], 10) || 0;

							timeLimitSeconds =
								hours * 3600 +
								minutes * 60 +
								seconds;

						} else if (parts.length === 2) {

							const minutes = parseInt(parts[0], 10) || 0;
							const seconds = parseInt(parts[1], 10) || 0;

							timeLimitSeconds =
								minutes * 60 +
								seconds;
						}

					} else {

						const parsed = parseInt(cellText, 10);

						if (!Number.isNaN(parsed) && parsed > 0) {
							timeLimitSeconds = parsed * 60;
						}
					}
				}
			}

		} catch (error) {
			console.log(
				'⚠️ Не удалось определить время теста, используется 30 минут'
			);
		}

		const testTitle =
			req.body?.title?.toString().trim() ||
			'Новый тест';

		const {
			data: testData,
			error: testError
		} = await supabase
			.from('tests')
			.insert([
				{
					title: testTitle,
					time_limit: timeLimitSeconds
				}
			])
			.select()
			.single();

		if (testError) {
			throw testError;
		}

		if (!testData) {
			throw new Error('Supabase не вернул созданный тест');
		}

		const testId = testData.id;

		console.log('✅ Создан тест:', testId);

		let questionsCreated = 0;

		for (let i = 1; i < data.length; i++) {

			const row = data[i];

			if (!row || row.length === 0) {
				continue;
			}

			const val = (index) => {
				if (
					row[index] === undefined ||
					row[index] === null
				) {
					return '';
				}

				return row[index]
					.toString()
					.trim();
			};

			const rawType = val(0).toLowerCase();
			const questionText = val(1);

			// Пустая строка — пропускаем.
			if (!questionText) {
				continue;
			}

			const rawOptions = [
				val(2),
				val(3),
				val(4),
				val(5)
			];

			const filteredOptions = rawOptions.filter(
				option => option.length > 0
			);

			let type;

			if (
				rawType === 'audio' ||
				rawType === 'audio_question' ||
				rawType === 'аудио'
			) {
				type = 'audio';

			} else if (
				rawType === 'text' ||
				rawType === 'open' ||
				rawType === 'open-ended' ||
				rawType === 'open_question' ||
				rawType === 'открытый'
			) {
				type = 'text';

			} else if (filteredOptions.length > 0) {
				type = 'multiple';

			} else {
				type = 'text';
			}

			const correctRaw = val(6);

			const audioUrl = val(7) || null;
			const imageUrl = val(8) || null;

			let correctAnswer = correctRaw;

			if (type === 'multiple' && correctRaw) {

				const letter = correctRaw
					.toUpperCase()
					.trim();

				const letterMap = {
					A: 0,
					B: 1,
					C: 2,
					D: 3
				};

				if (
					Object.prototype.hasOwnProperty.call(
						letterMap,
						letter
					)
				) {
					const optionIndex = letterMap[letter];

					if (rawOptions[optionIndex]) {
						correctAnswer = rawOptions[optionIndex];
					}
				}
			}

			const {
				data: questionData,
				error: questionError
			} = await supabase
				.from('questions')
				.insert([
					{
						test_id: testId,
						question: questionText,
						type: type,
						audio_url: audioUrl,
						image_url: imageUrl,
						correct_answer: correctAnswer
					}
				])
				.select()
				.single();

			if (questionError) {
				throw questionError;
			}

			if (!questionData) {
				throw new Error(
					`Не удалось создать вопрос №${i}`
				);
			}

			const questionId = questionData.id;

			if (filteredOptions.length > 0) {

				const optionsToInsert = filteredOptions.map(
					option => ({
						question_id: questionId,
						text: option
					})
				);

				const {
					error: optionsError
				} = await supabase
					.from('options')
					.insert(optionsToInsert);

				if (optionsError) {
					throw optionsError;
				}
			}

			questionsCreated++;

			console.log(
				`✅ Вопрос ${questionsCreated}: ${questionText}`
			);
		}

		if (questionsCreated === 0) {

			// Если вопросов нет — удаляем созданный тест.
			await supabase
				.from('tests')
				.delete()
				.eq('id', testId);

			throw new Error(
				'В Excel не найдено ни одного вопроса'
			);
		}

		deleteTemporaryFile(req.file.path);

		console.log(
			`🎉 Тест ${testId} успешно загружен. Вопросов: ${questionsCreated}`
		);

		return res.json({
			message: 'Тест успешно загружен!',
			testId: testId,
			questionsCount: questionsCreated,
			timeLimit: timeLimitSeconds
		});

	} catch (error) {

		console.error('❌ Ошибка загрузки теста:', error);

		deleteTemporaryFile(req.file?.path);

		return res.status(500).json({
			error: error?.message || 'Неизвестная ошибка сервера'
		});
	}
});

app.get('/tests/:id', async (req, res) => {

	try {

		const testId = parseInt(req.params.id, 10);

		if (Number.isNaN(testId)) {
			return res.status(400).json({
				message: 'Некорректный ID теста'
			});
		}

		const test = await getTestById(testId);

		if (!test) {
			return res.status(404).json({
				message: 'Тест не найден'
			});
		}

		const questions = await getQuestionsByTestId(testId);

		if (questions.length === 0) {
			return res.status(404).json({
				message: 'В тесте нет вопросов'
			});
		}

		const questionsWithOptions = await Promise.all(
			questions.map(async (question) => {

				const options =
					await getOptionsByQuestionId(question.id);

				return {
					id: question.id,
					question: question.question,
					type: question.type,
					audio_url: question.audio_url,
					image_url: question.image_url,
					options: options.map(
						option => option.text
					)
				};
			})
		);

		return res.json({
			id: test.id,
			title: test.title,
			time_limit: test.time_limit,
			questions: questionsWithOptions
		});

	} catch (error) {

		console.error(
			'❌ Ошибка получения теста:',
			error
		);

		return res.status(500).json({
			error: error?.message || 'Ошибка сервера'
		});
	}
});

app.post('/results', async (req, res) => {

	const {
		testId,
		name,
		group,
		answers,
		timeSpent,
		tabSwitches
	} = req.body || {};

	try {

		const parsedTestId = parseInt(testId, 10);

		if (Number.isNaN(parsedTestId)) {
			return res.status(400).json({
				message: 'Некорректный ID теста'
			});
		}

		const questions =
			await getQuestionsByTestId(parsedTestId);

		if (questions.length === 0) {
			return res.status(404).json({
				message: 'В тесте нет вопросов'
			});
		}

		const safeAnswers = answers || {};

		let score = 0;

		const details = {};
		const fullReport = [];

		questions.forEach((question) => {

			const userAnswer =
				cleanString(safeAnswers[question.id]);

			const correctAnswer =
				cleanString(question.correct_answer);

			const isCorrect =
				userAnswer !== '' &&
				userAnswer === correctAnswer;

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

		const {
			data,
			error
		} = await supabase
			.from('results')
			.insert([
				{
					test_id: parsedTestId,

					student_name:
						name?.toString().trim() ||
						'Студент',

					group_name:
						group?.toString().trim() ||
						'Группа',

					score: score,

					total: questions.length,

					answers_json:
						JSON.stringify(fullReport),

					time_spent:
						Number(timeSpent) || 0,

					tab_switches:
						Number(tabSwitches) || 0
				}
			])
			.select()
			.single();

		if (error) {
			throw error;
		}

		console.log(
			`📊 Результат сохранён: ${score}/${questions.length}`
		);

		return res.json({
			score: score,
			total: questions.length,
			details: details,
			resultId: data.id
		});

	} catch (error) {

		console.error(
			'❌ Ошибка сохранения результата:',
			error
		);

		return res.status(500).json({
			error: error?.message || 'Ошибка сервера'
		});
	}
});

app.get('/results', async (req, res) => {

	try {

		const {
			data,
			error
		} = await supabase
			.from('results')
			.select('*')
			.order('id', {
				ascending: false
			});

		if (error) {
			throw error;
		}

		return res.json(data || []);

	} catch (error) {

		console.error(
			'❌ Ошибка получения результатов:',
			error
		);

		return res.status(500).json({
			error: error?.message || 'Ошибка сервера'
		});
	}
});

app.get('/tests', async (req, res) => {

	try {

		const {
			data,
			error
		} = await supabase
			.from('tests')
			.select('*')
			.order('id', {
				ascending: false
			});

		if (error) {
			throw error;
		}

		return res.json(data || []);

	} catch (error) {

		console.error(
			'❌ Ошибка получения тестов:',
			error
		);

		return res.status(500).json({
			error: error?.message || 'Ошибка сервера'
		});
	}
});

app.delete('/tests/:id', async (req, res) => {

	const id = parseInt(req.params.id, 10);

	try {

		if (Number.isNaN(id)) {
			return res.status(400).json({
				message: 'Некорректный ID теста'
			});
		}

		const {
			data: questions,
			error: questionsSelectError
		} = await supabase
			.from('questions')
			.select('id')
			.eq('test_id', id);

		if (questionsSelectError) {
			throw questionsSelectError;
		}

		const questionIds =
			(questions || []).map(
				question => question.id
			);

		if (questionIds.length > 0) {

			const {
				error: optionsDeleteError
			} = await supabase
				.from('options')
				.delete()
				.in('question_id', questionIds);

			if (optionsDeleteError) {
				throw optionsDeleteError;
			}
		}

		const {
			error: questionsDeleteError
		} = await supabase
			.from('questions')
			.delete()
			.eq('test_id', id);

		if (questionsDeleteError) {
			throw questionsDeleteError;
		}

		const {
			error: resultsDeleteError
		} = await supabase
			.from('results')
			.delete()
			.eq('test_id', id);

		if (resultsDeleteError) {
			throw resultsDeleteError;
		}

		const {
			error: testDeleteError
		} = await supabase
			.from('tests')
			.delete()
			.eq('id', id);

		if (testDeleteError) {
			throw testDeleteError;
		}

		console.log(`🗑 Тест ${id} удалён`);

		return res.json({
			message: 'Тест удален'
		});

	} catch (error) {

		console.error(
			'❌ Ошибка удаления теста:',
			error
		);

		return res.status(500).json({
			error: error?.message || 'Ошибка сервера'
		});
	}
});

app.delete('/results/:id', async (req, res) => {

	const id = parseInt(req.params.id, 10);

	try {

		if (Number.isNaN(id)) {
			return res.status(400).json({
				message: 'Некорректный ID результата'
			});
		}

		const {
			error
		} = await supabase
			.from('results')
			.delete()
			.eq('id', id);

		if (error) {
			throw error;
		}

		console.log(
			`🗑 Результат ${id} удалён`
		);

		return res.json({
			message: 'Результат удален'
		});

	} catch (error) {

		console.error(
			'❌ Ошибка удаления результата:',
			error
		);

		return res.status(500).json({
			error: error?.message || 'Ошибка сервера'
		});
	}
});

export default app;