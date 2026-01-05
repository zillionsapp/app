import { describe, it, expect, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import DashboardPage from '~/pages/app/index.vue'
import { createTestI18n } from './setup'

// Mock useSupabaseUser
const mockUseSupabaseUser = vi.fn()
vi.stubGlobal('useSupabaseUser', mockUseSupabaseUser)

describe('Dashboard', () => {
    it('renders the stats', async () => {
        mockUseSupabaseUser.mockReturnValue({ value: { email: 'test@example.com' } })

        const component = await mountSuspended(DashboardPage, {
            global: {
                plugins: [createTestI18n()],
                stubs: {
                    NuxtLink: true,
                    AreaChart: true,
                    BarChart: true,
                    DonutChart: true,
                    BubbleChart: true
                }
            }
        })
        expect(component.text()).toContain('Total Users')
        expect(component.text()).toContain('31K')
    })
})
