import type { Question } from '../../question/model/types'

export interface Test {
  id: number
  title: string
  time_limit?: number
}

export interface TestDetail extends Test {
  questions: Question[]
}
