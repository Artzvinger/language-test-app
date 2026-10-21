import app from './src/app.js';

// Локальный запуск (на Vercel serverless слушает сама платформа).
if (process.env.VERCEL !== '1') {
	const port = process.env.PORT || 8000;

	app.listen(port, () => {
		console.log(`✅ Backend запущен: http://localhost:${port}`);
	});
}

export default app;
