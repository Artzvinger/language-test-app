import crypto from 'crypto';
import env from '../config/env.js';

const TOKEN_TTL_SECONDS = 60 * 60 * 12; // 12 часов

export const signToken = () => {
	const expiresAt =
		Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;

	const payload = Buffer.from(
		JSON.stringify({ exp: expiresAt })
	).toString('base64url');

	const signature = crypto
		.createHmac('sha256', env.tokenSecret)
		.update(payload)
		.digest('base64url');

	return `${payload}.${signature}`;
};

export const verifyToken = (token) => {
	if (!token || typeof token !== 'string') {
		return false;
	}

	const [payload, signature] = token.split('.');

	if (!payload || !signature) {
		return false;
	}

	let parsed;

	try {
		parsed = JSON.parse(
			Buffer.from(payload, 'base64url').toString('utf8')
		);
	} catch {
		return false;
	}

	if (
		typeof parsed?.exp !== 'number' ||
		parsed.exp < Math.floor(Date.now() / 1000)
	) {
		return false;
	}

	const expected = crypto
		.createHmac('sha256', env.tokenSecret)
		.update(payload)
		.digest('base64url');

	const a = Buffer.from(signature);
	const b = Buffer.from(expected);

	return a.length === b.length && crypto.timingSafeEqual(a, b);
};
