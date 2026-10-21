import { useEffect, useState } from 'react'
import { getTests, deleteTest, TestCard } from '../../../entities/test'
import { getResults, deleteResult, ResultCard } from '../../../entities/result'
import { TestUploadForm } from '../../../features/test-upload'
import { isUnauthorizedError } from '../../../shared/lib'
import type { Test } from '../../../entities/test'
import type { Result } from '../../../entities/result'

export function TeacherPage() {
  const [tests, setTests] = useState<Test[]>([])
  const [results, setResults] = useState<Result[]>([])
  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({})

  const loadTests = async () => {
    try {
      setTests(await getTests())
    } catch (e) {
      console.error('Ошибка загрузки тестов:', e)
    }
  }

  const loadResults = async () => {
    try {
      setResults(await getResults())
    } catch (e) {
      if (isUnauthorizedError(e)) return
      console.error('Ошибка загрузки результатов:', e)
    }
  }

  const handleDeleteTest = async (id: number) => {
    if (!confirm('Удалить тест и все его вопросы?')) return

    try {
      await deleteTest(id)
      await loadTests()
      await loadResults()
    } catch (e) {
      if (isUnauthorizedError(e)) return
      console.error('Ошибка удаления теста:', e)
      alert('Не удалось удалить тест')
    }
  }

  const handleDeleteResult = async (id: number) => {
    if (!confirm('Удалить этот результат?')) return

    try {
      await deleteResult(id)
      await loadResults()
    } catch (e) {
      if (isUnauthorizedError(e)) return
      console.error('Ошибка удаления результата:', e)
      alert('Не удалось удалить результат')
    }
  }

  const toggleExpanded = (id: number) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  useEffect(() => {
    loadTests()
    loadResults()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="teacher-page">
      <h1>👨‍🏫 Панель преподавателя</h1>

      <div className="card">
        <h2>📥 Загрузка нового теста</h2>

        <TestUploadForm onUploaded={loadTests} />
      </div>

      <div className="card">
        <h2>📚 Опубликованные тесты</h2>

        {tests.length === 0 && (
          <div className="empty">Список тестов пуст</div>
        )}

        {tests.map((test) => (
          <TestCard
            key={test.id}
            test={test}
            actions={
              <button
                className="delete-btn"
                onClick={() => handleDeleteTest(test.id)}
              >
                Удалить
              </button>
            }
          />
        ))}
      </div>

      <div className="card">
        <h2>📊 Результаты и детальные ошибки</h2>

        {results.length === 0 ? (
          <div className="empty">Студенты еще не проходили тесты</div>
        ) : (
          <div className="results-list">
            {results.map((r) => (
              <ResultCard
                key={r.id}
                result={r}
                expanded={!!expandedIds[r.id]}
                onToggle={() => toggleExpanded(r.id)}
                onDelete={() => handleDeleteResult(r.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
