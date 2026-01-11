<script setup lang="ts">
const client = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()

const logout = async () => {
  const { error } = await client.auth.signOut()
  if (!error) {
    router.push('/')
  }
}
</script>

<template>
  <div class="drawer-side z-40 border-r border-base-200">
    <label for="my-drawer-2" aria-label="close sidebar" class="drawer-overlay"></label>
    <nav class="flex min-h-screen w-72 flex-col gap-2 overflow-y-auto bg-base-100 py-10">
      <div class="mx-6 flex items-center gap-2 font-black">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          class="fill-base-content">
          <path d="M12 2L20.5 7V17L12 22L3.5 17V7L12 2Z"/>
        </svg>
        Zillions
      </div>
      <ul class="menu menu-compact w-full px-6">
        <li class="w-full">
          <NuxtLink to="/app" exact-active-class="active" :class="['flex items-center gap-3 w-full block px-6 rounded-lg', $route.path === '/app' ? 'bg-base-200' : '']">
            <svg data-src="https://unpkg.com/heroicons/20/solid/wallet.svg" class="h-5 w-5 flex-shrink-0"></svg>
            <span>{{ $t('app.nav.wallet') }}</span>
          </NuxtLink>
        </li>
        <li class="w-full">
          <NuxtLink to="/app/transactions" active-class="active" :class="['flex items-center gap-3 w-full block px-6 rounded-lg', $route.path === '/app/transactions' ? 'bg-base-200' : '']">
            <svg data-src="https://unpkg.com/heroicons/20/solid/receipt-refund.svg" class="h-5 w-5 flex-shrink-0"></svg>
            <span>{{ $t('app.nav.transactions') }}</span>
          </NuxtLink>
        </li>
        <li class="w-full">
          <NuxtLink to="/app/invitations" active-class="active" :class="['flex items-center gap-3 w-full block px-6 rounded-lg', $route.path === '/app/invitations' ? 'bg-base-200' : '']">
            <svg data-src="https://unpkg.com/heroicons/20/solid/user-plus.svg" class="h-5 w-5 flex-shrink-0"></svg>
            <span>{{ $t('app.nav.invitations') }}</span>
          </NuxtLink>
        </li>
        <li class="w-full">
          <NuxtLink to="/app/core" active-class="active" :class="['flex items-center gap-3 w-full block px-6 rounded-lg', $route.path === '/app/core' ? 'bg-base-200' : '']">
            <svg data-src="https://unpkg.com/heroicons/20/solid/home.svg" class="h-5 w-5 flex-shrink-0"></svg>
            <span>{{ $t('app.nav.dashboard') }}</span>
          </NuxtLink>
        </li>
        <li class="w-full disabled">
          <div class="flex items-center gap-3 w-full px-6 rounded-lg opacity-50 cursor-not-allowed">
            <svg data-src="https://unpkg.com/heroicons/20/solid/signal.svg" class="h-5 w-5 flex-shrink-0"></svg>
            <span>{{ $t('app.nav.signals') }}</span>
            <span class="badge badge-primary badge-sm">Pro</span>
          </div>
        </li>
        <li class="w-full">
          <NuxtLink to="/app/settings" active-class="active" :class="['flex items-center gap-3 w-full block px-6 rounded-lg', $route.path === '/app/settings' ? 'bg-base-200' : '']">
            <svg data-src="https://unpkg.com/heroicons/20/solid/adjustments-vertical.svg" class="h-5 w-5 flex-shrink-0"></svg>
            <span>{{ $t('app.nav.settings') }}</span>
          </NuxtLink>
        </li>
      </ul>

      <div class="mt-auto">
        <div class="px-6">
          <div class="divider"></div>
        </div>
        <div class="flex flex-col gap-2 px-4">
          <a @click="logout" class="btn btn-ghost btn-sm text-error justify-start">
            <svg data-src="https://unpkg.com/heroicons/20/solid/arrow-right-on-rectangle.svg" class="h-5 w-5"></svg>
            {{ $t('app.nav.logout') }}
          </a>
          <LanguageSwitcher direction="up" />
          <ThemeToggle />
        </div>
      </div>
    </nav>
  </div>
</template>
