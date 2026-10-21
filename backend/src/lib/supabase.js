import { createClient } from '@supabase/supabase-js';
import env from '../config/env.js';

let client = null;

// Ленивая инициализация: в режиме SQLite Supabase не нужен вовсе.
export const getSupabase = () => {
	if (!client) {
		if (!env.supabaseUrl || !env.supabaseKey) {
			throw new Error('Не заданы SUPABASE_URL и SUPABASE_KEY');
		}

		client = createClient(env.supabaseUrl, env.supabaseKey);
	}

	return client;
};
