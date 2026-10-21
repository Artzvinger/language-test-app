import { HttpError } from '../api/http-client'

export const isUnauthorizedError = (e: unknown): boolean =>
  e instanceof HttpError && e.status === 401
