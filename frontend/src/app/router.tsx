import { createBrowserRouter } from 'react-router-dom'
import { App } from './App'
import { LoginPage } from '../pages/login'
import { StudentPage } from '../pages/student'
import { TeacherPage } from '../pages/teacher'
import { TestRunPage } from '../pages/test-run'
import { ResultPage } from '../pages/result'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <LoginPage /> },
      { path: 'test/:id', element: <TestRunPage /> },
      { path: 'results', element: <ResultPage /> },
      { path: 'student', element: <StudentPage /> },
      { path: 'teacher', element: <TeacherPage /> },
    ],
  },
])
