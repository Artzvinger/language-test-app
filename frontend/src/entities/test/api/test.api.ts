import { request } from '../../../shared/api'
import type { Test, TestDetail } from '../model/types'

export const getTests = () => request<Test[]>('/tests')

export const getTestById = (id: number | string) =>
  request<TestDetail>(`/tests/${id}`)

export const deleteTest = (id: number) =>
  request<{ message: string }>(`/tests/${id}`, {
    method: 'DELETE',
    auth: true,
  })
