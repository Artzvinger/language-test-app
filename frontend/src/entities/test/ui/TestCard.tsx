import type { ReactNode } from 'react'
import type { Test } from '../model/types'

interface TestCardProps {
  test: Test
  actions?: ReactNode
}

export function TestCard({ test, actions }: TestCardProps) {
  return (
    <div className="test-item">
      <div className="test-info">
        <span className="test-id">ID: {test.id}</span>
        <span className="test-title">
          <strong>{test.title}</strong>
        </span>
      </div>

      {actions}
    </div>
  )
}
