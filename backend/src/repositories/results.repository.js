import { supabase } from '../lib/supabase.js';

export const createResult = async (result) => {
	const { data, error } = await supabase
		.from('results')
		.insert([result])
		.select()
		.single();

	if (error) {
		throw error;
	}

	return data;
};

export const listResults = async () => {
	const { data, error } = await supabase
		.from('results')
		.select('*')
		.order('id', { ascending: false });

	if (error) {
		throw error;
	}

	return data || [];
};

export const deleteResult = async (id) => {
	const { error } = await supabase
		.from('results')
		.delete()
		.eq('id', id);

	if (error) {
		throw error;
	}
};

export const deleteResultsByTestId = async (testId) => {
	const { error } = await supabase
		.from('results')
		.delete()
		.eq('test_id', testId);

	if (error) {
		throw error;
	}
};
