import { useTestRunner } from '../../../features/test-run'
import { QuestionCard } from '../../../entities/question'
import { sanitizeName, sanitizeGroup } from '../../../shared/lib'

export function TestRunPage() {
  const runner = useTestRunner()

  return (
    <div className="test-page">
      <div className="test-header">
        <h1 className="page-title">🧠 Тестирование</h1>

        {!runner.loading && runner.questions.length > 0 && (
          <div
            className={`timer-badge ${
              runner.timeLeft < 60 ? 'timer-urgent' : ''
            }`}
          >
            ⏱ Осталось времени: {runner.formattedTime}
          </div>
        )}
      </div>

      {runner.loading ? (
        <div className="status-msg">Загрузка вопросов...</div>
      ) : runner.questions.length === 0 ? (
        <div className="status-msg">Тест пуст</div>
      ) : (
        <>
          <div className="student-info-grid">
            <div className="input-group">
              <label>Ваше ФИО (только буквы)</label>

              <input
                value={runner.name}
                placeholder="Иванов Иван"
                className="styled-input"
                disabled={runner.isSubmitting}
                onChange={(e) => runner.setName(sanitizeName(e.target.value))}
              />
            </div>

            <div className="input-group">
              <label>Группа (номер и буква)</label>

              <input
                value={runner.group}
                placeholder="9-А"
                className="styled-input"
                disabled={runner.isSubmitting}
                onChange={(e) => runner.setGroup(sanitizeGroup(e.target.value))}
              />
            </div>
          </div>

          {runner.questions.map((q, index) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={index}
              answer={runner.answers[q.id] ?? ''}
              disabled={runner.isSubmitting}
              onAnswer={runner.handleSelect}
            />
          ))}

          <div className="actions-container">
            <button
              className="main-submit-btn"
              disabled={runner.isSubmitting}
              onClick={runner.handleSubmit}
            >
              {runner.isSubmitting ? 'Отправка...' : 'Завершить тест'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
