import env from '../config/env.js';

import * as pgTests from './tests.repository.js';
import * as pgQuestions from './questions.repository.js';
import * as pgOptions from './options.repository.js';
import * as pgResults from './results.repository.js';

import * as sqTests from './sqlite/tests.repository.js';
import * as sqQuestions from './sqlite/questions.repository.js';
import * as sqOptions from './sqlite/options.repository.js';
import * as sqResults from './sqlite/results.repository.js';

const impl =
	env.dbProvider === 'sqlite'
		? {
				tests: sqTests,
				questions: sqQuestions,
				options: sqOptions,
				results: sqResults
			}
		: {
				tests: pgTests,
				questions: pgQuestions,
				options: pgOptions,
				results: pgResults
			};

export const findTestById = impl.tests.findTestById;
export const listTests = impl.tests.listTests;
export const createTest = impl.tests.createTest;
export const deleteTest = impl.tests.deleteTest;

export const listQuestionsByTestId = impl.questions.listQuestionsByTestId;
export const listQuestionIdsByTestId = impl.questions.listQuestionIdsByTestId;
export const createQuestion = impl.questions.createQuestion;
export const deleteQuestionsByTestId = impl.questions.deleteQuestionsByTestId;

export const listOptionsByQuestionId = impl.options.listOptionsByQuestionId;
export const createOptions = impl.options.createOptions;
export const deleteOptionsByQuestionIds = impl.options.deleteOptionsByQuestionIds;

export const createResult = impl.results.createResult;
export const listResults = impl.results.listResults;
export const deleteResult = impl.results.deleteResult;
export const deleteResultsByTestId = impl.results.deleteResultsByTestId;
