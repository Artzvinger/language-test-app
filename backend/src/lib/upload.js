import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import multer from 'multer';

// Кроссплатформенная временная папка (на Windows тоже работает).
const uploadDir = path.join(os.tmpdir(), 'language-test-uploads');

fs.mkdirSync(uploadDir, { recursive: true });

export const upload = multer({
	dest: uploadDir,
	limits: {
		fileSize: 10 * 1024 * 1024
	}
});
