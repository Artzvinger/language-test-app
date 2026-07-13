const express = require('express')
const multer = require('multer')
const xlsx = require('xlsx')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const sqlite3 = require('sqlite3').verbose()

const app = express()

app.use(cors())
app.use(express.json())

const UPLOADS_DIR = path.join(__dirname, 'uploads');
const AUDIO_DIR = path.join(__dirname, 'audio');
const IMAGES_DIR = path.join(__dirname, 'images');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);
if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR);
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR);

app.use('/audio', express.static(AUDIO_DIR));
app.use('/images', express.static(IMAGES_DIR));

// инициализация бд
const db = new sqlite3.Database('./database.db')

db.serialize(() => {
	db.run(`CREATE TABLE IF NOT EXISTS tests (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, time_limit INTEGER)`)
	db.run(`CREATE TABLE IF NOT EXISTS questions (id INTEGER PRIMARY KEY AUTOINCREMENT, test_id INTEGER, question TEXT, type TEXT, audio_url TEXT, image_url TEXT, correct_answer TEXT)`)
	db.run(`CREATE TABLE IF NOT EXISTS options (id INTEGER PRIMARY KEY AUTOINCREMENT, question_id INTEGER, text TEXT)`)
	db.run(`CREATE TABLE IF NOT EXISTS results (
												   id INTEGER PRIMARY KEY AUTOINCREMENT,
		                                           test_id INTEGER,
		                                           student_name TEXT,
		                                           group_name TEXT,
		                                           score INTEGER,
		                                           total INTEGER,
		                                           answers_json TEXT,
		                                           time_spent INTEGER,
		                                           tab_switches INTEGER,
		                                           created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	        )`)
})

const runAsync = (sql, params) => {
	return new Promise((resolve, reject) => {
		db.run(sql, params, function (err) {
			if (err) reject(err);
			else resolve(this);
		});
	});
};

const allAsync = (sql, params) => {
	return new Promise((resolve, reject) => {
		db.all(sql, params, (err, rows) => {
			if (err) reject(err);
			else resolve(rows);
		});
	});
};

const getAsync = (sql, params) => {
	return new Promise((resolve, reject) => {
		db.get(sql, params, (err, row) => {
			if (err) reject(err);
			else resolve(row);
		});
	});
};

const upload = multer({ dest: 'uploads/' })

// Загрузка теста из Экселя
app.post('/upload', upload.single('file'), async (req, res) => {
	if (!req.file) return res.status(400).json({ message: 'Нет файла' });

	try {
		const workbook = xlsx.readFile(req.file.path);
		const sheet = workbook.Sheets[workbook.SheetNames[0]];
		const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

		let timeLimitSeconds = 1800;

		try {
			if (sheet && sheet['I2']) {
				const cell = sheet['I2'];

				if (cell.t === 'n' && cell.v < 1 && cell.v > 0) {
					const secondsInDay = 86400;
					const totalSeconds = Math.round(cell.v * secondsInDay);
					if (totalSeconds > 0) {
						timeLimitSeconds = totalSeconds;
					}
				} else {
					const cellText = cell.w || (cell.v !== undefined && cell.v !== null ? cell.v.toString().trim() : "");

					if (cellText.includes(':')) {
						const parts = cellText.split(':');

						if (parts.length === 3) {
							const hours = parseInt(parts[0], 10) || 0;
							const minutes = parseInt(parts[1], 10) || 0;
							const seconds = parseInt(parts[2], 10) || 0;

							if (hours > 0 && minutes === 0 && hours <= 24) {
								timeLimitSeconds = hours * 60;
							} else {
								timeLimitSeconds = (hours * 3600) + (minutes * 60) + seconds;
							}
						} else {
							const minutes = parseInt(parts[0], 10);
							const seconds = parseInt(parts[1], 10) || 0;

							if (!isNaN(minutes) && minutes > 0) {
								timeLimitSeconds = (minutes * 60) + seconds;
							}
						}
					} else {
						const parsedTime = parseInt(cellText, 10);
						if (!isNaN(parsedTime) && parsedTime > 0) {
							timeLimitSeconds = parsedTime * 60;
						}
					}
				}
				console.log(`⏱ Итоговый таймер сохранен в БД: ${timeLimitSeconds} сек. (${Math.floor(timeLimitSeconds / 60)} мин.)`);
			}
		} catch (timerError) {
			console.error("Ошибка при чтении ячейки таймера I2, взято время по умолчанию:", timerError.message);
		}

		const testTitle = req.body.title || 'Новый тест';
		const testResult = await runAsync(`INSERT INTO tests (title, time_limit) VALUES (?, ?)`, [testTitle, timeLimitSeconds]);
		const testId = testResult.lastID;

		for (let i = 1; i < data.length; i++) {
			const row = data[i];
			if (!row || row.length < 2) continue;

			const val = (idx) => (row[idx] !== undefined && row[idx] !== null) ? row[idx].toString().trim() : "";

			const questionText = val(1);
			if (!questionText) continue;

			const rawOptions = [val(2), val(3), val(4), val(5)];
			const filteredOptions = rawOptions.filter(opt => opt.length > 0);

			const type = filteredOptions.length > 0 ? 'multiple' : 'text';

			let audioUrl = val(7);
			if (!audioUrl || audioUrl.trim() === "") audioUrl = null;

			let correctAnswer = val(6);

			let imageUrl = val(8);
			if (!imageUrl || imageUrl.trim() === "") imageUrl = null;

			if (type === 'multiple') {
				const marker = correctAnswer.toUpperCase();
				const letterMap = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
				if (letterMap.hasOwnProperty(marker)) {
					correctAnswer = filteredOptions[letterMap[marker]] || correctAnswer;
				}
			}

			const qResult = await runAsync(
				`INSERT INTO questions (test_id, question, type, audio_url, image_url, correct_answer) VALUES (?, ?, ?, ?, ?, ?)`,
				[testId, questionText, type, audioUrl, imageUrl, correctAnswer]
			);

			const questionId = qResult.lastID;
			for (const opt of filteredOptions) {
				await runAsync(`INSERT INTO options (question_id, text) VALUES (?, ?)`, [questionId, opt]);
			}
		}

		if (fs.existsSync(req.file.path)) {
			fs.unlinkSync(req.file.path);
		}

		res.json({ message: 'Тест успешно загружен' });
	} catch (e) {
		console.error("Критическая ошибка при импорте Excel:", e);
		if (req.file && fs.existsSync(req.file.path)) {
			fs.unlinkSync(req.file.path);
		}
		res.status(500).json({ error: 'Ошибка сервера при парсинге файла: ' + e.message });
	}
});

