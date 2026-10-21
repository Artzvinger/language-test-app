export interface Question {
  id: number
  question: string
  type: string
  audio_url?: string | null
  image_url?: string | null
  options: string[]
}
