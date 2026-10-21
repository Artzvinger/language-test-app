import 'dotenv/config';

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
		.filter(Boolean)
};

export default env;
