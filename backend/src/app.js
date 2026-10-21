import express from 'express';
import env from './config/env.js';
import { corsMiddleware } from './middleware/cors.js';
import apiRouter from './routes/index.js';

const app = express();

app.use(corsMiddleware);
app.use(express.json());

app.get('/', (req, res) => {
	res.json({
		status: 'ok',
		message: 'Language Test API работает',
		supabase: Boolean(env.supabaseUrl && env.supabaseKey)
	});
});

app.use(apiRouter);

export default app;
