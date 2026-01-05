import { describe, it, expect, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import IndexPage from '~/pages/index.vue'

// Mock Anime.js to prevent execution during test
vi.mock('animejs', () => ({
    default: vi.fn()
}))

describe('Pages', () => {
    describe('Landing Page', () => {
        it('renders the hero section', async () => {
            const component = await mountSuspended(IndexPage, {
                global: {
                    stubs: {
                        NuxtLink: true // Stub NuxtLink to avoid router issues
                    },
                    mocks: {
                        $colorMode: { preference: 'light', value: 'light', unknown: false },
                        $t: (key: string) => key
                    }
                }
            })
            expect(component.text()).toContain('hero_title_line1')
            // expect(component.text()).toContain('Gen') // Split text handling
            expect(component.text()).toContain('hero_title_line2')
        })

        it('renders the pricing section', async () => {
            const component = await mountSuspended(IndexPage, {
                global: {
                    stubs: {
                        NuxtLink: true
                    },
                    mocks: {
                        $colorMode: { preference: 'light', value: 'light', unknown: false },
                        $t: (key: string) => key
                    }
                }
            })
            expect(component.text()).toContain('simple_pricing')
            expect(component.text()).toContain('$0')
        })
    })
})
