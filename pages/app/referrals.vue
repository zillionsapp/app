<script setup lang="ts">
definePageMeta({
  layout: 'app',
  middleware: 'auth'
})

interface InviteCode {
  id: string
  code: string
  created_at: string
  used_at?: string
  is_active: boolean
  used_by?: {
    id: string
    email: string
  }
}

interface CommissionSummary {
  total_earned: number
  invited_users_count: number
  last_commission_date?: string
  monthly_earned: number
  pending_payments: number
}

const inviteCodes = ref<InviteCode[]>([])
const commissionSummary = ref<CommissionSummary | null>(null)
const loading = ref(false)
const copiedCode = ref('')
const showShareModal = ref(false)
const shareUrl = ref('')
const newCode = ref('')

const loadInviteCodes = async () => {
  try {
    const response = await $fetch('/api/invites/list') as any
    inviteCodes.value = response.inviteCodes
  } catch (error) {
    console.error('Failed to load invite codes:', error)
  }
}

const loadCommissionSummary = async () => {
  try {
    const response = await $fetch('/api/commissions/summary') as any
    commissionSummary.value = response.summary
  } catch (error) {
    console.error('Failed to load commission summary:', error)
    // Don't fail if commission data isn't available yet
  }
}

const createInviteCode = async () => {
  loading.value = true
  try {
    const response = await $fetch('/api/invites/create', {
      method: 'POST'
    }) as any

    newCode.value = response.inviteCode.code
    shareUrl.value = `${window.location.origin}/?invite=${response.inviteCode.code}`
    showShareModal.value = true

    await loadInviteCodes()
  } catch (error) {
    console.error('Failed to create invite code:', error)
  } finally {
    loading.value = false
  }
}

const deactivateCode = async (codeId: string) => {
  if (!confirm($t('app.referrals.confirm_deactivate'))) {
    return
  }

  loading.value = true
  try {
    // Note: You might want to add a deactivate endpoint
    // For now, we'll just reload
    await loadInviteCodes()
  } catch (error) {
    console.error('Failed to deactivate code:', error)
  } finally {
    loading.value = false
  }
}

const copyToClipboard = async (code: string) => {
  try {
    await navigator.clipboard.writeText(code)
    copiedCode.value = code
    setTimeout(() => {
      copiedCode.value = ''
    }, 2000)
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
  }
}

const shareCode = (code: string) => {
  shareUrl.value = `${window.location.origin}/?invite=${code}`
  showShareModal.value = true
}

