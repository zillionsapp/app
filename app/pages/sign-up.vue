<template>
  <div class="min-h-screen flex items-center justify-center bg-base-100">
    <div class="max-w-md w-full space-y-8 p-8">
      <div class="text-center">
        <h2 class="text-3xl font-bold text-base-content">Sign Up</h2>
        <p class="mt-2 text-sm text-base-content/70">
          Create your account to get started
        </p>
      </div>

      <div class="mt-8">
        <SignUp />
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
// SignUp component should be auto-imported by Clerk
</script>
