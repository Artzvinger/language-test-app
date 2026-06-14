<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Test {
  id: number
  title: string
}

interface Detail {
  question_text: string
  user_answer: string
  correct_answer: string
  is_correct: boolean
}

interface Result {
  id: number
  student_name: string
  group_name: string
  score: number
  total: number
  answers_json: string
  time_spent?: number   // Время прохождения в секундах
  tab_switches?: number // Количество уходов со страницы
  created_at: string
  expanded?: boolean
}

const tests = ref<Test[]>([])
const results = ref<Result[]>([])
const loading = ref(false)
const testName = ref('')

const loadTests = async () => {
  try {
    const res = await fetch('http://localhost:8000/tests')
    tests.value = await res.json()
  } catch (e) { console.error(e) }
}

const loadResults = async () => {
  try {
    const res = await fetch('http://localhost:8000/results')
    const data = await res.json()
    results.value = data.map((r: Result) => ({ ...r, expanded: false }))
  } catch (e) { console.error(e) }
}

const deleteTest = async (id: number) => {
  if (!confirm('Удалить тест и все его вопросы?')) return
  await fetch(`http://localhost:8000/tests/${id}`, { method: 'DELETE' })
  await loadTests()
}

const deleteResult = async (id: number) => {
  if (!confirm('Удалить этот результат?')) return
  await fetch(`http://localhost:8000/results/${id}`, { method: 'DELETE' })
  await loadResults()
}

const uploadExcel = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!testName.value.trim()) {
    alert('Сначала введите название теста!')
    input.value = ''
    return
  }
  const formData = new FormData()
  formData.append('file', file)
  formData.append('title', testName.value.trim())

  loading.value = true
  try {
    const res = await fetch('http://localhost:8000/upload', {
      method: 'POST',
      body: formData,
    })
    if (!res.ok) throw new Error('Ошибка сервера')
    alert(`Тест "${testName.value}" успешно загружен`)
    testName.value = ''
    await loadTests()
  } catch (e) {
    alert('Ошибка загрузки')
  } finally {
    loading.value = false
    input.value = ''
  }
}

const getDetails = (json: string): Detail[] => {
  try {
    return JSON.parse(json)
  } catch (e) {
    return []
  }
}

// Красивое форматирование времени для интерфейса
const formatTimeSpent = (seconds?: number): string => {
  if (seconds === undefined || seconds === null) return 'н/д'
  if (seconds < 60) return `${seconds} сек.`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return secs > 0 ? `${mins} мин. ${secs} сек.` : `${mins} мин.`
}

onMounted(() => {
  loadTests()
  loadResults()
})
</script>

<template>
  <div class="teacher-page">
    <h1>👨‍🏫 Панель преподавателя</h1>

    <div class="card">
      <h2>📥 Загрузка нового теста</h2>
      <div class="upload-container">
        <input
          v-model="testName"
          type="text"
          placeholder="Название теста (напр. Unit 1: Listening)"
          class="text-answer"
          style="margin-bottom: 15px; width: 100%;"
        />
        <input type="file" accept=".xlsx,.xls" @change="uploadExcel" :disabled="loading" />
      </div>
      <p v-if="loading" class="status-msg">⏳ Обработка файла и загрузка в базу...</p>
    </div>

    <div class="card">
      <h2>📚 Опубликованные тесты</h2>
      <div v-if="tests.length === 0" class="empty">Список тестов пуст</div>
      <div v-for="test in tests" :key="test.id" class="test-item">
        <div class="test-info">
          <span class="test-id">ID: {{ test.id }}</span>
          <span class="test-title"><strong>{{ test.title }}</strong></span>
        </div>
        <button class="delete-btn" @click="deleteTest(test.id)">Удалить</button>
      </div>
    </div>

    <div class="card">
      <h2>📊 Результаты и детальные ошибки</h2>
      <div v-if="results.length === 0" class="empty">Студенты еще не проходили тесты</div>
      <div v-else class="results-list">
        <div v-for="r in results" :key="r.id" class="result-entry">

          <div class="result-summary" @click="r.expanded = !r.expanded">
            <div class="res-main">
              <span class="expand-icon">{{ r.expanded ? '▼' : '▶' }}</span>
              <span class="student-name">{{ r.student_name }}</span>
              <span class="group-tag">{{ r.group_name }}</span>
            </div>

            <div class="res-stats">
              <!-- Новое: Индикатор времени и нарушений -->
              <span class="time-badge">⏱ {{ formatTimeSpent(r.time_spent) }}</span>

              <span v-if="r.tab_switches && r.tab_switches > 0" class="warning-badge" title="Студент покидал вкладку теста">
                ⚠️ Списывание: {{ r.tab_switches }}
              </span>

              <span class="score-text">{{ r.score }} / {{ r.total }}</span>
              <span :class="['percent-badge', (r.score/r.total) >= 0.5 ? 'pass' : 'fail']">
                {{ Math.round((r.score / (r.total || 1)) * 100) }}%
              </span>
              <button class="delete-btn small" @click.stop="deleteResult(r.id)">🗑</button>
            </div>
          </div>

          <transition name="fade">
            <div v-if="r.expanded" class="result-details">
              <!-- Дополнительная строчка метаданных внутри раскрытого блока -->
              <div class="meta-info-row">
                <span><strong>Затраченное время:</strong> {{ formatTimeSpent(r.time_spent) }}</span>
                <span style="margin-left: 20px;">
                  <strong>Попыток покинуть страницу:</strong>
                  <span :style="{ color: r.tab_switches ? '#f56c6c' : '#67c23a', fontWeight: 'bold' }">
                    {{ r.tab_switches || 0 }}
                  </span>
                </span>
              </div>

              <div v-if="!r.answers_json" class="no-data">Детальные данные недоступны для старых записей</div>
              <div v-else v-for="(det, idx) in getDetails(r.answers_json)" :key="idx"
                   :class="['detail-row', det.is_correct ? 'correct-row' : 'wrong-row']">
                <div class="q-text"><strong>Q{{ idx + 1 }}:</strong> {{ det.question_text }}</div>
                <div class="a-info">
                  <span>Ответ студента: <code class="user-ans">{{ det.user_answer || '(пусто)' }}</code></span>
                  <span v-if="!det.is_correct" class="corr-ans"> Правильно: <b>{{ det.correct_answer }}</b></span>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </div>
</template>
