import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input } from '../../../shared/ui'
import { tokenStorage } from '../../../shared/api'
import { login } from '../api/auth.api'

export function LoginForm() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const handleSubmit = async () => {
    setError('')

    if (!password) {
      setError('Введите пароль')
      return
    }

    setIsLoggingIn(true)

    try {
      const { token } = await login(password)
      tokenStorage.set(token)
      setPassword('')
      navigate('/teacher')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка входа')
    } finally {
      setIsLoggingIn(false)
    }
  }

  return (
    <div className="teacher-auth-box">
      <Input
        type="password"
        value={password}
        placeholder="Пароль администратора"
        className="styled-input"
        disabled={isLoggingIn}
        onChange={(e) => setPassword(e.target.value)}
        onKeyUp={(e) => {
          if (e.key === 'Enter') handleSubmit()
        }}
      />

      <Button
        className="main-submit-btn"
        disabled={isLoggingIn}
        onClick={handleSubmit}
      >
        {isLoggingIn ? 'Вход...' : 'Войти'}
      </Button>

      {error && <p className="error-msg">{error}</p>}
    </div>
  )
}
