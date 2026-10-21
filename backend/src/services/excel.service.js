import xlsx from 'xlsx';

export const readWorkbook = (filePath) => {
	const workbook = xlsx.readFile(filePath);

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

	return { sheet, data };
};

export const extractTimeLimit = (sheet) => {
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

	return timeLimitSeconds;
};

const TYPE_AUDIO = ['audio', 'audio_question', 'аудио'];
const TYPE_TEXT = ['text', 'open', 'open-ended', 'open_question', 'открытый'];

export const parseRows = (rows) => {
	const questions = [];

	for (let i = 1; i < rows.length; i++) {
		const row = rows[i];

		if (!row || row.length === 0) {
			continue;
		}

		const val = (index) => {
			if (row[index] === undefined || row[index] === null) {
				return '';
			}

			return row[index].toString().trim();
		};

		const rawType = val(0).toLowerCase();
		const questionText = val(1);

		// Пустая строка — пропускаем.
		if (!questionText) {
			continue;
		}

		const rawOptions = [val(2), val(3), val(4), val(5)];

		const filteredOptions = rawOptions.filter(
			(option) => option.length > 0
		);

		let type;

		if (TYPE_AUDIO.includes(rawType)) {
			type = 'audio';
		} else if (TYPE_TEXT.includes(rawType)) {
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
			const letter = correctRaw.toUpperCase().trim();

			const letterMap = {
				A: 0,
				B: 1,
				C: 2,
				D: 3
			};

			if (Object.prototype.hasOwnProperty.call(letterMap, letter)) {
				const optionIndex = letterMap[letter];

				if (rawOptions[optionIndex]) {
					correctAnswer = rawOptions[optionIndex];
				}
			}
		}

		questions.push({
			question: questionText,
			type: type,
			audio_url: audioUrl,
			image_url: imageUrl,
			correct_answer: correctAnswer,
			options: filteredOptions
		});
	}

	return questions;
};
