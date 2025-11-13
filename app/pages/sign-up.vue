<template>
  <div class="min-h-screen flex items-center justify-center bg-base-100">
    <div class="max-w-md w-full space-y-8 p-8">
      <div class="text-center">
        <h2 class="text-3xl font-bold text-base-content">Sign Up</h2>
        <p class="mt-2 text-sm text-base-content/70">
          Create your account to get started
        </p>
      </div>

      <!-- Invite Code Section -->
      <div class="bg-base-200 rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">Invite Code Required</h3>
        <p class="text-sm text-base-content/70 mb-4">
          You need a valid invite code to create an account. Get one from an existing user.
        </p>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">Invite Code</label>
            <input
              v-model="inviteCode"
              type="text"
              class="w-full px-3 py-2 bg-base-100 border border-gray-600 rounded-md text-base-content uppercase"
              placeholder="Enter invite code"
              :class="{ 'border-red-500': inviteCode && !isValidCode }"
              @input="validateInviteCode"
            />
            <p v-if="inviteCode && !isValidCode" class="text-red-500 text-sm mt-1">
              Invalid invite code
            </p>
            <p v-if="isValidCode" class="text-green-500 text-sm mt-1">
              ✓ Valid invite code
            </p>
          </div>

          <div v-if="isValidCode" class="mt-8">
            <div class="text-center mb-4">
              <p class="text-green-600 font-medium">✓ Invite code validated! Please complete your registration:</p>
            </div>
            <SignUp
              :redirect-url="redirectUrl"
              @complete="handleSignUpComplete"
            />
          </div>
        </div>
      </div>

      <div class="text-center">
        <p class="text-sm text-base-content/70">
          Already have an account?
          <NuxtLink to="/sign-in" class="text-blue-400 hover:text-blue-300">
            Sign in here
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { SignUp, useClerk } from '@clerk/vue'

const route = useRoute()
const inviteCode = ref('')
const isValidCode = ref(false)
const referrerData = ref(null)

// Check for invite code in URL query parameter or localStorage
onMounted(() => {
  const urlInviteCode = route.query.invite
  const storedInviteCode = process.client ? localStorage.getItem('usedInviteCode') : null

  if (urlInviteCode) {
    // Store the invite code for persistence
    if (process.client) {
      localStorage.setItem('usedInviteCode', urlInviteCode.toUpperCase())
    }
    inviteCode.value = urlInviteCode.toUpperCase()
    validateInviteCode()
  } else if (storedInviteCode) {
    // Use stored invite code if no URL parameter
    inviteCode.value = storedInviteCode
    validateInviteCode()
  }
})

const redirectUrl = computed(() => {
  return '/wallet' // Redirect to wallet after successful sign-up
})

const validateInviteCode = async () => {
  if (!inviteCode.value) {
    isValidCode.value = false
    return
  }

  try {
    const response = await $fetch(`/api/referrals/validate?code=${inviteCode.value}`)
    if (response.success && response.valid) {
      isValidCode.value = true
      referrerData.value = {
        referrerId: response.referrerId,
        referrerEmail: response.referrerEmail,
        level: response.level
      }
    } else {
      isValidCode.value = false
      referrerData.value = null
    }
  } catch (error) {
    console.error('Error validating invite code:', error)
    isValidCode.value = false
    referrerData.value = null
  }
}

const handleSignUpComplete = async (event) => {
  // This will be called after successful Clerk sign-up
  // We need to create the referral record
  if (isValidCode.value && referrerData.value) {
    try {
      // Get user data from Clerk
      const { user } = useClerk()
      if (user.value) {
        await $fetch('/api/referrals/create', {
          method: 'POST',
          body: {
            userId: user.value.id,
            email: user.value.primaryEmailAddress?.emailAddress,
            referrerId: referrerData.value.referrerId,
            referrerEmail: referrerData.value.referrerEmail
          }
        })
      }
    } catch (error) {
      console.error('Error creating referral record:', error)
    }
  }
}
</script>
