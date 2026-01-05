<script setup lang="ts">
interface Props {
  direction?: 'up' | 'down'
}

const props = withDefaults(defineProps<Props>(), {
  direction: 'down'
})

const { locale, locales, setLocale } = useI18n()

// Available locales map for display
const localeNames: Record<string, string> = {
  en: '🇺🇸 English',
  de: '🇩🇪 Deutsch',
  fr: '🇫🇷 Français',
  es: '🇪🇸 Español'
}

const switchLocale = (newLocale: string) => {
  setLocale(newLocale as 'en' | 'fr' | 'de' | 'es')
}
</script>

<template>
  <div :class="['dropdown z-50', props.direction === 'up' ? 'dropdown-top' : '']">
    <label tabindex="0" class="btn btn-ghost btn-sm m-1">{{ localeNames[locale] || locale.toUpperCase() }}</label>
    <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
      <li v-for="l in ['en', 'de', 'fr', 'es']" :key="l">
        <a @click="switchLocale(l)" :class="{ active: locale === l }">
          {{ localeNames[l] }}
        </a>
      </li>
    </ul>
  </div>
</template>
