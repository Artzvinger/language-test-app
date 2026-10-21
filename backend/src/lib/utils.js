import fs from 'fs';

export const parseId = (value) => {
	const parsed = parseInt(value, 10);

	return Number.isNaN(parsed) ? null : parsed;
};

export const deleteTemporaryFile = (filePath) => {
	try {
		if (filePath && fs.existsSync(filePath)) {
			fs.unlinkSync(filePath);
		}
	} catch (error) {
		console.error('⚠️ Не удалось удалить временный файл:', error);
	}
};

export const cleanString = (value) => {
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
