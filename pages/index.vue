<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const { setLocale, locale, t } = useI18n()
const route = useRoute()

const EMBEDDED_LOGO = '/logo.jpg'
const logoToUse = computed(() => EMBEDDED_LOGO)

// Check if user has an invite code in the URL or localStorage
const hasInvite = computed(() => {
  const urlInvite = route.query.invite
  const storedInvite = process.client ? localStorage.getItem('inviteCode') : null

  // If there's an invite in the URL, store it
  if (urlInvite && process.client) {
    localStorage.setItem('inviteCode', urlInvite as string)
  }

  return !!(urlInvite || storedInvite)
})

const legacyType = ref('legacy')
const modernType = ref('modern')

// Strategy selection state
const selectedStrategy = ref<'trend' | 'signals' | 'confirm' | 'risk' | 'size'>('trend')
</script>

<template>
  <div class="min-h-screen flex flex-col bg-base-100 text-base-content selection:bg-primary/10 overflow-x-hidden">
    <!-- Background Accents -->
    <div class="pointer-events-none fixed inset-0 opacity-40">
      <div class="absolute -top-24 -right-24 w-[40rem] h-[40rem] rounded-full blur-3xl bg-gradient-to-r from-primary/30 via-secondary/30 to-accent/30 animate-gradient"></div>
      <div class="absolute -bottom-24 -left-24 w-[32rem] h-[32rem] rounded-full blur-3xl bg-gradient-to-r from-accent/20 via-secondary/20 to-primary/20 animate-gradient [animation-delay:2s]"></div>
    </div>

    <!-- Navbar -->
     <div class="w-full flex justify-center">
      <header class="navbar max-w-7xl mx-auto w-full px-4 lg:px-6 py-2 mt-8 backdrop-blur-sm bg-base-200/50 fixed rounded-2xl top-0 z-50 border border-base-300 shadow">
        <div class="navbar-start gap-3">
          <img :src="logoToUse" alt="Zillions" class="h-8 w-auto rounded-full" />
          <a class="font-semibold tracking-tight text-lg bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent animate-gradient">Zillions<span class="text-primary"> </span></a>
        </div>
        <div class="navbar-center hidden md:flex">
          <ul class="menu menu-horizontal px-1">
            <li><a href="#features">{{ $t('nav.features') }}</a></li>
            <li><a href="#how">{{ $t('nav.how') }}</a></li>
            <li><a href="#tech">{{ $t('nav.tech') }}</a></li>
            <li><a href="#faq">{{ $t('nav.faq') }}</a></li>
          </ul>
        </div>
        <div class="navbar-end flex gap-2">
          <div class="hidden md:flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
          <div v-if="hasInvite" class="flex gap-2">
            <NuxtLink :to="route.query.invite ? `/sign-up?invite=${route.query.invite}` : '/sign-up'" class="btn bg-gradient-to-r from-primary via-secondary to-accent animate-gradient text-base-100 border-0 btn-sm rounded-xl">{{ $t('nav.signUp') }}</NuxtLink>
            <NuxtLink :to="route.query.invite ? `/sign-in?invite=${route.query.invite}` : '/sign-in'" class="btn btn-ghost btn-sm">{{ $t('nav.signIn') }}</NuxtLink>
          </div>
        </div>
      </header>
     </div>

    <!-- Hero -->
    <section class="w-full pt-16">
      <div class="max-w-7xl mx-auto px-4 lg:px-6 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center py-10 lg:py-20">
        <div>
          <div class="badge badge-outline badge-lg text-xs md:text-sm mb-6 animate-fade-in">{{ $t('hero.badge') }}</div>
          <h1 class="text-4xl md:text-6xl/tight font-bold tracking-tight animate-slide-up">
            {{ $t('hero.title') }} <span class="bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent animate-gradient">{{ $t('hero.titleHighlight') }}</span>
          </h1>
          <p class="mt-6 text-base md:text-lg text-base-content/80 leading-relaxed animate-fade-in">
            {{ $t('hero.description') }}
          </p>

          <div v-if="hasInvite" class="mt-8 flex flex-wrap items-center gap-4 animate-slide-up">
            <NuxtLink :to="route.query.invite ? `/sign-up?invite=${route.query.invite}` : '/sign-up'" class="btn bg-gradient-to-r from-primary via-secondary to-accent animate-gradient text-base-100 border-0 btn-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">{{ $t('nav.signUp') }}</NuxtLink>
            <NuxtLink :to="route.query.invite ? `/sign-in?invite=${route.query.invite}` : '/sign-in'" class="btn btn-ghost btn-lg hover:underline transition-all duration-300">{{ $t('nav.signIn') }}</NuxtLink>
          </div>

        </div>

        <div class="relative">
          <div class="mockup-window border border-base-300 rounded-3xl overflow-hidden shadow-2xl bg-base-100">
            <WalletPreview/>
          </div>
          <div class="absolute -right-6 -bottom-6 hidden md:block">
            <div class="badge badge-outline">Preview</div>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="max-w-7xl mx-auto px-4 lg:px-6 my-16">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
          <div class="stat bg-base-200/50 rounded-2xl p-4 md:p-6 hover:border-primary/20 transition-all duration-300">
            <div class="stat-title text-xs uppercase tracking-wider opacity-70 text-base-content/50">{{ $t('stats.noExpertise') }}</div>
            <div class="stat-value text-lg md:text-2xl mt-1 font-bold text-base-content">{{ $t('stats.noExpertiseValue') }}</div>
          </div>
          <div class="stat bg-base-200/50 rounded-2xl p-4 md:p-6 hover:border-primary/20 transition-all duration-300">
            <div class="stat-title text-xs uppercase tracking-wider opacity-70 text-base-content/50">{{ $t('stats.onChain') }}</div>
            <div class="stat-value text-lg md:text-2xl mt-1 font-bold text-base-content">{{ $t('stats.onChainValue') }}</div>
          </div>
          <div class="stat bg-base-200/50 rounded-2xl p-4 md:p-6 hover:border-primary/20 transition-all duration-300">
            <div class="stat-title text-xs uppercase tracking-wider opacity-70 text-base-content/50">{{ $t('stats.adaptive') }}</div>
            <div class="stat-value text-lg md:text-2xl mt-1 font-bold text-base-content">{{ $t('stats.adaptiveValue') }}</div>
          </div>
          <div class="stat bg-base-200/50 rounded-2xl p-4 md:p-6 hover:border-primary/20 transition-all duration-300">
            <div class="stat-title text-xs uppercase tracking-wider opacity-70 text-base-content/50">{{ $t('stats.handsFree') }}</div>
            <div class="stat-value text-lg md:text-2xl mt-1 font-bold text-base-content">{{ $t('stats.handsFreeValue') }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Feature grid -->
    <section id="features" class="py-16 lg:py-24">
      <div class="max-w-7xl mx-auto px-4 lg:px-6">
        <h2 class="text-2xl md:text-3xl font-bold">{{ $t('features.title') }}</h2>
        <p class="mt-2 text-base-content/70">{{ $t('features.subtitle') }}</p>
        <div class="mt-10 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <article class="card bg-base-200/50 border border-base-300 hover:translate-y-[-2px] hover:shadow-lg transition-all duration-300">
            <div class="card-body">
              <div class="badge bg-gradient-to-r from-primary via-secondary to-accent animate-gradient text-base-100 badge-outline mb-2">{{ $t('features.metaTrading.badge') }}</div>
              <h3 class="card-title text-xl">{{ $t('features.metaTrading.title') }}</h3>
              <p class="text-sm opacity-80">{{ $t('features.metaTrading.description') }}</p>
            </div>
          </article>
          <article class="card bg-base-200/50 border border-base-300 hover:translate-y-[-2px] hover:shadow-lg transition-all duration-300">
            <div class="card-body">
              <div class="badge bg-gradient-to-r from-primary via-secondary to-accent animate-gradient text-base-100 badge-outline mb-2">{{ $t('features.onChainTransparent.badge') }}</div>
              <h3 class="card-title text-xl">{{ $t('features.onChainTransparent.title') }}</h3>
              <p class="text-sm opacity-80">{{ $t('features.onChainTransparent.description') }}</p>
            </div>
          </article>
          <article class="card bg-base-200/50 border border-base-300 hover:translate-y-[-2px] hover:shadow-lg transition-all duration-300">
            <div class="card-body">
              <div class="badge bg-gradient-to-r from-primary via-secondary to-accent animate-gradient text-base-100 badge-outline mb-2">{{ $t('features.handsFreeSimplicity.badge') }}</div>
              <h3 class="card-title text-xl">{{ $t('features.handsFreeSimplicity.title') }}</h3>
              <p class="text-sm opacity-80">{{ $t('features.handsFreeSimplicity.description') }}</p>
            </div>
          </article>
          <article class="card bg-base-200/50 border border-base-300 hover:translate-y-[-2px] hover:shadow-lg transition-all duration-300">
            <div class="card-body">
              <div class="badge bg-gradient-to-r from-primary via-secondary to-accent animate-gradient text-base-100 badge-outline mb-2">{{ $t('features.riskAware.badge') }}</div>
              <h3 class="card-title text-xl">{{ $t('features.riskAware.title') }}</h3>
              <p class="text-sm opacity-80">{{ $t('features.riskAware.description') }}</p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section id="how" class="py-14 lg:py-20">
      <div class="max-w-7xl mx-auto px-4 lg:px-6">
        <h2 class="text-2xl md:text-3xl font-bold">{{ $t('howItWorks.title') }}</h2>
        <div class="mt-8 grid lg:grid-cols-3 gap-6">
          <div class="card bg-base-200/50 border border-base-300 hover:shadow-lg transition-all duration-300">
            <div class="card-body">
              <div class="badge bg-gradient-to-r from-primary via-secondary to-accent animate-gradient text-base-100 badge-lg">{{ $t('howItWorks.step1.badge') }}</div>
              <h3 class="card-title mt-3 text-2xl">{{ $t('howItWorks.step1.title') }}</h3>
              <p class="text-sm opacity-80">{{ $t('howItWorks.step1.description') }}</p>
            </div>
          </div>
          <div class="card bg-base-200/50 border border-base-300 hover:shadow-lg transition-all duration-300">
            <div class="card-body">
              <div class="badge bg-gradient-to-r from-primary via-secondary to-accent animate-gradient text-base-100 badge-lg">{{ $t('howItWorks.step2.badge') }}</div>
              <h3 class="card-title mt-3 text-2xl">{{ $t('howItWorks.step2.title') }}</h3>
              <p class="text-sm opacity-80">{{ $t('howItWorks.step2.description') }}</p>
            </div>
          </div>
          <div class="card bg-base-200/50 border border-base-300 hover:shadow-lg transition-all duration-300">
            <div class="card-body">
              <div class="badge bg-gradient-to-r from-primary via-secondary to-accent animate-gradient text-base-100 badge-lg">{{ $t('howItWorks.step3.badge') }}</div>
              <h3 class="card-title mt-3 text-2xl">{{ $t('howItWorks.step3.title') }}</h3>
              <p class="text-sm opacity-80">{{ $t('howItWorks.step3.description') }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Technology (high level) -->
    <section id="tech" class="py-14 lg:py-20 bg-base-100/40">
      <div class="max-w-7xl mx-auto px-4 lg:px-6">
        <h2 class="text-2xl md:text-3xl font-bold">{{ $t('technology.title') }}</h2>
        <p class="mt-2 text-base-content/70">{{ $t('technology.subtitle') }}</p>

        <div class="mt-8 grid md:grid-cols-2 gap-6">
          <ul class="timeline timeline-snap-icon max-md:timeline-compact timeline-vertical">
            <li>
              <div class="timeline-middle">
                <span class="badge bg-gradient-to-r from-primary via-secondary to-accent animate-gradient text-base-100 badge-lg cursor-pointer transition-all duration-300 hover:scale-110" @click="selectedStrategy = 'trend'">Trend</span>
              </div>
              <div class="timeline-end timeline-box bg-base-200/50 border border-base-300 hover:shadow-lg transition-all duration-300 cursor-pointer" :class="{ 'border-primary bg-primary/5': selectedStrategy === 'trend' }" @click="selectedStrategy = 'trend'">
                <div class="font-medium text-lg">{{ $t('technology.trend.title') }}</div>
                <div class="text-sm opacity-80 mt-1">{{ $t('technology.trend.description') }}</div>
              </div>
              <hr class="bg-primary/20"/>
            </li>
            <li>
              <div class="timeline-middle">
                <span class="badge bg-gradient-to-r from-primary via-secondary to-accent animate-gradient text-base-100 badge-lg cursor-pointer transition-all duration-300 hover:scale-110" @click="selectedStrategy = 'signals'">Signals</span>
              </div>
              <div class="timeline-end timeline-box bg-base-200/50 border border-base-300 hover:shadow-lg transition-all duration-300 cursor-pointer" :class="{ 'border-primary bg-primary/5': selectedStrategy === 'signals' }" @click="selectedStrategy = 'signals'">
                <div class="font-medium text-lg">{{ $t('technology.signals.title') }}</div>
                <div class="text-sm opacity-80 mt-1">{{ $t('technology.signals.description') }}</div>
              </div>
              <hr class="bg-primary/20"/>
            </li>
            <li>
              <div class="timeline-middle">
                <span class="badge bg-gradient-to-r from-primary via-secondary to-accent animate-gradient text-base-100 badge-lg cursor-pointer transition-all duration-300 hover:scale-110" @click="selectedStrategy = 'confirm'">Confirm</span>
              </div>
              <div class="timeline-end timeline-box bg-base-200/50 border border-base-300 hover:shadow-lg transition-all duration-300 cursor-pointer" :class="{ 'border-primary bg-primary/5': selectedStrategy === 'confirm' }" @click="selectedStrategy = 'confirm'">
                <div class="font-medium text-lg">{{ $t('technology.confirm.title') }}</div>
                <div class="text-sm opacity-80 mt-1">{{ $t('technology.confirm.description') }}</div>
              </div>
              <hr class="bg-primary/20"/>
            </li>
            <li>
              <div class="timeline-middle">
                <span class="badge bg-gradient-to-r from-primary via-secondary to-accent animate-gradient text-base-100 badge-lg cursor-pointer transition-all duration-300 hover:scale-110" @click="selectedStrategy = 'risk'">Risk</span>
              </div>
              <div class="timeline-end timeline-box bg-base-200/50 border border-base-300 hover:shadow-lg transition-all duration-300 cursor-pointer" :class="{ 'border-primary bg-primary/5': selectedStrategy === 'risk' }" @click="selectedStrategy = 'risk'">
                <div class="font-medium text-lg">{{ $t('technology.risk.title') }}</div>
                <div class="text-sm opacity-80 mt-1">{{ $t('technology.risk.description') }}</div>
              </div>
              <hr class="bg-primary/20"/>
            </li>
            <li>
              <div class="timeline-middle">
                <span class="badge bg-gradient-to-r from-primary via-secondary to-accent animate-gradient text-base-100 badge-lg cursor-pointer transition-all duration-300 hover:scale-110" @click="selectedStrategy = 'size'">Size</span>
              </div>
              <div class="timeline-end timeline-box bg-base-200/50 border border-base-300 hover:shadow-lg transition-all duration-300 cursor-pointer" :class="{ 'border-primary bg-primary/5': selectedStrategy === 'size' }" @click="selectedStrategy = 'size'">
                <div class="font-medium text-lg">{{ $t('technology.size.title') }}</div>
                <div class="text-sm opacity-80 mt-1">{{ $t('technology.size.description') }}</div>
              </div>
            </li>
          </ul>

          <div class="card bg-base-200/50 border border-base-300 hover:shadow-lg transition-all duration-300">
            <div class="card-body">
              <div class="mb-4">
                <h3 class="card-title text-2xl">{{ $t(`technology.${selectedStrategy}.title`) }}</h3>
              </div>

              <div class="mt-6 space-y-4">
                <div class="group">
                  <div class="flex items-start gap-4 p-4 bg-base-100/30 rounded-xl border border-base-300/30 hover:border-primary/30 hover:bg-base-100/50 transition-all duration-300 hover:translate-x-2">
                    <div class="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mt-1">
                      <div class="w-3 h-3 bg-primary rounded-full"></div>
                    </div>
                    <div class="flex-1">
                      <p class="text-sm font-medium text-base-content/90 leading-relaxed">{{ $t(`technology.${selectedStrategy}.benefits.1`) }}</p>
                    </div>
                  </div>
                </div>
                <div class="group">
                  <div class="flex items-start gap-4 p-4 bg-base-100/30 rounded-xl border border-base-300/30 hover:border-primary/30 hover:bg-base-100/50 transition-all duration-300 hover:translate-x-2">
                    <div class="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mt-1">
                      <div class="w-3 h-3 bg-primary rounded-full"></div>
                    </div>
                    <div class="flex-1">
                      <p class="text-sm font-medium text-base-content/90 leading-relaxed">{{ $t(`technology.${selectedStrategy}.benefits.2`) }}</p>
                    </div>
                  </div>
                </div>
                <div class="group">
                  <div class="flex items-start gap-4 p-4 bg-base-100/30 rounded-xl border border-base-300/30 hover:border-primary/30 hover:bg-base-100/50 transition-all duration-300 hover:translate-x-2">
                    <div class="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mt-1">
                      <div class="w-3 h-3 bg-primary rounded-full"></div>
                    </div>
                    <div class="flex-1">
                      <p class="text-sm font-medium text-base-content/90 leading-relaxed">{{ $t(`technology.${selectedStrategy}.benefits.3`) }}</p>
                    </div>
                  </div>
                </div>
                <div class="group">
                  <div class="flex items-start gap-4 p-4 bg-base-100/30 rounded-xl border border-base-300/30 hover:border-primary/30 hover:bg-base-100/50 transition-all duration-300 hover:translate-x-2">
                    <div class="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mt-1">
                      <div class="w-3 h-3 bg-primary rounded-full"></div>
                    </div>
                    <div class="flex-1">
                      <p class="text-sm font-medium text-base-content/90 leading-relaxed">{{ $t(`technology.${selectedStrategy}.benefits.4`) }}</p>
                    </div>
                  </div>
                </div>
                <div class="group">
                  <div class="flex items-start gap-4 p-4 bg-base-100/30 rounded-xl border border-base-300/30 hover:border-primary/30 hover:bg-base-100/50 transition-all duration-300 hover:translate-x-2">
                    <div class="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mt-1">
                      <div class="w-3 h-3 bg-primary rounded-full"></div>
                    </div>
                    <div class="flex-1">
                      <p class="text-sm font-medium text-base-content/90 leading-relaxed">{{ $t(`technology.${selectedStrategy}.benefits.5`) }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Strategy-specific alerts -->
              <div class="alert alert-info text-base-content bg-base-100/50 backdrop-blur-sm mt-6 border border-info/20">
                <span>{{ $t(`technology.${selectedStrategy}.alert`) }}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- Comparison -->
    <section class="py-14 lg:py-20">
      <div class="max-w-7xl mx-auto px-4 lg:px-6">
        <h2 class="text-2xl md:text-3xl font-bold">{{ $t('comparison.title') }}</h2>
        <div class="mt-6 grid md:grid-cols-2 gap-6">
          <div class="card bg-base-200/50 border border-base-300 hover:shadow-lg transition-all duration-300">
            <div class="card-body">
              <div class="badge badge-outline mb-2">{{ $t('comparison.legacy.badge') }}</div>
              <h3 class="card-title text-xl">{{ $t('comparison.legacy.title') }}</h3>
              <ul class="list-disc ms-5 text-sm opacity-80 space-y-3 mt-4">
                <li class="hover:translate-x-1 transition-transform duration-300">{{ $t(`comparison.legacy.items.1`) }}</li>
                <li class="hover:translate-x-1 transition-transform duration-300">{{ $t(`comparison.legacy.items.2`) }}</li>
                <li class="hover:translate-x-1 transition-transform duration-300">{{ $t(`comparison.legacy.items.3`) }}</li>
              </ul>
            </div>
          </div>
          <div class="card bg-base-200/50 border-2 border-primary hover:shadow-lg transition-all duration-300">
            <div class="card-body">
              <div class="badge bg-gradient-to-r from-primary via-secondary to-accent animate-gradient text-base-100 mb-2">{{ $t('comparison.modern.badge') }}</div>
              <h3 class="card-title text-xl">{{ $t('comparison.modern.title') }}</h3>
              <ul class="list-disc ms-5 text-sm opacity-90 space-y-3 mt-4">
                <li class="hover:translate-x-1 transition-transform duration-300">{{ $t(`comparison.modern.items.1`) }}</li>
                <li class="hover:translate-x-1 transition-transform duration-300">{{ $t(`comparison.modern.items.2`) }}</li>
                <li class="hover:translate-x-1 transition-transform duration-300">{{ $t(`comparison.modern.items.3`) }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section id="faq" class="py-20 lg:py-28">
      <div class="max-w-4xl mx-auto px-4 lg:px-6">
        <h2 class="text-2xl md:text-3xl font-bold text-center">{{ $t('faq.title') }}</h2>
        <p class="mt-3 text-base-content/70 text-center">{{ $t('faq.subtitle') }}</p>
        <div class="mt-10 join join-vertical w-full bg-base-200 rounded rounded-2xl">
          <div class="collapse collapse-arrow join-item border border-base-300 hover:bg-base-100/50 transition-all duration-300 rounded-t-xl">
            <input type="checkbox" />
            <div class="collapse-title text-md font-medium">{{ $t('faq.q1') }}</div>
            <div class="collapse-content text-sm opacity-80">
              {{ $t('faq.a1') }}
            </div>
          </div>
          <div class="collapse collapse-arrow join-item border border-base-300 hover:bg-base-100/50 transition-all duration-300">
            <input type="checkbox" />
            <div class="collapse-title text-md font-medium">{{ $t('faq.q2') }}</div>
            <div class="collapse-content text-sm opacity-80">
              {{ $t('faq.a2') }}
            </div>
          </div>
          <div class="collapse collapse-arrow join-item border border-base-300 hover:bg-base-100/50 transition-all duration-300">
            <input type="checkbox" />
            <div class="collapse-title text-md font-medium">{{ $t('faq.q3') }}</div>
            <div class="collapse-content text-sm opacity-80">
              {{ $t('faq.a3') }}
            </div>
          </div>
          <div class="collapse collapse-arrow join-item border border-base-300 hover:bg-base-100/50 transition-all duration-300">
            <input type="checkbox" />
            <div class="collapse-title text-md font-medium">{{ $t('faq.q4') }}</div>
            <div class="collapse-content text-sm opacity-80">
              {{ $t('faq.a4') }}
            </div>
          </div>
          <div class="collapse collapse-arrow join-item border border-base-300 hover:bg-base-100/50 transition-all duration-300 rounded-b-xl">
            <input type="checkbox" />
            <div class="collapse-title text-md font-medium">{{ $t('faq.q5') }}</div>
            <div class="collapse-content text-sm opacity-80">
              {{ $t('faq.a5') }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="mt-auto border-t border-base-300 bg-base-100/30">
      <div class="max-w-7xl mx-auto px-4 lg:px-6 py-10 grid md:grid-cols-2 gap-6">
        <div>
          <div class="flex items-center gap-3">
            <img :src="logoToUse" alt="Zillions" class="h-6 w-auto rounded-full" />
            <span class="font-semibold">Zillions</span>
          </div>
          <p class="text-xs opacity-70 mt-3">
            {{ $t('footer.description') }}
          </p>
          <p class="text-xs opacity-60 mt-2">{{ $t('footer.copyright', { year: new Date().getFullYear() }) }}</p>
        </div>
        <div class="text-xs opacity-70">
          <div class="font-semibold mb-2">{{ $t('footer.disclosures') }}</div>
          <p>
            {{ $t('footer.disclaimer') }}
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.letter {
  transform-origin: 0 100%;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: rgba(59, 130, 246, 0.5);
  border-radius: 50%;
  animation: float 10s infinite linear;
}

@keyframes float {
  0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
}

.floating {
  animation: float-gentle 6s ease-in-out infinite;
}

@keyframes float-gentle {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}
</style>
