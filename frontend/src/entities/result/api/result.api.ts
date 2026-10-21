import { request } from '../../../shared/api'
import type { Result } from '../model/types'

export const getResults = () => request<Result[]>('/results', { auth: true })

export const deleteResult = (id: number) =>
  request<{ message: string }>(`/results/${id}`, {
    method: 'DELETE',
    auth: true,
  })
