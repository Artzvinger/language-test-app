<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'

interface Question {
  id: number
  question: string
  type: string
  audio_url?: string
  options: string[]
}

const route = useRoute()
const router = useRouter()
const testId = route.params.id as string

const questions = ref<Question[]>([])
const answers = ref<Record<number, string>>({})
const loading = ref(true)
const isSubmitting = ref(false)
const testFinished = ref(false)

const name = ref('')
const group = ref('')

onBeforeRouteLeave((to, from, next) => {
  if (testFinished.value) {
    next()
    return
  }
  const answer = window.confirm(
    'Вы уверены, что хотите покинуть тест? Ваши ответы не будут сохранены!',
  )
  if (answer) next()
  else next(false)
})

const preventBack = () => {
  window.history.pushState(null, '', window.location.href)
}

onMounted(async () => {
  window.history.pushState(null, '', window.location.href)
  window.addEventListener('popstate', preventBack)

  if (!testId) return
  try {
    const res = await fetch(`http://localhost:8000/tests/${testId}`)
    if (!res.ok) throw new Error('Тест не найден')
    const data = await res.json()

    questions.value = data.questions.map((q: any) => ({
      ...q,
      id: Number(q.id),
    }))

    const initialAnswers: Record<number, string> = {}
    questions.value.forEach((q) => {
      initialAnswers[q.id] = ''
    })
    answers.value = initialAnswers
  } catch (e) {
    console.error('Ошибка загрузки:', e)
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  window.removeEventListener('popstate', preventBack)
})

const handleSelect = (qId: number, value: string) => {
  answers.value = { ...answers.value, [qId]: value }
}

const validateName = (event: Event) => {
  const input = event.target as HTMLInputElement
  name.value = input.value.replace(/[^a-zA-Zа-яА-ЯёЁ\s]/g, '')
}
const validateGroup = (event: Event) => {
  const input = event.target as HTMLInputElement
  group.value = input.value.replace(/[^a-zA-Zа-яА-ЯёЁ0-9\-]/g, '')
}

const handleSubmit = async () => {
  if (!name.value.trim() || !group.value.trim()) {
    alert('Пожалуйста, заполните ФИО и группу перед отправкой')
    return
  }

  if (isSubmitting.value) return
  isSubmitting.value = true

  try {
    const res = await fetch('http://localhost:8000/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testId: Number(testId),
        name: name.value.trim(),
        group: group.value.trim(),
        answers: answers.value,
      }),
    })

    const data = await res.json()

    if (res.ok) {
      localStorage.setItem(
        'lastResult',
        JSON.stringify({
          score: data.score,
          total: data.total,
          details: data.details,
        }),
      )
      testFinished.value = true
      router.push('/result')
    } else {
      throw new Error(data.error || 'Ошибка сервера')
    }
  } catch (e: any) {
    alert('Ошибка при отправке: ' + e.message)
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="test-page">
    <h1 class="page-title">🧠 Тестирование</h1>

    <div v-if="loading" class="status-msg">Загрузка вопросов...</div>
    <div v-else-if="questions.length === 0" class="status-msg">Тест пуст</div>

    <div v-else>
      <div class="student-info-grid">
        <div class="input-group">
          <label>Ваше ФИО (только буквы)</label>
          <input
            v-model="name"
            placeholder="Иванов Иван"
            class="styled-input"
            :disabled="isSubmitting"
            @input="validateName"
          />
        </div>
        <div class="input-group">
          <label>Группа (номер и буква)</label>
          <input
            v-model="group"
            placeholder="9-А"
            class="styled-input"
            :disabled="isSubmitting"
            @input="validateGroup"
          />
        </div>
      </div>

      <div v-for="(q, index) in questions" :key="q.id" class="question-card">
        <div class="q-badge">Вопрос #{{ index + 1 }}</div>

        <p class="q-text">{{ q.question }}</p>

        <div v-if="q.audio_url" class="audio-wrapper">
          <span class="audio-label">Прослушайте запись:</span>
          <audio
            controls
            :src="
              q.audio_url.startsWith('http')
                ? q.audio_url
                : `http://localhost:8000/audio/${q.audio_url.replace('audio/', '')}`
            "
          />
        </div>

        <div v-if="q.type === 'multiple' || q.type === 'mc'" class="options-grid">
          <button
            v-for="opt in q.options"
            :key="q.id + '-' + opt"
            type="button"
            class="option-btn"
            :class="{ active: answers[q.id] === opt }"
            :disabled="isSubmitting"
            @click="handleSelect(q.id, opt)"
          >
            {{ opt }}
          </button>
        </div>

        <div v-else class="text-input-wrapper">
          <input
            type="text"
            class="styled-input full-width"
            placeholder="Введите ваш ответ..."
            :value="answers[q.id]"
            :disabled="isSubmitting"
            @input="handleSelect(q.id, ($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>

      <div class="actions-container">
        <button class="main-submit-btn" @click="handleSubmit" :disabled="isSubmitting">
          {{ isSubmitting ? 'Отправка...' : 'Завершить тест' }}
        </button>
      </div>
    </div>
  </div>
</template>
