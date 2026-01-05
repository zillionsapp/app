<script setup lang="ts">
import anime from 'animejs';
import { onMounted, onUnmounted } from 'vue';

let observer: IntersectionObserver | null = null;

onMounted(() => {
  // Hero animation
  anime({
    targets: '.hero-title .letter',
    translateY: [100, 0],
    translateZ: 0,
    opacity: [0, 1],
    easing: "easeOutExpo",
    duration: 1400,
    delay: (el, i) => 300 + 30 * i
  });

  anime({
    targets: '.hero-subtitle',
    translateY: [50, 0],
    opacity: [0, 1],
    easing: "easeOutExpo",
    duration: 1000,
    delay: 1000
  });

  anime({
    targets: '.hero-buttons',
    translateY: [30, 0],
    opacity: [0, 1],
    easing: "easeOutExpo",
    duration: 800,
    delay: 1200
  });

  // Scroll animations
  const animateOnScroll = (entries: IntersectionObserverEntry[]) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target as HTMLElement;
        const animationType = target.dataset.animation;

        switch (animationType) {
          case 'fadeInUp':
            anime({
              targets: target,
              translateY: [50, 0],
              opacity: [0, 1],
              easing: "easeOutExpo",
              duration: 1000
            });
            break;
          case 'slideInLeft':
            anime({
              targets: target,
              translateX: [-100, 0],
              opacity: [0, 1],
              easing: "easeOutExpo",
              duration: 1000
            });
            break;
          case 'slideInRight':
            anime({
              targets: target,
              translateX: [100, 0],
              opacity: [0, 1],
              easing: "easeOutExpo",
              duration: 1000
            });
            break;
          case 'scaleIn':
            anime({
              targets: target,
              scale: [0.8, 1],
              opacity: [0, 1],
              easing: "easeOutExpo",
              duration: 1000
            });
            break;
          case 'staggerCards':
            anime({
              targets: target.querySelectorAll('.feature-card'),
              translateY: [50, 0],
              opacity: [0, 1],
              easing: "easeOutExpo",
              duration: 800,
              delay: anime.stagger(200)
            });
            break;
          case 'bounceIn':
            anime({
              targets: target,
              scale: [0.3, 1],
              opacity: [0, 1],
              easing: "easeOutElastic(1, .8)",
              duration: 1500
            });
            break;
          case 'rotateIn':
            anime({
              targets: target,
              rotate: [-180, 0],
              opacity: [0, 1],
              easing: "easeOutExpo",
              duration: 1000
            });
            break;
        }
      }
    });
  };

  observer = new IntersectionObserver(animateOnScroll, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  // Observe all elements with data-animation
  document.querySelectorAll('[data-animation]').forEach(el => {
    observer.observe(el);
  });

  // Floating elements animation
  const floatingElements = document.querySelectorAll('.floating');
  floatingElements.forEach((el, index) => {
    anime({
      targets: el,
      translateY: [0, -20, 0],
      easing: "easeInOutSine",
      duration: 3000 + index * 500,
      loop: true,
      delay: index * 200
    });
  });

  // Particle effect for hero background
  createParticles();
});

onUnmounted(() => {
  observer?.disconnect();
});

const createParticles = () => {
  const particleContainer = document.querySelector('.particle-container');
  if (!particleContainer) return;

  for (let i = 0; i < 50; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 10 + 's';
    particleContainer.appendChild(particle);
  }
};
</script>

