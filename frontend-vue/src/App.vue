<script setup lang="ts">
import { RouterView, useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <header class="app-header">
    <div class="header-content" @click="goHome">
      <img src="@/assets/logo-hspm.png" alt="ВШПМ" class="uni-logo" />

      <div class="header-text">
        <span class="uni-name">ВШПМ</span>
        <span class="uni-full-name">Высшая школа печати и медиатехнологий</span>
      </div>
    </div>
  </header>

  <main class="main-container">
    <RouterView />
  </main>
</template>
