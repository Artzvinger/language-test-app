import cors from 'cors';
import env from '../config/env.js';

export const corsMiddleware = cors({
	origin(origin, callback) {
		// Запросы без Origin (curl, сервер-к-серверу) разрешаем,
		// CORS всё равно защищает только браузеры.
		if (
			!origin ||
			env.corsOrigins.length === 0 ||
			env.corsOrigins.includes(origin)
		) {
			callback(null, true);
			return;
		}

		callback(new Error('Origin не разрешён CORS-политикой'));
	},
	methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization']
});
