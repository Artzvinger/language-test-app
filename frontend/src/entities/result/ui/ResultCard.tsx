import { Button } from '../../../shared/ui'
import { formatTimeSpent } from '../../../shared/lib'
import type { AnswerDetail, Result } from '../model/types'

interface ResultCardProps {
  result: Result
  expanded: boolean
  onToggle: () => void
  onDelete: () => void
}

const parseDetails = (json: string): AnswerDetail[] => {
  try {
    return JSON.parse(json)
  } catch (e) {
    console.error('Ошибка чтения answers_json:', e)
    return []
  }
}

export function ResultCard({
  result: r,
  expanded,
  onToggle,
  onDelete,
}: ResultCardProps) {
  const percent = Math.round((r.score / (r.total || 1)) * 100)
  const passed = r.score / (r.total || 1) >= 0.5

  return (
    <div className="result-entry">
      <div className="result-summary" onClick={onToggle}>
        <div className="res-main">
          <span className="expand-icon">{expanded ? '▼' : '▶'}</span>

          <span className="student-name">{r.student_name}</span>

          <span className="group-tag">{r.group_name}</span>
        </div>

        <div className="res-stats">
          <span className="time-badge">
            ⏱ {formatTimeSpent(r.time_spent)}
          </span>

          {r.tab_switches != null && r.tab_switches > 0 && (
            <span
              className="warning-badge"
              title="Студент покидал вкладку теста"
            >
              ⚠️ Списывание: {r.tab_switches}
            </span>
          )}

          <span className="score-text">
            {r.score} / {r.total}
          </span>

          <span className={`percent-badge ${passed ? 'pass' : 'fail'}`}>
            {percent}%
          </span>

          <Button
            className="delete-btn small"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
          >
            🗑
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="result-details">
          <div className="meta-info-row">
            <span>
              <strong>Затраченное время:</strong>{' '}
              {formatTimeSpent(r.time_spent)}
            </span>

            <span style={{ marginLeft: '20px' }}>
              <strong>Попыток покинуть страницу:</strong>{' '}
              <span
                style={{
                  color: r.tab_switches ? '#f56c6c' : '#67c23a',
                  fontWeight: 'bold',
                }}
              >
                {r.tab_switches || 0}
              </span>
            </span>
          </div>

          {!r.answers_json ? (
            <div className="no-data">
              Детальные данные недоступны для старых записей
            </div>
          ) : (
            parseDetails(r.answers_json).map((det, idx) => (
              <div
                key={idx}
                className={`detail-row ${
                  det.is_correct ? 'correct-row' : 'wrong-row'
                }`}
              >
                <div className="q-text">
                  <strong>Q{idx + 1}:</strong> {det.question_text}
                </div>

                <div className="a-info">
                  <span>
                    Ответ студента:{' '}
                    <code className="user-ans">
                      {det.user_answer || '(пусто)'}
                    </code>
                  </span>

                  {!det.is_correct && (
                    <span className="corr-ans">
                      Правильно: <b>{det.correct_answer}</b>
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
