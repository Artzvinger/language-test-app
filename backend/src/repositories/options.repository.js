import { supabase } from '../lib/supabase.js';

export const listOptionsByQuestionId = async (questionId) => {
	const { data, error } = await supabase
		.from('options')
		.select('*')
		.eq('question_id', questionId)
		.order('id', { ascending: true });

	if (error) {
		throw error;
	}

	return data || [];
};

export const createOptions = async (options) => {
	const { error } = await supabase
		.from('options')
		.insert(options);

	if (error) {
		throw error;
	}
};

export const deleteOptionsByQuestionIds = async (questionIds) => {
	const { error } = await supabase
		.from('options')
		.delete()
		.in('question_id', questionIds);

	if (error) {
		throw error;
	}
};
