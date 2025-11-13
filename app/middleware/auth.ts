export default defineNuxtRouteMiddleware((to) => {
  // Skip auth for sign-in and sign-up pages
  if (to.path === '/sign-in' || to.path === '/sign-up') {
    return
  }

  // Check if user is authenticated using Clerk's useUser composable
  const { user, isLoaded } = useUser()
  console.log(user.value);

  // Check if user is signed in
  if (!user.value) {
    // Redirect to sign-in page with return URL
    return navigateTo(`/sign-in?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
