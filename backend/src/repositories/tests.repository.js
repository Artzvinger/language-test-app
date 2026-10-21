import { supabase } from '../lib/supabase.js';

export const findTestById = async (id) => {
	const { data, error } = await supabase
		.from('tests')
		.select('*')
		.eq('id', id)
		.single();

	if (error) {
		throw error;
	}

	return data;
};

export const listTests = async () => {
	const { data, error } = await supabase
		.from('tests')
		.select('*')
		.order('id', { ascending: false });

	if (error) {
		throw error;
	}

	return data || [];
};

export const createTest = async ({ title, time_limit }) => {
	const { data, error } = await supabase
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
	const { error } = await supabase
		.from('tests')
		.delete()
		.eq('id', id);

	if (error) {
		throw error;
	}
};
