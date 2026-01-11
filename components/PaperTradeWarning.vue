<script setup lang="ts">
const client = useSupabaseClient()

// Reactive state for showing the warning
const showWarning = ref(true)

// Check if user has already acknowledged the warning
const checkWarningAcknowledged = async () => {
  try {
    const response = await fetch('/api/settings')
    if (response.ok) {
      const settings = await response.json()
      const acknowledged = settings?.paper_trade_warning_acknowledged
      showWarning.value = !acknowledged
    } else {
      showWarning.value = true
    }
  } catch (error) {
    console.error('Error checking warning acknowledgment:', error)
    // Show warning by default if we can't check
    showWarning.value = true
  }
}

// Acknowledge the warning
const acknowledgeWarning = async () => {
  try {
    const response = await fetch('/api/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        paper_trade_warning_acknowledged: true
      })
    })
    if (response.ok) {
      showWarning.value = false
    }
  } catch (error) {
    console.error('Error acknowledging warning:', error)
  }
}

// Check on component mount
onMounted(() => {
  checkWarningAcknowledged()
})
</script>

<template>
  <div v-if="showWarning" class="alert alert-warning shadow-lg w-full flex justify-between">
    <div>
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      <div>
        <h3 class="font-bold">Paper Trade Mode Only</h3>
        <div class="text-xs">This is Paper Trade Mode Only temporary for Jan to stresstest the system! More infos soon.</div>
      </div>
    </div>
    <div class="flex-none">
      <button class="btn btn-lg btn-warning bg-yellow-400 hover:bg-yellow-300 px-8" @click="acknowledgeWarning">
        Ok
      </button>
    </div>
  </div>
</template>
