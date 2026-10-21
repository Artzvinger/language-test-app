import 'dotenv/config';

const isVercel = process.env.VERCEL === '1';

const requestedProvider = (process.env.DB_PROVIDER || '').toLowerCase();

// Локально — SQLite, на Vercel — Supabase. Можно переопределить через DB_PROVIDER.
const dbProvider =
	requestedProvider === 'sqlite' || requestedProvider === 'supabase'
		? requestedProvider
		: isVercel
			? 'supabase'
			: 'sqlite';

const env = {
	supabaseUrl: process.env.SUPABASE_URL,
	supabaseKey: process.env.SUPABASE_KEY,
	adminPassword: process.env.ADMIN_PASSWORD,
	tokenSecret:
		process.env.ADMIN_TOKEN_SECRET ||
		process.env.ADMIN_PASSWORD ||
		'dev-secret-change-me',
	corsOrigins: (process.env.CORS_ORIGINS || '')
		.split(',')
		.map((origin) => origin.trim())
		.filter(Boolean),
	dbProvider
};

export default env;
