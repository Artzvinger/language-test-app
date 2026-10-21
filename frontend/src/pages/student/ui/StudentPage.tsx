import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTests, TestCard } from '../../../entities/test'
import type { Test } from '../../../entities/test'

export function StudentPage() {
  const navigate = useNavigate()
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const data = await getTests()

        if (!cancelled) {
          setTests(Array.isArray(data) ? data : [])
        }
      } catch (e) {
        console.error(e)
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Ошибка сервера')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="page-wrapper">
      <h1 className="page-title">📚 Доступные тесты</h1>

      {loading && <div className="status-msg">Загрузка тестов...</div>}

      {error && <div className="error-msg">{error}</div>}

      {!loading && tests.length === 0 && (
        <div className="status-msg">
          На данный момент доступных тестов нет.
        </div>
      )}

      <div className="test-list">
        {tests.map((test) => (
          <TestCard
            key={test.id}
            test={test}
            actions={
              <button
                className="main-btn"
                onClick={() => navigate(`/test/${test.id}`)}
              >
                Начать тест
              </button>
            }
          />
        ))}
      </div>
    </div>
  )
}
