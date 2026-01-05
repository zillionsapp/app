<script setup lang="ts">
const client = useSupabaseClient()
const router = useRouter()
const route = useRoute()
const { t } = useI18n()

const pageTitle = computed(() => {
  if (route.path === '/app') return t('dashboard')
  if (route.path === '/app/settings') return t('settings')
  if (route.path === '/app/profile') return t('profile')
  return t('dashboard')
})

const logout = async () => {
  const { error } = await client.auth.signOut()
  if (!error) {
    router.push('/')
  }
}
</script>

<template>
  <div class="drawer min-h-screen bg-base-200 lg:drawer-open">
    <input id="my-drawer-2" type="checkbox" class="drawer-toggle" />
    
    <div class="drawer-content flex flex-col min-h-screen">
      <!-- Main Content -->
      <main class="flex-1">
        <div class="grid grid-cols-12 grid-rows-[min-content] gap-y-12 p-4 lg:gap-x-12 lg:p-10">
          <!-- header -->
          <header class="col-span-12 flex items-center gap-2 lg:gap-4">
            <label for="my-drawer-2" class="btn btn-square btn-ghost drawer-button lg:hidden">
              <svg data-src="https://unpkg.com/heroicons/20/solid/bars-3.svg" class="h-5 w-5"></svg>
            </label>
            <div class="grow">
              <h1 class="lg:text-2xl lg:font-light">{{ pageTitle }}</h1>
            </div>
          </header>
          <!-- /header -->
          <slot />
        </div>
      </main>
    </div>
    
    <AppSidebar />
  </div>
</template>
