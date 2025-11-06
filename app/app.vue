<template>
  <div class="min-h-screen flex flex-col bg-base-100 text-base-content">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup>
import { useHead } from '#imports'

// Let daisyUI handle theme switching based on system preference
useHead({
  htmlAttrs: {
    // No data-theme attribute - let daisyUI's --default/--prefersdark handle it
  },
})
</script>
