<template>
  <div class="container mx-auto px-4 py-16 max-w-4xl">
    <div class="prose lg:prose-xl">
        <h1>{{ $t('terms_title') }}</h1>
        <p class="lead">{{ $t('terms_last_updated') }}</p>

        <h2>{{ $t('terms_acceptance') }}</h2>
        <p>{{ $t('terms_acceptance_text') }}</p>

        <h2>{{ $t('terms_license') }}</h2>
        <p>{{ $t('terms_license_text') }}</p>

        <h2>{{ $t('terms_disclaimer') }}</h2>
        <p>{{ $t('terms_disclaimer_text') }}</p>

        <h2>{{ $t('terms_limitations') }}</h2>
        <p>{{ $t('terms_limitations_text') }}</p>
    </div>
  </div>
</template>
