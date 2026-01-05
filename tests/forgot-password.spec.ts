import { describe, it, expect, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ForgotPasswordPage from '~/pages/forgot-password.vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { createTestI18n } from './setup'

// Mock useSupabaseClient
const mockResetPasswordForEmail = vi.fn()
const mockAuth = {
    resetPasswordForEmail: mockResetPasswordForEmail
}
const mockClient = {
    auth: mockAuth
}

// Mock useSupabaseClient using Nuxt utils
mockNuxtImport('useSupabaseClient', () => {
    return () => mockClient
})

describe('Forgot Password Page', () => {
    it('renders the form', async () => {
        const component = await mountSuspended(ForgotPasswordPage, {
            global: {
                plugins: [createTestI18n()],
                stubs: {
                    NuxtLink: true
                }
            }
        })
        expect(component.text()).toContain('Forgot Password')
        expect(component.find('input[type="email"]').exists()).toBe(true)
        expect(component.find('button').text()).toContain('Send Reset Link')
    })

    it('calls resetPasswordForEmail on submit', async () => {
        mockResetPasswordForEmail.mockResolvedValue({ error: null })

        const component = await mountSuspended(ForgotPasswordPage, {
            global: {
                plugins: [createTestI18n()],
                stubs: {
                    NuxtLink: true
                }
            }
        })

        await component.find('input[type="email"]').setValue('test@example.com')
        await component.find('form').trigger('submit')

        expect(mockResetPasswordForEmail).toHaveBeenCalled()
    })
})
