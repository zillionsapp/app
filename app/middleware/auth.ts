export default defineNuxtRouteMiddleware((to) => {
  // Check if user is authenticated using Clerk's useUser composable
  const { user, isLoaded } = useUser()
  console.log(user.value);

  // Check if user is signed in
  if (!user.value) {
    // Redirect to sign-in page with return URL
    return navigateTo(`/sign-in?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
