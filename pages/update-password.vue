<script setup lang="ts">
const client = useSupabaseClient()
const router = useRouter()
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

const handleUpdate = async () => {
    loading.value = true
    errorMsg.value = ''
    
    try {
        const { error } = await client.auth.updateUser({
            password: password.value
        })
        if (error) throw error
        router.push('/app')
    } catch (e: any) {
        errorMsg.value = e.message
    } finally {
        loading.value = false
    }
}
</script>

<template>
  <div class="hero min-h-screen bg-base-200">
    <div class="hero-content flex-col">
      <div class="text-center lg:text-left">
        <h1 class="text-5xl font-bold">{{ $t('update_title') }}</h1>
        <p class="py-6">{{ $t('update_subtitle') }}</p>
      </div>
      <div class="card flex-shrink-0 w-full max-w-sm shadow-2xl bg-base-100">
        <div class="card-body">
            <form @submit.prevent="handleUpdate">
                <div class="form-control">
                    <label class="label">
                        <span class="label-text">{{ $t('new_pass') }}</span>
                    </label>
                    <input v-model="password" type="password" :placeholder="$t('new_pass')" class="input input-bordered" required />
                </div>
                <div v-if="errorMsg" class="alert alert-error mt-4 py-2 text-sm">
                    <span>{{ errorMsg }}</span>
                </div>
                <div class="form-control mt-6">
                    <button type="submit" class="btn btn-primary" :disabled="loading">
                        <span v-if="loading" class="loading loading-spinner"></span>
                        {{ $t('update_button') }}
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  </div>
</template>
