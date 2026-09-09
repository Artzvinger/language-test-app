import express from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ============ ПОДКЛЮЧЕНИЕ К SUPABASE ============
const supabase = createClient(
	process.env.SUPABASE_URL || 'https://lhxjaafxgtdzyouthhkb.supabase.co',
	process.env.SUPABASE_KEY || 'sb_publishable_AgG8giq9t6wIK7mYx2gZ2w_rTfqwUOW'
);

app.use(cors());
app.use(express.json());

// ============ НАСТРОЙКА MULTER ============
const upload = multer({
	dest: '/tmp/uploads/',
	limits: { fileSize: 10 * 1024 * 1024 }
});

// ============ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ============
const getTestById = async (id) => {
	const { data, error } = await supabase
		.from('tests')
		.select('*')
		.eq('id', id)
		.single();
	if (error) throw error;
	return data;
};

const getQuestionsByTestId = async (testId) => {
	const { data, error } = await supabase
		.from('questions')
		.select('*')
		.eq('test_id', testId);
	if (error) throw error;
	return data;
};

const getOptionsByQuestionId = async (questionId) => {
	const { data, error } = await supabase
		.from('options')
		.select('*')
		.eq('question_id', questionId);
	if (error) throw error;
	return data;
};

// ============ API РОУТЫ ============

// 1. Загрузка теста из Excel
app.post('/upload', upload.single('file'), async (req, res) => {
	if (!req.file) {
		return res.status(400).json({ message: 'Нет файла' });
	}

	try {
		const workbook = xlsx.readFile(req.file.path);
		const sheet = workbook.Sheets[workbook.SheetNames[0]];
		const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

		// Парсим время (ячейка I2)
		let timeLimitSeconds = 1800;
		try {
			if (sheet && sheet['I2']) {
				const cell = sheet['I2'];
				if (cell.t === 'n' && cell.v < 1 && cell.v > 0) {
					timeLimitSeconds = Math.round(cell.v * 86400);
				} else {
					const cellText = cell.w || cell.v?.toString()?.trim() || "";
					if (cellText.includes(':')) {
						const parts = cellText.split(':');
						if (parts.length === 3) {
							timeLimitSeconds = (parseInt(parts[0]) || 0) * 3600 +
								(parseInt(parts[1]) || 0) * 60 +
								(parseInt(parts[2]) || 0);
						} else {
							timeLimitSeconds = (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0);
						}
					} else {
						const parsed = parseInt(cellText);
						if (!isNaN(parsed) && parsed > 0) timeLimitSeconds = parsed * 60;
					}
				}
			}
		} catch (e) {
			console.log('⏱ Использовано время по умолчанию');
		}

		// 1️⃣ Сохраняем тест в Supabase
		const testTitle = req.body.title || 'Новый тест';
		const { data: testData, error: testError } = await supabase
			.from('tests')
			.insert([{ title: testTitle, time_limit: timeLimitSeconds }])
			.select();

		if (testError) throw testError;
		const testId = testData[0].id;

		// 2️⃣ Сохраняем вопросы и опции
		for (let i = 1; i < data.length; i++) {
			const row = data[i];
			if (!row || row.length < 2) continue;

			const val = (idx) => (row[idx] !== undefined && row[idx] !== null) ? row[idx].toString().trim() : "";
			const questionText = val(1);
			if (!questionText) continue;

			const rawOptions = [val(2), val(3), val(4), val(5)];
			const filteredOptions = rawOptions.filter(opt => opt.length > 0);
			const type = filteredOptions.length > 0 ? 'multiple' : 'text';

			let audioUrl = val(7) || null;
			let imageUrl = val(8) || null;
			let correctAnswer = val(6);

			if (type === 'multiple') {
				const letterMap = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
				const letter = correctAnswer.toUpperCase();
				if (letterMap.hasOwnProperty(letter)) {
					correctAnswer = filteredOptions[letterMap[letter]] || correctAnswer;
				}
			}

			// Сохраняем вопрос
			const { data: questionData, error: questionError } = await supabase
				.from('questions')
				.insert([{
					test_id: testId,
					question: questionText,
					type: type,
					audio_url: audioUrl,
					image_url: imageUrl,
					correct_answer: correctAnswer
				}])
				.select();

			if (questionError) throw questionError;
			const questionId = questionData[0].id;

			// Сохраняем опции
			for (const opt of filteredOptions) {
				const { error: optionError } = await supabase
					.from('options')
					.insert([{
						question_id: questionId,
						text: opt
					}]);
				if (optionError) throw optionError;
			}
		}

		// Удаляем временный файл
		if (fs.existsSync(req.file.path)) {
			fs.unlinkSync(req.file.path);
		}

		res.json({
			message: 'Тест успешно загружен!',
			testId: testId
		});

	} catch (e) {
		console.error("Ошибка:", e);
		if (req.file && fs.existsSync(req.file.path)) {
			fs.unlinkSync(req.file.path);
		}
		res.status(500).json({ error: 'Ошибка: ' + e.message });
	}
});

