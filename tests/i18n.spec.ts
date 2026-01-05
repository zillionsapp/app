import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import Header from '~/components/app/Header.vue'
import { createTestI18n } from './setup'

describe('i18n Support', () => {
    it('uses translation keys in Header', async () => {
        const component = await mountSuspended(Header, {
            global: {
                plugins: [createTestI18n()],
                stubs: {
                    NuxtLink: { template: '<a><slot /></a>' },
                    ThemeToggle: true
                }
            }
        })

        expect(component.text()).toContain('Features')
        expect(component.text()).toContain('Pricing')
        expect(component.text()).toContain('Login')
        expect(component.text()).toContain('Get Started')
    })
})
