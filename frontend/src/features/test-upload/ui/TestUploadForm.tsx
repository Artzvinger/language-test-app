import { useState } from 'react'
import { request } from '../../../shared/api'
import { isUnauthorizedError } from '../../../shared/lib'
import { Input } from '../../../shared/ui'

interface UploadResponse {
  message: string
  testId: number
  questionsCount: number
  timeLimit: number
}

interface TestUploadFormProps {
  onUploaded: () => void
}

export function TestUploadForm({ onUploaded }: TestUploadFormProps) {
  const [testName, setTestName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const input = event.target
    const file = input.files?.[0]

    if (!file) return

    if (!testName.trim()) {
      alert('Сначала введите название теста!')
      input.value = ''
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', testName.trim())

    setLoading(true)

    try {
      const data = await request<UploadResponse>('/upload', {
        method: 'POST',
        body: formData,
        auth: true,
      })

      alert(
        `Тест "${testName}" успешно загружен` +
          (data.questionsCount ? `\nВопросов: ${data.questionsCount}` : ''),
      )

      setTestName('')
      onUploaded()
    } catch (e) {
      if (isUnauthorizedError(e)) return

      console.error('Ошибка загрузки Excel:', e)

      alert(
        e instanceof Error ? `Ошибка загрузки: ${e.message}` : 'Ошибка загрузки',
      )
    } finally {
      setLoading(false)
      input.value = ''
    }
  }

  return (
    <div className="upload-container">
      <Input
        value={testName}
        type="text"
        placeholder="Название теста (напр. Unit 1: Listening)"
        className="text-answer"
        style={{ marginBottom: '15px', width: '100%' }}
        onChange={(e) => setTestName(e.target.value)}
      />

      <input
        type="file"
        accept=".xlsx,.xls"
        disabled={loading}
        onChange={handleUpload}
      />

      {loading && (
        <p className="status-msg">
          ⏳ Обработка файла и загрузка в базу...
        </p>
      )}
    </div>
  )
}
