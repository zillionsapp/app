<script setup lang="ts">
const client = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

const register = async () => {
    loading.value = true
    errorMsg.value = ''
    try {
        const { error } = await client.auth.signUp({
            email: email.value,
            password: password.value
        })
        if (error) throw error
        // Note: Supabase might require email confirmation.
        alert($t('register_success'))
    } catch (e: any) {
        errorMsg.value = e.message
    } finally {
        loading.value = false
    }
}

watchEffect(() => {
    if (user.value) {
        router.push('/app')
    }
})
</script>

<template>
  <div class="hero min-h-[80vh] bg-base-200">
    <div class="hero-content flex-col lg:flex-row-reverse w-full max-w-5xl justify-around">
      <div class="text-center lg:text-left max-w-md">
        <h1 class="text-5xl font-bold">{{ $t('register_title') }}</h1>
        <p class="py-6">{{ $t('register_subtitle') }}</p>
      </div>
      <div class="card flex-shrink-0 w-full max-w-sm shadow-2xl bg-base-100">
        <div class="card-body">
          <form @submit.prevent="register">
            <div class="form-control">
                <label class="label">
                <span class="label-text">{{ $t('email') }}</span>
                </label>
                <input v-model="email" type="email" :placeholder="$t('email')" class="input input-bordered" required />
            </div>
            <div class="form-control">
                <label class="label">
                <span class="label-text">{{ $t('password') }}</span>
                </label>
                <input v-model="password" type="password" :placeholder="$t('password')" class="input input-bordered" required />
            </div>
            <div v-if="errorMsg" class="alert alert-error mt-4 text-sm py-2">
                <span>{{ errorMsg }}</span>
            </div>
            <div class="form-control mt-6">
                <button type="submit" class="btn btn-primary" :disabled="loading">
                    <span v-if="loading" class="loading loading-spinner"></span>
                    {{ $t('register_button') }}
                </button>
            </div>
             <div class="divider">{{ $t('or_divider') }}</div>
             <div class="text-center text-sm">
                {{ $t('have_account') }} <NuxtLink to="/login" class="link link-primary">{{ $t('login_link') }}</NuxtLink>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
