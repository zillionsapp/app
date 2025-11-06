<template>
  <div class="min-h-screen flex bg-base-100 text-base-content">
    <!-- Sidebar - Fixed on desktop, mobile drawer on mobile -->
    <aside
      :class="[
        'bg-base-200 border-r border-base-300 transition-all duration-300 ease-in-out',
        isMobile ? 'fixed inset-y-0 left-0 z-50 w-64' : 'fixed inset-y-0 left-0 w-64 h-screen overflow-y-auto',
        isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'
      ]"
    >
      <!-- Sidebar Header -->
      <div class="p-4 border-b border-base-300 sticky top-0 bg-base-200 z-10">
        <h2 class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent animate-gradient">Zillions</h2>
      </div>

      <!-- Navigation -->
      <nav class="p-4 space-y-2">
        <NuxtLink
          v-for="item in navigationItems"
          :key="item.name"
          :to="item.path"
          class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-base-300 transition-colors duration-200 font-medium"
          :class="{ 'btn bg-gradient-to-r from-primary via-secondary to-accent animate-gradient text-base-100 border-0 text-left!': $route.path === item.path }"
          @click="closeSidebarOnMobile"
        >
          <component :is="getIcon(item.icon)" class="w-5 h-5" />
          <span>{{ item.name }}</span>
        </NuxtLink>
      </nav>

      <!-- Sidebar Footer (optional) -->
      <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-base-300 bg-base-200">
        <button class="btn btn-block btn-outline btn-sm">
          Logout
        </button>
      </div>
    </aside>

    <!-- Mobile Overlay -->
    <div
      v-if="isMobile && sidebarOpen"
      class="fixed inset-0 bg-black bg-opacity-50 z-40"
      @click="closeSidebar"
    ></div>

    <!-- Main Content -->
    <div :class="['flex-1 flex flex-col min-w-0', !isMobile && 'ml-64']">
      <!-- Mobile Header -->
      <header v-if="isMobile" class="bg-base-200 p-4 border-b border-base-300 sticky top-0 z-30">
        <div class="flex items-center justify-between">
          <button
            @click="toggleSidebar"
            class="btn btn-ghost btn-circle btn-sm"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
          <h1 class="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent animate-gradient">Zillions</h1>
          <div class="w-10"></div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 overflow-auto">
        <div class="p-4 md:p-6">
          <NuxtPage />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, defineAsyncComponent } from 'vue'

// Icon components
const WalletIcon = defineAsyncComponent(() => import('../components/icons/WalletIcon.vue'))
const DashboardIcon = defineAsyncComponent(() => import('../components/icons/DashboardIcon.vue'))
const BacktestIcon = defineAsyncComponent(() => import('../components/icons/BacktestIcon.vue'))
const SimulationIcon = defineAsyncComponent(() => import('../components/icons/SimulationIcon.vue'))

const iconMap: Record<string, any> = {
  wallet: WalletIcon,
  dashboard: DashboardIcon,
  backtest: BacktestIcon,
  simulation: SimulationIcon
}

const navigationItems = [
  { name: 'Wallet', path: '/Wallet', icon: 'wallet' },
  { name: 'Dash', path: '/dash', icon: 'dashboard' },
  { name: 'Backtest', path: '/backtest', icon: 'backtest' },
  { name: 'Simulation', path: '/simulation', icon: 'simulation' }
]

const sidebarOpen = ref(false)
const windowWidth = ref(0)

const isMobile = computed(() => windowWidth.value < 768)

const getIcon = (iconName: string) => {
  return iconMap[iconName] || null
}

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const closeSidebar = () => {
  sidebarOpen.value = false
}

const closeSidebarOnMobile = () => {
  if (isMobile.value) {
    closeSidebar()
  }
}

const updateWindowWidth = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  updateWindowWidth()
  window.addEventListener('resize', updateWindowWidth)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateWindowWidth)
})
</script>

<style scoped>
/* Additional styles if needed */
</style>
