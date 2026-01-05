import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

const { mockUseSupabaseUser, mockNavigateTo } = vi.hoisted(() => {
    return {
        mockUseSupabaseUser: vi.fn(),
        mockNavigateTo: vi.fn()
    }
})

vi.stubGlobal('navigateTo', mockNavigateTo)
vi.stubGlobal('defineNuxtRouteMiddleware', (handler: any) => handler)

mockNuxtImport('useSupabaseUser', () => {
    return () => mockUseSupabaseUser()
})

mockNuxtImport('navigateTo', () => {
    return mockNavigateTo
})

describe('Auth Middleware', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('redirects to login if user is not authenticated', async () => {
        mockUseSupabaseUser.mockReturnValue({ value: null })

        // Dynamic import to pick up mocks
        const authMiddleware = (await import('~/middleware/auth')).default

        // @ts-ignore
        authMiddleware({ path: '/app' }, { path: '/' })

        expect(mockNavigateTo).toHaveBeenCalledWith('/login')
    })

    it('allows access if user is authenticated', async () => {
        mockUseSupabaseUser.mockReturnValue({ value: { email: 'test@example.com' } })

        const authMiddleware = (await import('~/middleware/auth')).default

        // @ts-ignore
        authMiddleware({ path: '/app' }, { path: '/' })

        expect(mockNavigateTo).not.toHaveBeenCalledWith('/login')
    })
})
