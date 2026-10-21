import { getSupabase } from '../lib/supabase.js';

export const findTestById = async (id) => {
	const { data, error } = await getSupabase()
		.from('tests')
		.select('*')
		.eq('id', id)
		.maybeSingle();

	if (error) {
		throw error;
	}

	return data;
};

export const listTests = async () => {
	const { data, error } = await getSupabase()
		.from('tests')
		.select('*')
		.order('id', { ascending: false });

	if (error) {
		throw error;
	}

	return data || [];
};

export const createTest = async ({ title, time_limit }) => {
	const { data, error } = await getSupabase()
		.from('tests')
		.insert([{ title, time_limit }])
		.select()
		.single();

	if (error) {
		throw error;
	}

	return data;
};

export const deleteTest = async (id) => {
	const { error } = await getSupabase()
		.from('tests')
		.delete()
		.eq('id', id);

	if (error) {
		throw error;
	}
};
