<template>
  <header class="navbar bg-base-100/95 backdrop-blur-md sticky top-0 z-50 shadow-lg">
    <div class="navbar-start">
      <div class="dropdown">
        <label tabindex="0" class="btn btn-ghost btn-circle lg:hidden hover:bg-primary/10">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h8m-8 6h16" />
          </svg>
        </label>
        <ul tabindex="0" class="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow-xl bg-base-100 rounded-box w-52 border border-base-200/50">
          <li><NuxtLink to="/#features" class="hover:bg-primary/10 rounded-lg">{{ $t('features_nav') }}</NuxtLink></li>
          <li><NuxtLink to="/#pricing" class="hover:bg-primary/10 rounded-lg">{{ $t('pricing_nav') }}</NuxtLink></li>
        </ul>
      </div>
      <NuxtLink to="/" class="btn btn-ghost normal-case text-xl font-black bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent hover:scale-105 transition-transform">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span>NuxtBoilerplate</span>
        </div>
      </NuxtLink>
    </div>
    <div class="navbar-center hidden lg:flex">
      <ul class="menu menu-horizontal px-1 gap-2">
        <li>
          <NuxtLink to="/#features" class="btn btn-ghost hover:bg-primary/10 hover:text-primary transition-colors rounded-lg font-medium">
            {{ $t('features_nav') }}
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/#pricing" class="btn btn-ghost hover:bg-primary/10 hover:text-primary transition-colors rounded-lg font-medium">
            {{ $t('pricing_nav') }}
          </NuxtLink>
        </li>
      </ul>
    </div>
    <div class="navbar-end gap-3">
      <div class="hidden md:flex items-center gap-2">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>
      <div class="divider divider-horizontal hidden md:flex"></div>
      <NuxtLink to="/login" class="btn btn-ghost btn-sm hover:bg-base-200 transition-colors">
        {{ $t('login') }}
      </NuxtLink>
      <NuxtLink to="/register" class="btn btn-primary btn-sm shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105 transition-all">
        {{ $t('get_started') }}
      </NuxtLink>
    </div>
  </header>
</template>
