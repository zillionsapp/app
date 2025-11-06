<template>
  <div class="min-h-screen flex items-center justify-center bg-base-100">
    <div class="max-w-md w-full space-y-8 p-8">
      <div class="text-center">
        <h2 class="text-3xl font-bold text-base-content">Sign In</h2>
        <p class="mt-2 text-sm text-base-content/70">
          Please sign in to access your wallet and backtest features
        </p>
      </div>

      <div class="mt-8">
        <SignIn :redirect-url="redirectUrl || '/wallet'" />
      </div>

      <div class="text-center">
        <p class="text-sm text-base-content/70">
          Don't have an account?
          <NuxtLink to="/sign-up" class="text-blue-400 hover:text-blue-300">
            Sign up here
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const redirectUrl = computed(() => {
  const redirect = route.query.redirect
  if (redirect) {
    return decodeURIComponent(redirect)
  }
  return '/wallet'
})
</script>
