<script setup lang="ts">
const client = useSupabaseClient()
const email = ref('')
const loading = ref(false)
const message = ref('')
const errorMsg = ref('')

const handleReset = async () => {
    loading.value = true
    message.value = ''
    errorMsg.value = ''
    
    try {
        const { error } = await client.auth.resetPasswordForEmail(email.value, {
            redirectTo: `${window.location.origin}/update-password`,
        })
        if (error) throw error
        message.value = $t('reset_message')
    } catch (e: any) {
        errorMsg.value = e.message
    } finally {
        loading.value = false
    }
}
</script>

<template>
  <div class="hero min-h-screen bg-base-200">
    <div class="hero-content flex-col lg:flex-row-reverse">
        <div class="text-center lg:text-left ml-10">
            <h1 class="text-5xl font-bold">{{ $t('forgot_title') }}</h1>
            <p class="py-6">{{ $t('forgot_subtitle') }}</p>
        </div>
      <div class="card flex-shrink-0 w-full max-w-sm shadow-2xl bg-base-100">
        <div class="card-body">
            <form @submit.prevent="handleReset">
                <div class="form-control">
                    <label class="label">
                        <span class="label-text">{{ $t('email') }}</span>
                    </label>
                    <input v-model="email" type="email" :placeholder="$t('email')" class="input input-bordered" required />
                </div>
                <div v-if="message" class="alert alert-success mt-4 py-2 text-sm">
                    <span>{{ $t('reset_message') }}</span>
                </div>
                <div v-if="errorMsg" class="alert alert-error mt-4 py-2 text-sm">
                    <span>{{ errorMsg }}</span>
                </div>
                <div class="form-control mt-6">
                    <button type="submit" class="btn btn-primary" :disabled="loading">
                        <span v-if="loading" class="loading loading-spinner"></span>
                        {{ $t('reset_button') }}
                    </button>
                </div>
                <div class="text-center mt-4">
                    <NuxtLink to="/login" class="link link-hover">{{ $t('back_to_login') }}</NuxtLink>
                </div>
            </form>
        </div>
      </div>
    </div>
  </div>
</template>
