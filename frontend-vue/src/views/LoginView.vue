<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const showTeacherLogin = ref(false)
const password = ref('')
const error = ref('')

const TEACHER_PASSWORD = '1234'

const loginStudent = () => {
  router.push('/student')
}

const toggleTeacherForm = () => {
  showTeacherLogin.value = !showTeacherLogin.value
  error.value = ''
  password.value = ''
}

const loginTeacher = () => {
  error.value = ''
  if (!password.value) {
    error.value = 'Введите пароль'
    return
  }
  if (password.value === TEACHER_PASSWORD) {
    password.value = ''
    showTeacherLogin.value = false
    router.push('/teacher')
  } else {
    error.value = 'Неверный пароль'
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <h1 class="page-title">Система тестирования</h1>
      <p class="login-subtitle">Выберите вашу роль для начала работы</p>

      <div class="login-actions">
        <button class="role-btn student-btn" @click="loginStudent">Я студент</button>

        <button class="role-btn teacher-toggle-btn" @click="toggleTeacherForm">
          Я преподаватель
        </button>
      </div>

      <div v-if="showTeacherLogin" class="teacher-auth-box">
        <input
          type="password"
          v-model="password"
          placeholder="Пароль администратора"
          class="styled-input"
          @keyup.enter="loginTeacher"
        />
        <button class="main-submit-btn" @click="loginTeacher">Войти</button>
        <p v-if="error" class="error-msg">{{ error }}</p>
      </div>
    </div>
  </div>
</template>