// 2. Получение теста для студента
app.get('/tests/:id', async (req, res) => {
	try {
		const testId = parseInt(req.params.id);

		const test = await getTestById(testId);
		if (!test) return res.status(404).json({ message: 'Тест не найден' });

		const questions = await getQuestionsByTestId(testId);
		if (questions.length === 0) {
			return res.status(404).json({ message: 'В тесте нет вопросов' });
		}

		const questionsWithOptions = await Promise.all(questions.map(async (q) => {
			const options = await getOptionsByQuestionId(q.id);
			return {
				id: q.id,
				question: q.question,
				type: q.type,
				audio_url: q.audio_url,
				image_url: q.image_url,
				options: options.map(o => o.text)
			};
		}));

		res.json({
			time_limit: test.time_limit,
			questions: questionsWithOptions
		});

	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});

// 3. Проверка и сохранение результата
app.post('/results', async (req, res) => {
	const { testId, name, group, answers, timeSpent, tabSwitches } = req.body;

	try {
		const questions = await getQuestionsByTestId(parseInt(testId));
		let score = 0;
		const details = {};
		const fullReport = [];

		questions.forEach(q => {
			const cleanStr = (str) => {
				if (!str) return "";
				return str.toString()
					.replace(/[\u200B-\u200D\uFEFF]/g, '')
					.replace(/\s+/g, ' ')
					.trim()
					.toLowerCase();
			};

			const userAns = cleanStr(answers[q.id]);
			const correctAns = cleanStr(q.correct_answer);
			const isCorrect = userAns === correctAns;
			if (isCorrect) score++;

			details[q.id] = {
				question: q.question,
				userAnswer: userAns,
				correctAnswer: q.correct_answer,
				isCorrect: isCorrect
			};

			fullReport.push({
				question_text: q.question,
				user_answer: userAns,
				correct_answer: q.correct_answer,
				is_correct: isCorrect
			});
		});

		const { data, error } = await supabase
			.from('results')
			.insert([{
				test_id: parseInt(testId),
				student_name: name || 'Студент',
				group_name: group || 'Группа',
				score: score,
				total: questions.length,
				answers_json: JSON.stringify(fullReport),
				time_spent: timeSpent || 0,
				tab_switches: tabSwitches || 0
			}])
			.select();

		if (error) throw error;

		res.json({
			score,
			total: questions.length,
			details,
			resultId: data[0].id
		});

	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});

// 4. Получение всех результатов
app.get('/results', async (req, res) => {
	try {
		const { data, error } = await supabase
			.from('results')
			.select('*')
			.order('id', { ascending: false });

		if (error) throw error;
		res.json(data);
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});

// 5. Получение списка тестов
app.get('/tests', async (req, res) => {
	try {
		const { data, error } = await supabase
			.from('tests')
			.select('*')
			.order('id', { ascending: false });

		if (error) throw error;
		res.json(data);
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});

// 6. Удаление теста
app.delete('/tests/:id', async (req, res) => {
	const id = parseInt(req.params.id);

	try {
		// Удаляем опции
		await supabase
			.from('options')
			.delete()
			.in('question_id', supabase.from('questions').select('id').eq('test_id', id));

		// Удаляем вопросы
		await supabase
			.from('questions')
			.delete()
			.eq('test_id', id);

		// Удаляем результаты
		await supabase
			.from('results')
			.delete()
			.eq('test_id', id);

		// Удаляем тест
		await supabase
			.from('tests')
			.delete()
			.eq('id', id);

		res.json({ message: 'Тест удален' });
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});

// 7. Удаление результата
app.delete('/results/:id', async (req, res) => {
	try {
		const { error } = await supabase
			.from('results')
			.delete()
			.eq('id', parseInt(req.params.id));

		if (error) throw error;
		res.json({ message: 'Результат удален' });
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});

// ============ ЭКСПОРТ ДЛЯ VERCEL ============
export default app;