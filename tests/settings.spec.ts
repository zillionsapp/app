import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import SettingsPage from '~/pages/app/settings.vue'
import { createTestI18n } from './setup'

describe('Settings Page', () => {
    it('renders the change password link', async () => {
        const component = await mountSuspended(SettingsPage, {
            global: {
                plugins: [createTestI18n()],
                stubs: {
                    NuxtLink: true
                }
            }
        })

        const link = component.findComponent({ name: 'NuxtLink' })
        expect(link.exists()).toBe(true)
        // Check if there is a link pointing to /update-password
        // Note: With shallow mounting/stubs, we might check props
        const links = component.findAllComponents({ name: 'NuxtLink' })
        const passwordLink = links.find(l => l.attributes('to') === '/update-password')
        expect(passwordLink).toBeDefined()
        // expect(passwordLink?.text()).toContain('Change Password')
    })
})
