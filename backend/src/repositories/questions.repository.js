import { supabase } from '../lib/supabase.js';

export const listQuestionsByTestId = async (testId) => {
	const { data, error } = await supabase
		.from('questions')
		.select('*')
		.eq('test_id', testId)
		.order('id', { ascending: true });

	if (error) {
		throw error;
	}

	return data || [];
};

export const listQuestionIdsByTestId = async (testId) => {
	const { data, error } = await supabase
		.from('questions')
		.select('id')
		.eq('test_id', testId);

	if (error) {
		throw error;
	}

	return data || [];
};

export const createQuestion = async (question) => {
	const { data, error } = await supabase
		.from('questions')
		.insert([question])
		.select()
		.single();

	if (error) {
		throw error;
	}

	return data;
};

export const deleteQuestionsByTestId = async (testId) => {
	const { error } = await supabase
		.from('questions')
		.delete()
		.eq('test_id', testId);

	if (error) {
		throw error;
	}
};
