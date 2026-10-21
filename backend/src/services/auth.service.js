import { signToken } from '../lib/token.js';
import env from '../config/env.js';

export const authenticate = (password) => {
	if (!env.adminPassword) {
		const error = new Error('ADMIN_PASSWORD не задан на сервере');
		error.status = 500;
		throw error;
	}

	if (typeof password === 'string' && password === env.adminPassword) {
		return { token: signToken() };
	}

	const error = new Error('Неверный пароль');
	error.status = 401;
	throw error;
};
