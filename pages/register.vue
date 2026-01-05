<script setup lang="ts">
definePageMeta({
  middleware: ['invite']
})

const client = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

const register = async () => {
    loading.value = true
    errorMsg.value = ''

    // Basic email validation (very permissive - just check for @ and .)
    if (!email.value.includes('@') || !email.value.includes('.') || email.value.split('@')[1]?.split('.')[0]?.length === 0) {
        errorMsg.value = 'Please enter a valid email address'
        loading.value = false
        return
    }

    // Basic password validation
    if (password.value.length < 6) {
        errorMsg.value = 'Password must be at least 6 characters long'
        loading.value = false
        return
    }

    try {
        const { error } = await client.auth.signUp({
            email: email.value.trim().toLowerCase(),
            password: password.value
        })
        if (error) throw error

        // Get invite code from query or localStorage
        const inviteCode = route.query.invite as string || (process.client ? localStorage.getItem('inviteCode') : null)

        // If we have an invite code, use it
        if (inviteCode) {
            try {
                await $fetch('/api/invites/use', {
                    method: 'POST',
                    body: { inviteCode }
                })
            } catch (inviteError) {
                console.error('Failed to use invite code:', inviteError)
                // Don't fail registration if invite code usage fails
            }
        }

        // Provide clear next steps for the user
        alert('Registration successful! Please check your email for a confirmation link to complete your account setup.')
    } catch (e: any) {
        // Handle specific Supabase errors
        if (e.message?.includes('Email address') && e.message?.includes('is invalid')) {
            errorMsg.value = 'This email address format is not accepted. Please try a different email provider.'
        } else if (e.message?.includes('already registered')) {
            errorMsg.value = 'This email is already registered. Please try logging in instead.'
        } else {
            errorMsg.value = e.message || 'Registration failed. Please try again.'
        }
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
