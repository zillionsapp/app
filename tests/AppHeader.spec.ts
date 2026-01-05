import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AppHeader from '~/components/app/Header.vue'
import { createTestI18n } from './setup'

describe('AppHeader', () => {
    it('can mount the component', async () => {
        const component = await mountSuspended(AppHeader, {
            global: {
                plugins: [createTestI18n()],
                stubs: {
                    NuxtLink: { template: '<a><slot /></a>' },
                    ThemeToggle: true
                }
            }
        })
        expect(component.text()).toContain('NuxtBoilerplate')
    })
})
