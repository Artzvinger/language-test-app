import { createClient } from '@supabase/supabase-js';
import env from '../config/env.js';

if (!env.supabaseUrl || !env.supabaseKey) {
	console.error('❌ Не заданы SUPABASE_URL и SUPABASE_KEY');
}

export const supabase = createClient(
	env.supabaseUrl || '',
	env.supabaseKey || ''
);