<template>
  <div class="min-h-screen bg-base-100">

    <!-- Hero Section -->
    <section class="hero min-h-screen bg-gradient-to-br from-base-100 via-base-200 to-base-100 flex items-center justify-center relative overflow-hidden">
      <div class="particle-container absolute inset-0 pointer-events-none"></div>
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-secondary/20"></div>

      <div class="text-center z-10 p-5 max-w-6xl mx-auto">
        <div class="floating mb-8">
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary font-medium">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>
            {{ $t('production_ready') }}
          </div>
        </div>

        <h1 class="hero-title text-6xl md:text-9xl font-black mb-6 leading-tight bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          <span class="inline-block relative">
            <template v-for="(char, index) in $t('nuxt_brand').split('')" :key="index">
              <span class="letter inline-block">{{ char }}</span>
            </template>
          </span>
          <br />
          <span class="text-secondary">{{ $t('boilerplate_brand') }}</span>
        </h1>

        <p class="hero-subtitle py-6 text-xl md:text-3xl opacity-0 max-w-4xl mx-auto leading-relaxed">
          {{ $t('ultimate_starting_point') }}
        </p>

        <div class="hero-buttons flex flex-col md:flex-row gap-6 justify-center opacity-0">
          <NuxtLink to="/register" class="btn btn-primary btn-lg shadow-2xl shadow-primary/30 hover:scale-105 transition-transform">
            <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
            {{ $t('get_started') }}
          </NuxtLink>
          <NuxtLink to="#features" class="btn btn-outline btn-lg hover:scale-105 transition-transform">
            <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
            </svg>
            {{ $t('explore_features') }}
          </NuxtLink>
        </div>
      </div>

      <!-- Scroll indicator -->
      <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
        </svg>
      </div>
    </section>

    <!-- Features Overview -->
    <section id="features" class="py-32 bg-base-200 relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5"></div>
      <div class="absolute top-0 left-0 w-full h-full opacity-5">
        <div class="absolute top-10 left-10 w-32 h-32 bg-primary rounded-full blur-3xl"></div>
        <div class="absolute bottom-10 right-10 w-40 h-40 bg-secondary rounded-full blur-3xl"></div>
        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-accent rounded-full blur-3xl"></div>
      </div>
      <div class="container mx-auto px-4 relative z-10">
        <div data-animation="fadeInUp" class="text-center mb-20">
          <h2 class="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            {{ $t('core_features') }}
          </h2>
          <p class="text-xl md:text-2xl opacity-70 max-w-3xl mx-auto">
            {{ $t('everything_needed') }}
          </p>
        </div>

        <div data-animation="staggerCards" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <!-- Nuxt 4 -->
          <div class="feature-card card bg-base-100 shadow-2xl hover:shadow-primary/20 border border-base-content/5 hover:border-primary/20 transition-all duration-500 group cursor-pointer">
            <div class="card-body p-8">
              <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <h3 class="card-title text-2xl font-bold mb-4 group-hover:text-primary transition-colors">{{ $t('nuxt_4') }}</h3>
              <p class="text-base-content/70 mb-4 leading-relaxed">
                {{ $t('nuxt_4_desc') }}
              </p>
              <div class="flex flex-wrap gap-2">
                <div class="badge badge-primary">{{ $t('ssr_ready') }}</div>
                <div class="badge badge-outline">{{ $t('auto_imports') }}</div>
              </div>
            </div>
          </div>

          <!-- Vue 3 + TypeScript -->
          <div class="feature-card card bg-base-100 shadow-2xl hover:shadow-secondary/20 border border-base-content/5 hover:border-secondary/20 transition-all duration-500 group cursor-pointer">
            <div class="card-body p-8">
              <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12l8-4.5L12 3l-8 4.5L12 12zM12 12v9M4.5 7.5v9L12 21l7.5-4.5v-9L12 12"/>
                </svg>
              </div>
              <h3 class="card-title text-2xl font-bold mb-4 group-hover:text-secondary transition-colors">{{ $t('vue_3_typescript') }}</h3>
              <p class="text-base-content/70 mb-4 leading-relaxed">
                {{ $t('vue_3_typescript_desc') }}
              </p>
              <div class="flex flex-wrap gap-2">
                <div class="badge badge-secondary">{{ $t('type_safe') }}</div>
                <div class="badge badge-outline">{{ $t('composition_api') }}</div>
              </div>
            </div>
          </div>

          <!-- Tailwind + DaisyUI -->
          <div class="feature-card card bg-base-100 shadow-2xl hover:shadow-accent/20 border border-base-content/5 hover:border-accent/20 transition-all duration-500 group cursor-pointer">
            <div class="card-body p-8">
              <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <h3 class="card-title text-2xl font-bold mb-4 group-hover:text-accent transition-colors">{{ $t('tailwind_daisyui') }}</h3>
              <p class="text-base-content/70 mb-4 leading-relaxed">
                {{ $t('tailwind_daisyui_desc') }}
              </p>
              <div class="flex flex-wrap gap-2">
                <div class="badge badge-accent">{{ $t('responsive') }}</div>
                <div class="badge badge-outline">{{ $t('utility_first') }}</div>
              </div>
            </div>
          </div>

          <!-- Supabase Integration -->
          <div class="feature-card card bg-base-100 shadow-2xl hover:shadow-primary/20 border border-base-content/5 hover:border-primary/20 transition-all duration-500 group cursor-pointer">
            <div class="card-body p-8">
              <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.9 1.036c-.015-.986-1.36-1.198-1.835-.382C8.875 2.334 7.49 3.114 6.05 3.114c-1.44 0-2.825-.78-3.015-2.46C2.56-.162 1.215.05 1.2 1.036c-.03 1.946.847 3.59 2.365 4.774C5.086 7.006 6.475 7.52 8 7.52s2.914-.514 4.435-1.71c1.518-1.184 2.395-2.828 2.365-4.774z"/>
                  <path d="M8 9.5c-2.48 0-4.5 2.02-4.5 4.5v7c0 1.1.9 2 2 2h5c1.1 0 2-.9 2-2v-7c0-2.48-2.02-4.5-4.5-4.5z"/>
                </svg>
              </div>
              <h3 class="card-title text-2xl font-bold mb-4 group-hover:text-primary transition-colors">{{ $t('supabase_integration') }}</h3>
              <p class="text-base-content/70 mb-4 leading-relaxed">
                {{ $t('supabase_integration_desc') }}
              </p>
              <div class="flex flex-wrap gap-2">
                <div class="badge badge-primary">{{ $t('auth_ready') }}</div>
                <div class="badge badge-outline">{{ $t('real_time_db') }}</div>
              </div>
            </div>
          </div>

          <!-- Advanced Features -->
          <div class="feature-card card bg-base-100 shadow-2xl hover:shadow-secondary/20 border border-base-content/5 hover:border-secondary/20 transition-all duration-500 group cursor-pointer">
            <div class="card-body p-8">
              <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
              </div>
              <h3 class="card-title text-2xl font-bold mb-4 group-hover:text-secondary transition-colors">{{ $t('advanced_features') }}</h3>
              <p class="text-base-content/70 mb-4 leading-relaxed">
                {{ $t('advanced_features_desc') }}
              </p>
              <div class="flex flex-wrap gap-2">
                <div class="badge badge-secondary">{{ $t('i18n') }}</div>
                <div class="badge badge-outline">{{ $t('pwa') }}</div>
                <div class="badge badge-accent">{{ $t('testing') }}</div>
              </div>
            </div>
          </div>

          <!-- Developer Experience -->
          <div class="feature-card card bg-base-100 shadow-2xl hover:shadow-accent/20 border border-base-content/5 hover:border-accent/20 transition-all duration-500 group cursor-pointer">
            <div class="card-body p-8">
              <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                </svg>
              </div>
              <h3 class="card-title text-2xl font-bold mb-4 group-hover:text-accent transition-colors">{{ $t('developer_experience') }}</h3>
              <p class="text-base-content/70 mb-4 leading-relaxed">
                {{ $t('developer_experience_desc') }}
              </p>
              <div class="flex flex-wrap gap-2">
                <div class="badge badge-accent">{{ $t('hot_reload') }}</div>
                <div class="badge badge-outline">{{ $t('optimized') }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section id="pricing" class="py-32 bg-base-100 relative">
      <div class="absolute inset-0 bg-gradient-to-b from-base-100 to-base-200"></div>
      <div class="container mx-auto px-4 relative z-10">
        <div data-animation="fadeInUp" class="text-center mb-20">
          <h2 class="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {{ $t('simple_pricing') }}
          </h2>
          <p class="text-xl md:text-2xl opacity-70 max-w-3xl mx-auto">
            {{ $t('pricing_subtitle') }}
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <!-- Free Tier -->
          <div data-animation="slideInLeft" class="card bg-base-100 shadow-xl border-2 border-base-200 hover:border-primary/50 transition-all duration-300 group">
            <div class="card-body p-8">
              <div class="text-center mb-6">
                <h3 class="text-3xl font-bold mb-2">{{ $t('starter') }}</h3>
                <div class="text-5xl font-black text-primary mb-1">$0</div>
                <p class="text-base-content/60">{{ $t('forever_free') }}</p>
              </div>

              <ul class="space-y-4 mb-8">
                <li class="flex items-center gap-3">
                  <svg class="w-5 h-5 text-success flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  <span>{{ $t('nuxt_4') }} + {{ $t('vue_3_typescript') }} + TypeScript</span>
                </li>
                <li class="flex items-center gap-3">
                  <svg class="w-5 h-5 text-success flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  <span>{{ $t('tailwind_daisyui') }}</span>
                </li>
                <li class="flex items-center gap-3">
                  <svg class="w-5 h-5 text-success flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  <span>{{ $t('auth_ready') }}</span>
                </li>
                <li class="flex items-center gap-3">
                  <svg class="w-5 h-5 text-success flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  <span>{{ $t('community_support') }}</span>
                </li>
                <li class="flex items-center gap-3 opacity-50">
                  <svg class="w-5 h-5 text-base-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                  </svg>
                  <span class="line-through">Advanced Features</span>
                </li>
              </ul>

              <button class="btn btn-outline w-full group-hover:bg-primary group-hover:text-primary-content group-hover:border-primary transition-all">
                {{ $t('get_started') }}
              </button>
            </div>
          </div>

          <!-- Pro Tier -->
          <div data-animation="scaleIn" class="card bg-gradient-to-br from-primary/5 to-secondary/5 shadow-2xl border-4 border-primary scale-105 relative">
            <div class="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div class="badge badge-primary text-primary-content px-4 py-2 font-bold shadow-lg">Most Popular</div>
            </div>
            <div class="card-body p-8">
              <div class="text-center mb-6">
                <h3 class="text-3xl font-bold mb-2 text-primary">{{ $t('professional') }}</h3>
                <div class="text-5xl font-black text-primary mb-1">$29</div>
                <p class="text-base-content/60">{{ $t('per_month') }}</p>
              </div>

              <ul class="space-y-4 mb-8">
                <li class="flex items-center gap-3">
                  <svg class="w-5 h-5 text-success flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  <span>{{ $t('everything_in_starter') }}</span>
                </li>
                <li class="flex items-center gap-3">
                  <svg class="w-5 h-5 text-success flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  <span>{{ $t('supabase_integration') }}</span>
                </li>
                <li class="flex items-center gap-3">
                  <svg class="w-5 h-5 text-success flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  <span>{{ $t('pwa') }} & {{ $t('offline_support') }}</span>
                </li>
                <li class="flex items-center gap-3">
                  <svg class="w-5 h-5 text-success flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  <span>{{ $t('multi_language_support') }}</span>
                </li>
                <li class="flex items-center gap-3">
                  <svg class="w-5 h-5 text-success flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  <span>{{ $t('priority_support') }}</span>
                </li>
              </ul>

              <button class="btn btn-primary w-full shadow-lg hover:shadow-xl transition-all">
                {{ $t('start_free_trial') }}
              </button>
            </div>
          </div>

          <!-- Enterprise Tier -->
          <div data-animation="slideInRight" class="card bg-base-100 shadow-xl border-2 border-base-200 hover:border-accent/50 transition-all duration-300 group">
            <div class="card-body p-8">
              <div class="text-center mb-6">
                <h3 class="text-3xl font-bold mb-2">{{ $t('enterprise') }}</h3>
                <div class="text-5xl font-black text-accent mb-1">$99</div>
                <p class="text-base-content/60">{{ $t('per_month') }}</p>
              </div>

              <ul class="space-y-4 mb-8">
                <li class="flex items-center gap-3">
                  <svg class="w-5 h-5 text-success flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  <span>{{ $t('everything_in_professional') }}</span>
                </li>
                <li class="flex items-center gap-3">
                  <svg class="w-5 h-5 text-success flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  <span>{{ $t('custom_integrations') }}</span>
                </li>
                <li class="flex items-center gap-3">
                  <svg class="w-5 h-5 text-success flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  <span>{{ $t('dedicated_support') }}</span>
                </li>
                <li class="flex items-center gap-3">
                  <svg class="w-5 h-5 text-success flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  <span>{{ $t('advanced_analytics') }}</span>
                </li>
                <li class="flex items-center gap-3">
                  <svg class="w-5 h-5 text-success flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  <span>{{ $t('custom_development') }}</span>
                </li>
              </ul>

              <button class="btn btn-accent w-full group-hover:bg-accent group-hover:text-accent-content transition-all">
                {{ $t('contact_sales') }}
              </button>
            </div>
          </div>
        </div>

        <div data-animation="fadeInUp" class="text-center mt-16">
          <p class="text-lg opacity-70">
            {{ $t('trial_info') }}
          </p>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section class="py-32 bg-base-100">
      <div class="container mx-auto px-4">
        <div data-animation="fadeInUp" class="text-center mb-20">
          <h2 class="text-5xl md:text-7xl font-black mb-6">{{ $t('how_it_works') }}</h2>
          <p class="text-xl md:text-2xl opacity-70 max-w-3xl mx-auto">
            {{ $t('streamlined_setup') }}
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div data-animation="slideInLeft" class="text-center">
            <div class="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-3xl font-bold text-white shadow-2xl">
              1
            </div>
            <h3 class="text-3xl font-bold mb-4">{{ $t('clone_install') }}</h3>
            <p class="text-lg opacity-70 mb-6">
              {{ $t('clone_install_desc') }}
            </p>
            <div class="bg-base-200 rounded-lg p-4 font-mono text-sm">
              git clone [repo-url]<br>
              cd boilerplate<br>
              npm install
            </div>
          </div>

          <div data-animation="scaleIn" class="text-center">
            <div class="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-secondary to-secondary/60 flex items-center justify-center text-3xl font-bold text-white shadow-2xl">
              2
            </div>
            <h3 class="text-3xl font-bold mb-4">{{ $t('configure') }}</h3>
            <p class="text-lg opacity-70 mb-6">
              {{ $t('configure_desc') }}
            </p>
            <div class="bg-base-200 rounded-lg p-4 font-mono text-sm">
              cp .env.example .env<br>
              # Add your Supabase keys
            </div>
          </div>

          <div data-animation="slideInRight" class="text-center">
            <div class="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center text-3xl font-bold text-white shadow-2xl">
              3
            </div>
            <h3 class="text-3xl font-bold mb-4">{{ $t('develop') }}</h3>
            <p class="text-lg opacity-70 mb-6">
              {{ $t('develop_desc') }}
            </p>
            <div class="bg-base-200 rounded-lg p-4 font-mono text-sm">
              npm run dev<br>
              # Open http://localhost:3000
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Tech Stack Deep Dive -->
    <section class="py-32 bg-base-200">
      <div class="container mx-auto px-4">
        <div data-animation="fadeInUp" class="text-center mb-20">
          <h2 class="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            {{ $t('tech_stack') }}
          </h2>
          <p class="text-xl md:text-2xl opacity-70 max-w-3xl mx-auto">
            {{ $t('carefully_selected') }}
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-16">
          <!-- Frontend -->
          <div data-animation="slideInLeft">
            <h3 class="text-4xl font-bold mb-8 text-primary">{{ $t('frontend') }}</h3>
            <div class="space-y-6">
              <div class="flex items-center gap-4 p-4 bg-base-100 rounded-xl shadow-lg">
                <div class="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center">
                  <span class="text-white font-bold">N</span>
                </div>
                <div>
                  <h4 class="font-bold text-lg">Nuxt 4</h4>
                  <p class="opacity-70">Full-stack Vue framework with SSR</p>
                </div>
              </div>

              <div class="flex items-center gap-4 p-4 bg-base-100 rounded-xl shadow-lg">
                <div class="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
                  <span class="text-white font-bold">V</span>
                </div>
                <div>
                  <h4 class="font-bold text-lg">Vue 3</h4>
                  <p class="opacity-70">Progressive JavaScript framework</p>
                </div>
              </div>

              <div class="flex items-center gap-4 p-4 bg-base-100 rounded-xl shadow-lg">
                <div class="w-12 h-12 rounded-lg bg-cyan-500 flex items-center justify-center">
                  <span class="text-white font-bold">T</span>
                </div>
                <div>
                  <h4 class="font-bold text-lg">TypeScript</h4>
                  <p class="opacity-70">Type-safe JavaScript development</p>
                </div>
              </div>

              <div class="flex items-center gap-4 p-4 bg-base-100 rounded-xl shadow-lg">
                <div class="w-12 h-12 rounded-lg bg-teal-500 flex items-center justify-center">
                  <span class="text-white font-bold">TW</span>
                </div>
                <div>
                  <h4 class="font-bold text-lg">Tailwind CSS</h4>
                  <p class="opacity-70">Utility-first CSS framework</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Backend & Tools -->
          <div data-animation="slideInRight">
            <h3 class="text-4xl font-bold mb-8 text-secondary">{{ $t('backend_tools') }}</h3>
            <div class="space-y-6">
              <div class="flex items-center gap-4 p-4 bg-base-100 rounded-xl shadow-lg">
                <div class="w-12 h-12 rounded-lg bg-emerald-500 flex items-center justify-center">
                  <span class="text-white font-bold">S</span>
                </div>
                <div>
                  <h4 class="font-bold text-lg">Supabase</h4>
                  <p class="opacity-70">Backend-as-a-Service with Auth & Database</p>
                </div>
              </div>

              <div class="flex items-center gap-4 p-4 bg-base-100 rounded-xl shadow-lg">
                <div class="w-12 h-12 rounded-lg bg-purple-500 flex items-center justify-center">
                  <span class="text-white font-bold">P</span>
                </div>
                <div>
                  <h4 class="font-bold text-lg">Pinia</h4>
                  <p class="opacity-70">Intuitive state management for Vue</p>
                </div>
              </div>

              <div class="flex items-center gap-4 p-4 bg-base-100 rounded-xl shadow-lg">
                <div class="w-12 h-12 rounded-lg bg-orange-500 flex items-center justify-center">
                  <span class="text-white font-bold">V</span>
                </div>
                <div>
                  <h4 class="font-bold text-lg">Vitest</h4>
                  <p class="opacity-70">Fast unit testing framework</p>
                </div>
              </div>

              <div class="flex items-center gap-4 p-4 bg-base-100 rounded-xl shadow-lg">
                <div class="w-12 h-12 rounded-lg bg-pink-500 flex items-center justify-center">
                  <span class="text-white font-bold">PW</span>
                </div>
                <div>
                  <h4 class="font-bold text-lg">Playwright</h4>
                  <p class="opacity-70">End-to-end testing framework</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-32 bg-gradient-to-r from-primary via-secondary to-accent text-white relative overflow-hidden">
      <div class="absolute inset-0 bg-black/20"></div>
      <div class="container mx-auto px-4 relative z-10 text-center">
        <div data-animation="bounceIn">
          <h2 class="text-5xl md:text-7xl font-black mb-8">
            {{ $t('ready_to_build') }}
          </h2>
          <p class="text-xl md:text-3xl mb-12 opacity-90 max-w-4xl mx-auto">
            {{ $t('join_thousands') }}
          </p>
          <div class="flex flex-col md:flex-row gap-6 justify-center">
            <NuxtLink to="/register" class="btn btn-neutral btn-lg shadow-2xl hover:scale-105 transition-transform">
              <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
              {{ $t('start_building_now') }}
            </NuxtLink>
            <a href="https://github.com/nujinDevelopment/boilerplate" target="_blank" class="btn btn-outline btn-lg hover:scale-105 transition-transform">
              <svg class="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              {{ $t('view_on_github') }}
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-base-100 border-t border-base-200">
      <!-- Main Footer Content -->
      <div class="container mx-auto px-4 py-16">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <!-- Brand Section -->
          <div class="lg:col-span-1">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div>
                <h3 class="text-2xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  NuxtBoilerplate
                </h3>
                <p class="text-sm opacity-70">Production Ready</p>
              </div>
            </div>
            <p class="text-base-content/70 mb-6 leading-relaxed">
              {{ $t('brand_description') }}
            </p>
            <div class="flex gap-4">
              <a href="https://github.com/nujinDevelopment/boilerplate" target="_blank" class="btn btn-circle btn-ghost hover:bg-primary/10 hover:text-primary">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
              <a href="#" class="btn btn-circle btn-ghost hover:bg-secondary/10 hover:text-secondary">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              <a href="#" class="btn btn-circle btn-ghost hover:bg-accent/10 hover:text-accent">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>

          <!-- Quick Links -->
          <div>
            <h4 class="text-lg font-bold mb-6 text-primary">{{ $t('quick_links') }}</h4>
            <ul class="space-y-3">
              <li>
                <NuxtLink to="#features" class="text-base-content/70 hover:text-primary transition-colors hover:translate-x-1 transform duration-200 inline-block">
                  {{ $t('features_nav') }}
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="#pricing" class="text-base-content/70 hover:text-primary transition-colors hover:translate-x-1 transform duration-200 inline-block">
                  {{ $t('pricing_nav') }}
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/register" class="text-base-content/70 hover:text-primary transition-colors hover:translate-x-1 transform duration-200 inline-block">
                  {{ $t('get_started') }}
                </NuxtLink>
              </li>
              <li>
                <a href="https://github.com/nujinDevelopment/boilerplate" target="_blank" class="text-base-content/70 hover:text-primary transition-colors hover:translate-x-1 transform duration-200 inline-block">
                  {{ $t('documentation') }}
                </a>
              </li>
            </ul>
          </div>

          <!-- Technologies -->
          <div>
            <h4 class="text-lg font-bold mb-6 text-secondary">{{ $t('technologies') }}</h4>
            <div class="grid grid-cols-2 gap-3">
              <div class="flex items-center gap-2 p-2 bg-base-200 rounded-lg hover:bg-primary/5 transition-colors">
                <div class="w-6 h-6 rounded bg-green-500 flex items-center justify-center">
                  <span class="text-xs text-white font-bold">N</span>
                </div>
                <span class="text-sm font-medium">Nuxt 4</span>
              </div>
              <div class="flex items-center gap-2 p-2 bg-base-200 rounded-lg hover:bg-secondary/5 transition-colors">
                <div class="w-6 h-6 rounded bg-blue-500 flex items-center justify-center">
                  <span class="text-xs text-white font-bold">V</span>
                </div>
                <span class="text-sm font-medium">Vue 3</span>
              </div>
              <div class="flex items-center gap-2 p-2 bg-base-200 rounded-lg hover:bg-accent/5 transition-colors">
                <div class="w-6 h-6 rounded bg-cyan-500 flex items-center justify-center">
                  <span class="text-xs text-white font-bold">T</span>
                </div>
                <span class="text-sm font-medium">TypeScript</span>
              </div>
              <div class="flex items-center gap-2 p-2 bg-base-200 rounded-lg hover:bg-primary/5 transition-colors">
                <div class="w-6 h-6 rounded bg-teal-500 flex items-center justify-center">
                  <span class="text-xs text-white font-bold">TW</span>
                </div>
                <span class="text-sm font-medium">Tailwind</span>
              </div>
            </div>
          </div>

          <!-- Newsletter -->
          <div>
            <h4 class="text-lg font-bold mb-6 text-accent">{{ $t('stay_updated') }}</h4>
            <p class="text-base-content/70 mb-4 text-sm">
              {{ $t('latest_updates') }}
            </p>
            <div class="space-y-3">
              <input type="email" :placeholder="$t('enter_email')" class="input input-bordered w-full bg-base-200 border-base-300 focus:border-primary focus:outline-none" />
              <button class="btn btn-primary btn-block hover:scale-105 transition-transform">
                {{ $t('subscribe') }}
              </button>
            </div>
            <div class="flex items-center gap-2 mt-4">
              <LanguageSwitcher />
              <span class="text-sm opacity-70">{{ $t('language') }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Footer -->
      <div class="border-t border-base-200 bg-base-200/50">
        <div class="container mx-auto px-4 py-6">
          <div class="flex flex-col md:flex-row justify-between items-center gap-4">
            <div class="flex items-center gap-4 text-sm opacity-70">
              <span>{{ $t('copyright') }}</span>
            </div>
            <div class="flex items-center gap-6 text-sm">
              <NuxtLink to="/terms" class="opacity-70 hover:text-primary transition-colors">
                {{ $t('terms_of_service') }}
              </NuxtLink>
              <NuxtLink to="/privacy" class="opacity-70 hover:text-primary transition-colors">
                {{ $t('privacy_policy') }}
              </NuxtLink>
              <a href="https://github.com/nujinDevelopment/boilerplate" target="_blank" class="opacity-70 hover:text-primary transition-colors">
                GitHub
              </a>
            </div>
          </div>
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
