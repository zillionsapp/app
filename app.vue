<template>
  <div>
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

// Initialize i18n
const { locale } = useI18n()

// Set locale from cookie if available
const cookieLang = useCookie('i18n_redirected')
if (cookieLang.value) {
  locale.value = cookieLang.value
}
</script>
