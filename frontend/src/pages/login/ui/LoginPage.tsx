import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LoginForm } from '../../../features/auth'

export function LoginPage() {
  const navigate = useNavigate()
  const [showTeacherLogin, setShowTeacherLogin] = useState(false)

  const toggleTeacherForm = () => setShowTeacherLogin((v) => !v)

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="page-title">Система тестирования</h1>
        <p className="login-subtitle">Выберите вашу роль для начала работы</p>

        <div className="login-actions">
          <button
            className="role-btn student-btn"
            onClick={() => navigate('/student')}
          >
            Я студент
          </button>

          <button
            className="role-btn teacher-toggle-btn"
            onClick={toggleTeacherForm}
          >
            Я преподаватель
          </button>
        </div>

        {showTeacherLogin && <LoginForm />}
      </div>
    </div>
  )
}
