<script setup lang="ts">
const client = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

const login = async () => {
    loading.value = true
    errorMsg.value = ''
    try {
        const { error } = await client.auth.signInWithPassword({
            email: email.value,
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

watchEffect(() => {
    if (user.value) {
        router.push('/app')
    }
})
</script>

<template>
  <div class="hero min-h-screen bg-base-200">
    <div class="hero-content flex-col lg:flex-row-reverse w-full max-w-5xl justify-around">
      <div class="text-center lg:text-left max-w-md">
        <h1 class="text-5xl font-bold">{{ $t('login_title') }}</h1>
        <p class="py-6">{{ $t('login_subtitle') }}</p>
      </div>
      <div class="card flex-shrink-0 w-full max-w-sm bg-base-100">
        <div class="card-body">
          <form @submit.prevent="login">
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
                <label class="label">
                <NuxtLink to="/forgot-password" class="label-text-alt link link-hover">{{ $t('forgot_password') }}</NuxtLink>
                </label>
            </div>
            <div v-if="errorMsg" class="alert alert-error mt-4 text-sm py-2">
                <span>{{ errorMsg }}</span>
            </div>
            <div class="form-control mt-6">
                <button type="submit" class="btn btn-primary" :disabled="loading">
                    <span v-if="loading" class="loading loading-spinner"></span>
                    {{ $t('login_button') }}
                </button>
            </div>
            <div class="divider">{{ $t('or_divider') }}</div>
             <div class="text-center text-sm">
                {{ $t('no_account') }} <NuxtLink to="/register" class="link link-primary">{{ $t('register_link') }}</NuxtLink>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