// Получение теста для студента
app.get('/tests/:id', async (req, res) => {
	try {
		const testInfo = await getAsync(`SELECT time_limit FROM tests WHERE id = ?`, [req.params.id]);
		if (!testInfo) return res.status(404).json({ message: 'Тест не найден' });

		const rows = await allAsync(`
			SELECT q.id, q.question, q.type, q.audio_url, q.image_url, o.text AS option_text
			FROM questions q
					 LEFT JOIN options o ON q.id = o.question_id
			WHERE q.test_id = ?
			ORDER BY q.id ASC`, [req.params.id]);

		if (rows.length === 0) return res.status(404).json({ message: 'В тесте нет вопросов' });

		const map = new Map();
		rows.forEach(row => {
			if (!map.has(row.id)) {
				map.set(row.id, {
					id: row.id,
					question: row.question,
					type: row.type,
					audio_url: row.audio_url,
					image_url: row.image_url,
					options: []
				});
			}
			if (row.option_text) map.get(row.id).options.push(row.option_text);
		});

		res.json({
			time_limit: testInfo.time_limit,
			questions: Array.from(map.values())
		});
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});

// Проверка и сохранение результата
app.post('/results', async (req, res) => {
	const { testId, name, group, answers, timeSpent, tabSwitches } = req.body;
	try {
		const questions = await allAsync(`SELECT * FROM questions WHERE test_id = ?`, [testId]);
		let score = 0;
		const details = {};
		const fullReport = [];

		questions.forEach(q => {
			const cleanStr = (str) => {
				if (!str) return "";
				return str
					.toString()
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

		await runAsync(
			`INSERT INTO results (test_id, student_name, group_name, score, total, answers_json, time_spent, tab_switches) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			[Number(testId), name, group, score, questions.length, JSON.stringify(fullReport), timeSpent || 0, tabSwitches || 0]
		);

		res.json({ score, total: questions.length, details });
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});

// Получение результата для преподавателя
app.get('/results', (req, res) => {
	db.all(`SELECT * FROM results ORDER BY id DESC`, [], (err, rows) => {
		if (err) return res.status(500).json({ error: err.message });
		res.json(rows);
	});
});

// Получение списка тестов
app.get('/tests', (req, res) => {
	db.all(`SELECT * FROM tests ORDER BY id DESC`, [], (err, rows) => res.json(rows));
});

// Удаление теста
app.delete('/tests/:id', async (req, res) => {
	const id = req.params.id;
	try {
		await runAsync(`DELETE FROM options WHERE question_id IN (SELECT id FROM questions WHERE test_id = ?)`, [id]);
		await runAsync(`DELETE FROM questions WHERE test_id = ?`, [id]);
		await runAsync(`DELETE FROM tests WHERE id = ?`, [id]);
		res.json({ message: 'Тест удален' });
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});

// Удаление результата
app.delete('/results/:id', (req, res) => {
	db.run(`DELETE FROM results WHERE id = ?`, [req.params.id], () => res.json({ message: 'Результат удален' }));
});

const PORT = 8000;
app.listen(PORT, () => console.log(`🚀 Сервер готов: http://localhost:${PORT}`));