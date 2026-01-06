export default defineNuxtRouteMiddleware(async (to, _from) => {
  // Only protect register page (login should be accessible to existing users)
  if (to.path !== '/register') {
    return
  }

  // Check if this is the first user (no users in database)
  try {
    const canRegister = await $fetch<{ canRegister: boolean }>('/api/invites/can-register')
    if (canRegister.canRegister) {
      // Allow registration for first user
      return
    }
  } catch (error) {
    // If error checking, continue with normal flow
  }

  const inviteCode = to.query.invite as string

  // If no invite code in query, check localStorage
  const storedInvite = process.client ? localStorage.getItem('inviteCode') : null

  if (!inviteCode && !storedInvite) {
    // No invite code found, but allow access to register page (will show code entry form)
    return
  }

  // If we have an invite code, validate it server-side
  const codeToValidate = inviteCode || storedInvite

  if (codeToValidate) {
    try {
      // Call server API to validate invite code
      const response = await $fetch<{ valid: boolean }>(`/api/invites/validate?code=${codeToValidate}`)

      if (!response.valid) {
        // Invalid code, redirect to home
        return navigateTo('/')
      }

      // Valid code, store it in localStorage if from query
      if (inviteCode && process.client) {
        localStorage.setItem('inviteCode', inviteCode)
      }
    } catch (error) {
      // Error validating, redirect to home
      return navigateTo('/')
    }
  }
})