const copyShareUrl = async () => {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    copiedCode.value = 'share-url'
    setTimeout(() => {
      copiedCode.value = ''
    }, 2000)
  } catch (error) {
    console.error('Failed to copy share URL:', error)
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

onMounted(async () => {
  await Promise.all([
    loadInviteCodes(),
    loadCommissionSummary()
  ])
})
</script>

<template>
  <!-- Header Section -->
  <section class="col-span-12 flex justify-between items-center mb-8">
    <h1 class="text-3xl font-bold">{{ $t('app.referrals.referral_codes') }}</h1>
    <button @click="createInviteCode" class="btn btn-primary btn-lg gap-2" :disabled="loading">
      <svg v-if="!loading" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
      </svg>
      <span v-if="loading" class="loading loading-spinner loading-sm"></span>
      {{ $t('app.referrals.generate_new_code') }}
    </button>
  </section>

  <!-- Stats Row -->
  <div class="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <div class="card bg-base-100 shadow-lg">
      <div class="card-body">
        <div class="flex items-center gap-3">
          <div class="p-3 bg-primary/10 rounded-full">
            <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
            </svg>
          </div>
          <div>
            <div class="text-2xl font-bold">{{ inviteCodes.length }}</div>
            <div class="text-sm text-base-content/70">{{ $t('app.referrals.total_codes') }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="card bg-base-100 shadow-lg">
      <div class="card-body">
        <div class="flex items-center gap-3">
          <div class="p-3 bg-success/10 rounded-full">
            <svg class="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div>
            <div class="text-2xl font-bold">{{ inviteCodes.filter(c => c.is_active).length }}</div>
            <div class="text-sm text-base-content/70">{{ $t('app.referrals.active_codes') }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="card bg-base-100 shadow-lg">
      <div class="card-body">
        <div class="flex items-center gap-3">
          <div class="p-3 bg-info/10 rounded-full">
            <svg class="w-6 h-6 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
          </div>
          <div>
            <div class="text-2xl font-bold">{{ inviteCodes.filter(c => c.used_by).length }}</div>
            <div class="text-sm text-base-content/70">{{ $t('app.referrals.codes_used') }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="card bg-base-100 shadow-lg">
      <div class="card-body">
        <div class="flex items-center gap-3">
          <div class="p-3 bg-warning/10 rounded-full">
            <svg class="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
            </svg>
          </div>
          <div>
            <div class="text-2xl font-bold">${{ commissionSummary?.total_earned?.toFixed(2) || '0.00' }}</div>
            <div class="text-sm text-base-content/70">{{ $t('app.referrals.total_commissions') }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Main Content Card -->
  <div class="col-span-12">
    <div class="card bg-base-100 shadow-lg">
      <div class="card-body">
        <div class="flex justify-between items-center mb-6">
          <h2 class="card-title">{{ $t('app.referrals.your_referral_codes') }}</h2>
          <button @click="createInviteCode" class="btn btn-primary btn-md gap-2" :disabled="loading">
            <svg v-if="!loading" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            <span v-if="loading" class="loading loading-spinner loading-sm"></span>
            {{ $t('app.referrals.generate_new_code') }}
          </button>
        </div>

        <div v-if="inviteCodes.length === 0" class="text-center py-12">
          <div class="text-6xl mb-4">🎁</div>
          <h3 class="text-xl font-semibold mb-2">{{ $t('app.referrals.no_referral_codes_yet') }}</h3>
          <p class="text-base-content/70 mb-6">{{ $t('app.referrals.create_first_code_desc') }}</p>
          <button @click="createInviteCode" class="btn btn-primary btn-lg" :disabled="loading">
            <span v-if="loading" class="loading loading-spinner"></span>
            {{ $t('app.referrals.create_first_code') }}
          </button>
        </div>

        <div v-else>
          <div class="overflow-x-auto">
            <table class="table table-zebra w-full">
              <!-- Table Head -->
              <thead>
                <tr>
                  <th>{{ $t('app.referrals.code') }}</th>
                  <th>{{ $t('app.referrals.status') }}</th>
                  <th>{{ $t('app.referrals.created') }}</th>
                  <th>{{ $t('app.referrals.used') }}</th>
                  <th>{{ $t('app.referrals.used_by') }}</th>
                  <th>{{ $t('app.referrals.actions') }}</th>
                </tr>
              </thead>
              <!-- Table Body -->
              <tbody>
                <tr v-for="code in inviteCodes" :key="code.id">
                  <td>
                    <code class="font-mono bg-base-200 px-2 py-1 rounded text-sm">{{ code.code }}</code>
                  </td>
                  <td>
                    <div v-if="code.is_active" class="badge badge-success">{{ $t('app.referrals.active') }}</div>
                    <div v-else class="badge badge-neutral">{{ $t('app.referrals.inactive') }}</div>
                  </td>
                  <td class="text-sm">{{ formatDate(code.created_at) }}</td>
                  <td class="text-sm">
                    <span v-if="code.used_at">{{ formatDate(code.used_at) }}</span>
                    <span v-else class="text-base-content/50">-</span>
                  </td>
                  <td class="text-sm">
                    <span v-if="code.used_by">{{ code.used_by.email }}</span>
                    <span v-else class="text-base-content/50">-</span>
                  </td>
                  <td>
                    <div class="flex gap-2">
                      <button
                        @click="copyToClipboard(code.code)"
                        class="btn btn-sm btn-ghost tooltip"
                        :class="{ 'btn-success': copiedCode === code.code }"
                        data-tip="Copy code"
                      >
                        <svg v-if="copiedCode === code.code" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                        </svg>
                      </button>

                      <button
                        @click="shareCode(code.code)"
                        class="btn btn-sm btn-ghost tooltip"
                        data-tip="Share link"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
                        </svg>
                      </button>

                      <button
                        v-if="code.is_active"
                        @click="deactivateCode(code.id)"
                        class="btn btn-sm btn-ghost text-error hover:bg-error hover:text-error-content tooltip"
                        :disabled="loading"
                        data-tip="Deactivate code"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728"></path>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Share Modal -->
  <div v-if="showShareModal" class="modal modal-open">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-4">{{ $t('app.referrals.share_invite_code') }}</h3>
      <p class="mb-4">{{ $t('app.referrals.share_link_desc') }}</p>
      <div class="bg-base-200 p-4 rounded-lg mb-4">
        <code class="text-sm break-all">{{ shareUrl }}</code>
      </div>
      <div class="modal-action">
        <button @click="copyShareUrl" class="btn btn-primary">{{ $t('app.referrals.copy_link') }}</button>
        <button @click="showShareModal = false" class="btn">{{ $t('app.referrals.close') }}</button>
      </div>
    </div>
  </div>
</template>
