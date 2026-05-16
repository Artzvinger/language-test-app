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

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);
if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR);

app.use('/audio', express.static(path.join(__dirname, 'audio')));

// DB ИНИЦИАЛИЗАЦИЯ

const db = new sqlite3.Database('./database.db')

db.serialize(() => {
	db.run(`CREATE TABLE IF NOT EXISTS tests (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT)`)
	db.run(`CREATE TABLE IF NOT EXISTS questions (id INTEGER PRIMARY KEY AUTOINCREMENT, test_id INTEGER, question TEXT, type TEXT, audio_url TEXT, correct_answer TEXT)`)
	db.run(`CREATE TABLE IF NOT EXISTS options (id INTEGER PRIMARY KEY AUTOINCREMENT, question_id INTEGER, text TEXT)`)

	db.run(`CREATE TABLE IF NOT EXISTS results (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        test_id INTEGER, 
        student_name TEXT, 
        group_name TEXT, 
        score INTEGER, 
        total INTEGER, 
        answers_json TEXT, 
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

// UPLOAD CONFIG
const upload = multer({ dest: 'uploads/' })

// 1. ЗАГРУЗКА ТЕСТА (Excel)
app.post('/upload', upload.single('file'), async (req, res) => {
	if (!req.file) return res.status(400).json({ message: 'Нет файла' });

	try {
		const workbook = xlsx.readFile(req.file.path);
		const sheet = workbook.Sheets[workbook.SheetNames[0]];
		const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

		const testTitle = req.body.title || 'Новый тест';
		const testResult = await runAsync(`INSERT INTO tests (title) VALUES (?)`, [testTitle]);
		const testId = testResult.lastID;

		for (let i = 1; i < data.length; i++) {
			const row = data[i];
			if (!row || row.length < 2) continue;

			const val = (idx) => (row[idx] !== undefined && row[idx] !== null) ? row[idx].toString().trim() : "";

			const questionText = val(1);
			const rawOptions = [val(2), val(3), val(4), val(5)];
			const filteredOptions = rawOptions.filter(opt => opt.length > 0);
			const type = filteredOptions.length > 0 ? 'multiple' : 'text';

			let correctAnswer = val(6);
			const audioUrl = val(7) || null;

			if (type === 'multiple') {
				const marker = correctAnswer.toUpperCase();
				const letterMap = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
				if (letterMap.hasOwnProperty(marker)) {
					correctAnswer = filteredOptions[letterMap[marker]] || correctAnswer;
				}
			}

			const qResult = await runAsync(
				`INSERT INTO questions (test_id, question, type, audio_url, correct_answer) VALUES (?, ?, ?, ?, ?)`,
				[testId, questionText, type, audioUrl, correctAnswer]
			);

			const questionId = qResult.lastID;
			for (const opt of filteredOptions) {
				await runAsync(`INSERT INTO options (question_id, text) VALUES (?, ?)`, [questionId, opt]);
			}
		}

		fs.unlinkSync(req.file.path);
		res.json({ message: 'Тест успешно загружен' });
	} catch (e) {
		if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
		res.status(500).json({ error: 'Ошибка сервера' });
	}
});

// 2. ПОЛУЧЕНИЕ ТЕСТА (Без правильных ответов для безопасности)
app.get('/tests/:id', async (req, res) => {
	try {
		const rows = await allAsync(`
      SELECT q.id, q.question, q.type, q.audio_url, o.text AS option_text
      FROM questions q 
      LEFT JOIN options o ON q.id = o.question_id
      WHERE q.test_id = ? 
      ORDER BY q.id ASC`, [req.params.id]);

		if (rows.length === 0) return res.status(404).json({ message: 'Тест не найден' });

		const map = new Map();
		rows.forEach(row => {
			if (!map.has(row.id)) {
				map.set(row.id, {
					id: row.id,
					question: row.question,
					type: row.type,
					audio_url: row.audio_url,
					options: []
				});
			}
			if (row.option_text) map.get(row.id).options.push(row.option_text);
		});

		res.json({ questions: Array.from(map.values()) });
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});

// 3. ПРОВЕРКА И СОХРАНЕНИЕ С ДЕТАЛЯМИ
app.post('/results', async (req, res) => {
	const { testId, name, group, answers } = req.body;
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
			`INSERT INTO results (test_id, student_name, group_name, score, total, answers_json) VALUES (?, ?, ?, ?, ?, ?)`,
			[Number(testId), name, group, score, questions.length, JSON.stringify(fullReport)]
		);

		res.json({ score, total: questions.length, details });
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});

// 4. ПОЛУЧЕНИЕ ВСЕХ РЕЗУЛЬТАТОВ (Для преподавателя)
app.get('/results', (req, res) => {
	db.all(`SELECT * FROM results ORDER BY id DESC`, [], (err, rows) => {
		if (err) return res.status(500).json({ error: err.message });
		res.json(rows);
	});
});

app.get('/tests', (req, res) => {
	db.all(`SELECT * FROM tests ORDER BY id DESC`, [], (err, rows) => res.json(rows));
});

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

app.delete('/results/:id', (req, res) => {
	db.run(`DELETE FROM results WHERE id = ?`, [req.params.id], () => res.json({ message: 'Результат удален' }));
});

const PORT = 8000;
app.listen(PORT, () => console.log(`🚀 Сервер готов: http://localhost:${PORT}`));