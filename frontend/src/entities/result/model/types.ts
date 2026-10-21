export interface Result {
  id: number
  student_name: string
  group_name: string
  score: number
  total: number
  answers_json: string
  time_spent?: number
  tab_switches?: number
  created_at: string
}

export interface AnswerDetail {
  question_text: string
  user_answer: string
  correct_answer: string
  is_correct: boolean
}

export interface StudentResultDetail {
  question: string
  isCorrect: boolean
  correctAnswer: string
  userAnswer: string
}
