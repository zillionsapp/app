<template>
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold">Trading Dashboard</h1>
      <p class="opacity-70">Performance Overview</p>
    </div>
    <div class="flex items-center gap-4">
      <div class="badge badge-outline badge-lg">Live</div>
      <select class="select select-bordered select-sm">
        <option>Last 30 Days</option>
        <option>Last 7 Days</option>
        <option>Last 90 Days</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
// No props or logic needed for this simple header component
</script>

<style scoped>
/* Component-specific styles if needed */
</style>
