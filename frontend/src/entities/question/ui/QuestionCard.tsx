import { resolveAudioUrl } from '../../../shared/lib'
import type { Question } from '../model/types'

interface QuestionCardProps {
  question: Question
  index: number
  answer: string
  disabled: boolean
  onAnswer: (questionId: number, value: string) => void
}

export function QuestionCard({
  question: q,
  index,
  answer,
  disabled,
  onAnswer,
}: QuestionCardProps) {
  const isMultiple = q.type === 'multiple' || q.type === 'mc'

  return (
    <div className="question-card">
      <div className="q-badge">Вопрос #{index + 1}</div>

      <p className="q-text">{q.question}</p>

      {q.audio_url && (
        <div className="audio-wrapper">
          <span className="audio-label">Прослушайте запись:</span>

          <audio controls src={resolveAudioUrl(q.audio_url)} />
        </div>
      )}

      {isMultiple ? (
        <div className="options-grid">
          {q.options.map((opt) => (
            <button
              key={`${q.id}-${opt}`}
              type="button"
              className={`option-btn ${answer === opt ? 'active' : ''}`}
              disabled={disabled}
              onClick={() => onAnswer(q.id, opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <div className="text-input-wrapper">
          <input
            type="text"
            className="styled-input full-width"
            placeholder="Введите ваш ответ..."
            value={answer}
            disabled={disabled}
            onChange={(e) => onAnswer(q.id, e.target.value)}
          />
        </div>
      )}
    </div>
  )
}
