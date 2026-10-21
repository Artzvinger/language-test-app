import { verifyToken } from '../lib/token.js';

export const requireAuth = (req, res, next) => {
	const header = req.headers.authorization || '';

	const token = header.startsWith('Bearer ')
		? header.slice('Bearer '.length)
		: '';

	if (!verifyToken(token)) {
		return res.status(401).json({
			message: 'Требуется авторизация преподавателя'
		});
	}

	next();
};
