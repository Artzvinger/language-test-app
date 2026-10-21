import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { StudentResultDetail } from '../../../entities/result'

export function ResultPage() {
  const navigate = useNavigate()
  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)
  const [details, setDetails] = useState<Record<string, StudentResultDetail>>({})
  const [openedAnswers, setOpenedAnswers] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const saved = localStorage.getItem('lastResult')

    if (!saved) {
      navigate('/')
      return
    }

    try {
      const parsed = JSON.parse(saved)
      setScore(parsed.score)
      setTotal(parsed.total)
      setDetails(parsed.details)
    } catch (e) {
      console.error('Ошибка парсинга результатов:', e)
      navigate('/')
    }
  }, [navigate])

  const toggleAnswer = (qId: string) => {
    setOpenedAnswers((prev) => ({ ...prev, [qId]: !prev[qId] }))
  }

  const goBack = () => {
    localStorage.removeItem('lastResult')
    navigate('/')
  }

  return (
    <div className="result-page">
      <div className="result-header">
        <h1 className="page-title">Результаты теста</h1>
        <div className="score-container">
          <span className="score-text">Ваш результат:</span>
          <div className="score-value">
            {score} / {total}
          </div>
        </div>
      </div>

      <div className="questions-list">
        {Object.entries(details).map(([qId, info], index) => (
          <div key={qId} className="result-card">
            <div className="result-card-top">
              <span className="q-index">Вопрос #{index + 1}</span>
              <span
                className={`status-tag ${
                  info.isCorrect ? 'status-correct' : 'status-wrong'
                }`}
              >
                {info.isCorrect ? 'Верно' : 'Ошибка'}
              </span>
            </div>

            <p className="result-q-text">{info.question}</p>

            <div className="user-answer-box">
              <span className="label">Ваш ответ: </span>
              <span
                className={`answer-text ${
                  info.isCorrect ? 'text-correct' : 'text-wrong'
                }`}
              >
                {info.userAnswer || 'Пропущено'}
              </span>
            </div>

            <div className="reveal-wrapper">
              <button className="toggle-btn" onClick={() => toggleAnswer(qId)}>
                {openedAnswers[qId]
                  ? 'Скрыть ответ'
                  : 'Проверить правильный ответ'}
              </button>

              {openedAnswers[qId] && (
                <div className="correct-answer-reveal">
                  <span className="check-icon">✅</span>
                  Правильный ответ: <strong>{info.correctAnswer}</strong>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="result-actions">
        <button className="back-home-btn" onClick={goBack}>
          Вернуться к списку тестов
        </button>
      </div>
    </div>
  )
}
