import { useNavigate } from 'react-router-dom'
import logo from '../../../shared/assets/logo-hspm.png'

export function AppHeader() {
  const navigate = useNavigate()

  return (
    <header className="app-header">
      <div className="header-content" onClick={() => navigate('/')}>
        <img src={logo} alt="ВШПМ" className="uni-logo" />

        <div className="header-text">
          <span className="uni-name">ВШПМ</span>
          <span className="uni-full-name">
            Высшая школа печати и медиатехнологий
          </span>
        </div>
      </div>
    </header>
  )
}
