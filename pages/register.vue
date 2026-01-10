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

// Invite code related state
const inviteCode = ref('')
const inviteLoading = ref(false)
const inviteError = ref('')
const hasValidCode = ref(false)
const codeValidated = ref(false)

// Commission details state
const commissionDetails = ref<any>(null)
const commissionLoading = ref(false)

const validateInviteCode = async () => {
    inviteLoading.value = true
    inviteError.value = ''

    if (!inviteCode.value.trim()) {
        inviteError.value = 'Please enter an invite code'
        inviteLoading.value = false
        return
    }

    try {
        const response = await $fetch<{ valid: boolean }>(`/api/invites/validate?code=${inviteCode.value.trim()}`)

        if (response.valid) {
            // Store the code in localStorage
            if (process.client) {
                localStorage.setItem('inviteCode', inviteCode.value.trim())
            }

            // Fetch commission details
            await fetchCommissionDetails(inviteCode.value.trim())

            hasValidCode.value = true
            codeValidated.value = true
            inviteError.value = ''
        } else {
            inviteError.value = $t('auth.invalid_code')
        }
    } catch (error) {
        inviteError.value = 'Failed to validate code. Please try again.'
    } finally {
        inviteLoading.value = false
    }
}

const fetchCommissionDetails = async (code: string) => {
    commissionLoading.value = true
    try {
        const details = await $fetch(`/api/invites/details?code=${code}`)
        commissionDetails.value = details
    } catch (error) {
        console.error('Failed to fetch commission details:', error)
        // Don't fail validation if commission details fail to load
    } finally {
        commissionLoading.value = false
    }
}

const checkExistingCode = async () => {
    const existingCode = route.query.invite as string || (process.client ? localStorage.getItem('inviteCode') : null)

    if (existingCode) {
        try {
            const response = await $fetch<{ valid: boolean }>(`/api/invites/validate?code=${existingCode}`)
            if (response.valid) {
                // Store the code in localStorage if it came from URL
                if (process.client && route.query.invite) {
                    localStorage.setItem('inviteCode', existingCode)
                }

                // Fetch commission details for the valid code
                await fetchCommissionDetails(existingCode)

                hasValidCode.value = true
                codeValidated.value = true
                return
            }
        } catch (error) {
            // Code is invalid, continue to show form
        }
    }
}

onMounted(() => {
    checkExistingCode()
})

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
  <div class="hero min-h-screen bg-base-200">
    <div class="hero-content flex-col lg:flex-row-reverse w-full max-w-5xl justify-around">
      <div class="text-center lg:text-left max-w-md">
        <h1 class="text-5xl font-bold" v-if="hasValidCode">{{ $t('register_title') }}</h1>
        <h1 class="text-5xl font-bold" v-else>{{ $t('auth.invite_title') }}</h1>
        <p class="py-6" v-if="hasValidCode">{{ $t('register_subtitle') }}</p>
        <p class="py-6" v-else>{{ $t('auth.invite_subtitle') }}</p>
      </div>
      <div class="card flex-shrink-0 w-full max-w-sm bg-base-100">
        <div class="card-body">
          <!-- Invite Code Form -->
          <form v-if="!hasValidCode" @submit.prevent="validateInviteCode">
            <div class="form-control">
                <label class="label">
                <span class="label-text">{{ $t('auth.invite_code') }}</span>
                </label>
                <input v-model="inviteCode" type="text" :placeholder="$t('auth.invite_code_placeholder')" class="input input-bordered" required />
            </div>
            <div v-if="inviteError" class="alert alert-error mt-4 text-sm py-2">
                <span>{{ inviteError }}</span>
            </div>
            <div v-if="codeValidated" class="alert alert-success mt-4 text-sm py-2">
                <span>{{ $t('auth.code_validated') }}</span>
            </div>
            <div class="form-control mt-6">
                <button type="submit" class="btn btn-primary w-full" :disabled="inviteLoading">
                    <span v-if="inviteLoading" class="loading loading-spinner"></span>
                    {{ $t('auth.validate_code') }}
                </button>
            </div>
          </form>

          <!-- Registration Form -->
          <form v-else @submit.prevent="register">
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

            <!-- Commission Information -->
            <div v-if="commissionDetails" class="alert alert-info mt-4 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current flex-shrink-0 w-6 h-6">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div>
                    <div class="font-semibold">Referral Commission</div>
                    <div class="text-xs">
                        By registering with this invite code, the referrer will earn <strong>{{ (commissionDetails.commissionRate * 100).toFixed(1) }}%</strong> of your future trading profits.
                    </div>
                </div>
            </div>

            <div v-if="errorMsg" class="alert alert-error mt-4 text-sm py-2">
                <span>{{ errorMsg }}</span>
            </div>
            <div class="form-control mt-6">
                <button type="submit" class="btn btn-primary w-full" :disabled="loading">
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
