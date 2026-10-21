import { API_URL } from '../config/env'

export const resolveAudioUrl = (url: string): string =>
  url.startsWith('http')
    ? url
    : `${API_URL}/audio/${url.replace('audio/', '')}`
