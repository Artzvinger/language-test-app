<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'

interface Question {
  id: number
  question: string
  type: string
  audio_url?: string
  image_url?: string
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

const timeLeft = ref(600)
const totalTestTime = ref(600)
const tabSwitchesCount = ref(0)
let timerInterval: any = null

const formattedTime = computed(() => {
  const minutes = Math.floor(timeLeft.value / 60)
  const seconds = timeLeft.value % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

const timeSpent = computed(() => {
  return totalTestTime.value - timeLeft.value
})

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

// Функция отслеживания смены вкладок (Фиксация скрытная, без алертов)
const handleVisibilityChange = () => {
  if (document.hidden && !testFinished.value && !loading.value) {
    tabSwitchesCount.value++ // Нарушение фиксируется в фоне
  }
}

// Запуск таймера обратного отсчета
const startTimer = () => {
  timerInterval = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--
    } else {
      clearInterval(timerInterval)
      alert('Время вышло! Тест будет автоматически отправлен.')
      handleSubmit() // Автоотправка при 00:00
    }
  }, 1000)
}

onMounted(async () => {
  window.history.pushState(null, '', window.location.href)
  window.addEventListener('popstate', preventBack)
  document.addEventListener('visibilitychange', handleVisibilityChange)

  if (!testId) return
  try {
    const res = await fetch(`http://localhost:8000/tests/${testId}`)
    if (!res.ok) throw new Error('Тест не найден')
    const data = await res.json()

    questions.value = data.questions.map((q: any) => ({
      ...q,
      id: Number(q.id),
    }))

    // Присваиваем время, пришедшее из базы данных бэкенда
    if (data.time_limit) {
      timeLeft.value = Number(data.time_limit)
      totalTestTime.value = Number(data.time_limit)
    }

    const initialAnswers: Record<number, string> = {}
    questions.value.forEach((q) => {
      initialAnswers[q.id] = ''
    })
    answers.value = initialAnswers

    startTimer()
  } catch (e) {
    console.error('Ошибка загрузки:', e)
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  window.removeEventListener('popstate', preventBack)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  if (timerInterval) clearInterval(timerInterval)
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
  if (timerInterval) clearInterval(timerInterval)

  try {
    const res = await fetch('http://localhost:8000/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testId: Number(testId),
        name: name.value.trim(),
        group: group.value.trim(),
        answers: answers.value,
        timeSpent: timeSpent.value,
        tabSwitches: tabSwitchesCount.value, // Количество скрытно передается на бэкенд
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
    startTimer()
  }
}
</script>

<template>
  <div class="test-page">
    <div class="test-header">
      <h1 class="page-title">🧠 Тестирование</h1>
      <!-- Липкий блок таймера -->
      <div
        v-if="!loading && questions.length > 0"
        class="timer-badge"
        :class="{ 'timer-urgent': timeLeft < 60 }"
      >
        ⏱ Осталось времени: {{ formattedTime }}
      </div>
    </div>

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

        <!-- Модуль Аудио -->
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

        <!-- Модуль Картинки -->
        <div v-if="q.image_url" class="image-wrapper">
          <img
            :src="
              q.image_url.startsWith('http')
                ? q.image_url
                : `http://localhost:8000/images/${q.image_url}`
            "
            alt="Иллюстрация к вопросу"
            class="question-image"
          />
        </div>

        <!-- Кнопки вариантов (закрытый тип) -->
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

        <!-- Текстовое поле (открытый тип) -->
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
