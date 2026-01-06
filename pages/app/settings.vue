<script setup lang="ts">
definePageMeta({
  layout: 'app',
  middleware: 'auth'
})

const emailNotifications = ref(false)
const marketingEmails = ref(false)
const paperMode = ref(true) // Always enabled
const isLoading = ref(true)

// Fetch user settings on component mount
onMounted(async () => {
  try {
    const settings = await $fetch('/api/settings') as Record<string, any>
    emailNotifications.value = settings.email_notifications === true
    marketingEmails.value = settings.marketing_emails === true
    paperMode.value = settings.paper_mode === true
  } catch (error) {
    console.error('Failed to load settings:', error)
  } finally {
    isLoading.value = false
  }
})

// Update settings function
const updateSettings = async () => {
  try {
    await $fetch('/api/settings', {
      method: 'POST',
      body: {
        email_notifications: emailNotifications.value,
        marketing_emails: marketingEmails.value,
        paper_mode: paperMode.value
      }
    })
    // Could show a success message here
  } catch (error) {
    console.error('Failed to update settings:', error)
    // Could show an error message here
  }
}

// Watch for changes and auto-save
watch([emailNotifications, marketingEmails, paperMode], updateSettings)
</script>

<template>
  <!-- General Settings -->
  <section class="card col-span-12 bg-base-100 rounded-box xl:col-span-6">
    <div class="card-body">
      <h2 class="card-title">{{ $t('app.settings.general_preferences') }}</h2>
      <div class="divider"></div>

      <div class="form-control" v-if="!isLoading">
        <label class="label cursor-pointer">
          <span class="label-text">{{ $t('app.settings.email_notifications') }}</span>
          <input type="checkbox" v-model="emailNotifications" class="checkbox checkbox-primary" />
        </label>
        <label class="label-text-alt ml-1 opacity-70">{{ $t('app.settings.email_notifications_desc') }}</label>
      </div>

       <div class="form-control mt-4" v-if="!isLoading">
        <label class="label cursor-pointer">
          <span class="label-text">{{ $t('app.settings.marketing_emails') }}</span>
          <input type="checkbox" v-model="marketingEmails" class="checkbox checkbox-primary" />
        </label>
      </div>

      <div class="form-control mt-4" v-if="!isLoading">
        <label class="label cursor-not-allowed">
          <span class="label-text">Paper Mode</span>
          <input type="checkbox" v-model="paperMode" class="checkbox checkbox-warning" disabled />
        </label>
        <label class="label-text-alt ml-1 opacity-70">Always active - Test the trading bot experience without using real money</label>
      </div>

      <div v-else class="flex justify-center py-4">
        <span class="loading loading-spinner loading-md"></span>
      </div>
    </div>
  </section>

  <!-- Security Settings -->
  <section class="card col-span-12 bg-base-100 rounded-box xl:col-span-6">
    <div class="card-body">
      <h2 class="card-title">{{ $t('app.settings.security') }}</h2>
      <div class="divider"></div>
       <div class="flex flex-col gap-4">
            <NuxtLink to="/update-password" class="btn btn-outline btn-warning w-fit">{{ $t('app.settings.change_pass') }}</NuxtLink>
       </div>
    </div>
  </section>
</template>
