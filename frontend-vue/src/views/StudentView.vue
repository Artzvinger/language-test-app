```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

interface Test {
  id: number
  title: string
}

const API_URL = import.meta.env.VITE_API_URL

const router = useRouter()

const tests = ref<Test[]>([])
const loading = ref(true)
const error = ref('')

const loadTests = async () => {
  try {
    const res = await fetch(`${API_URL}/tests`)

    if (!res.ok) {
      throw new Error('Ошибка загрузки тестов')
    }

    const data = await res.json()

    tests.value = Array.isArray(data) ? data : []
  } catch (e: unknown) {
    console.error(e)

    error.value =
      e instanceof Error ? e.message : 'Ошибка сервера'
  } finally {
    loading.value = false
  }
}

const openTest = (id: number) => {
  router.push(`/test/${id}`)
}

onMounted(() => {
  loadTests()
})
</script>

<template>
  <div class="page-wrapper">
    <h1 class="page-title">📚 Доступные тесты</h1>

    <div v-if="loading" class="status-msg">
      Загрузка тестов...
    </div>

    <div v-if="error" class="error-msg">
      {{ error }}
    </div>

    <div
      v-if="!loading && tests.length === 0"
      class="status-msg"
    >
      На данный момент доступных тестов нет.
    </div>

    <div class="test-list">
      <div
        v-for="test in tests"
        :key="test.id"
        class="test-item"
      >
        <div class="test-info">
          <span class="test-id">
            ID: {{ test.id }}
          </span>

          <h3 class="test-title">
            {{ test.title }}
          </h3>
        </div>

        <button
          class="main-btn"
          @click="openTest(test.id)"
        >
          Начать тест
        </button>
      </div>
    </div>
  </div>
</template>
```
