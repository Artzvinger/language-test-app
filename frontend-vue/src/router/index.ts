import { createRouter, createWebHistory } from 'vue-router'
import TestView from '../views/TestView.vue'
import ResultView from '../views/ResultsView.vue'
import LoginView from '../views/LoginView.vue'
import StudentView from '../views/StudentView.vue'
import TeacherView from '../views/TeacherView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'login', component: LoginView },
    { path: '/test/:id', name: 'test-run', component: TestView },
    { path: '/result', name: 'result', component: ResultView },
    { path: '/student', name: 'student', component: StudentView },
    { path: '/teacher', name: 'teacher', component: TeacherView },
  ],
})

export default router
