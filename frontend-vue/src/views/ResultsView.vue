<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

interface ResultDetail {
  question: string
  isCorrect: boolean
  correctAnswer: string
  userAnswer: string
}

const router = useRouter()
const score = ref(0)
const total = ref(0)
const details = ref<Record<string, ResultDetail>>({})
const openedAnswers = ref<Record<string, boolean>>({})

onMounted(() => {
  const saved = localStorage.getItem('lastResult')

  if (!saved) {
    router.push('/')
    return
  }

  try {
    const parsed = JSON.parse(saved)
    score.value = parsed.score
    total.value = parsed.total
    details.value = parsed.details
  } catch (e) {
    console.error('Ошибка парсинга результатов:', e)
    router.push('/')
  }
})

const toggleAnswer = (qId: string) => {
  openedAnswers.value[qId] = !openedAnswers.value[qId]
}

const goBack = () => {
  localStorage.removeItem('lastResult')
  router.push('/')
}
</script>

<template>
  <div class="result-page">
    <div class="result-header">
      <h1 class="page-title">Результаты теста</h1>
      <div class="score-container">
        <span class="score-text">Ваш результат:</span>
        <div class="score-value">{{ score }} / {{ total }}</div>
      </div>
    </div>

    <div class="questions-list">
      <div v-for="(info, qId, index) in details" :key="qId" class="result-card">
        <div class="result-card-top">
          <span class="q-index">Вопрос #{{ index + 1 }}</span>
          <span :class="['status-tag', info.isCorrect ? 'status-correct' : 'status-wrong']">
            {{ info.isCorrect ? 'Верно' : 'Ошибка' }}
          </span>
        </div>

        <p class="result-q-text">{{ info.question }}</p>

        <div class="user-answer-box">
          <span class="label">Ваш ответ: </span>
          <span :class="['answer-text', info.isCorrect ? 'text-correct' : 'text-wrong']">
            {{ info.userAnswer || 'Пропущено' }}
          </span>
        </div>

        <div class="reveal-wrapper">
          <button class="toggle-btn" @click="toggleAnswer(qId.toString())">
            {{ openedAnswers[qId] ? 'Скрыть ответ' : 'Проверить правильный ответ' }}
          </button>

          <div v-if="openedAnswers[qId]" class="correct-answer-reveal">
            <span class="check-icon">✅</span>
            Правильный ответ: <strong>{{ info.correctAnswer }}</strong>
          </div>
        </div>
      </div>
    </div>

    <div class="result-actions">
      <button class="back-home-btn" @click="goBack">Вернуться к списку тестов</button>
    </div>
  </div>
</template>
