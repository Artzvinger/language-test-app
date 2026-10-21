import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { AppHeader } from '../widgets/app-header'
import { UNAUTHORIZED_EVENT } from '../shared/api'

export function App() {
  const navigate = useNavigate()

  useEffect(() => {
    const onUnauthorized = () => navigate('/')
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
  }, [navigate])

  return (
    <>
      <AppHeader />
      <main className="main-container">
        <Outlet />
      </main>
    </>
  )
}
