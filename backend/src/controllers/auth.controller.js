import { authenticate } from '../services/auth.service.js';

export const loginHandler = (req, res) => {
	try {
		const { token } = authenticate(req.body?.password);

		return res.json({ token });
	} catch (error) {
		return res.status(error.status || 500).json({
			message: error.message
		});
	}
};
