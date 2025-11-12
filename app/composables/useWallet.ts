// composables/useWallet.ts
import { ref, computed } from 'vue'

interface WalletRecord {
  id?: string
  email: string
  amount: number
  sentTo?: string[]
  receivedFrom?: string[]
  created_at?: string
  updated_at?: string
}

interface DepositParams {
  amount: number
  email: string
}

interface SendParams {
  amount: number
  fromEmail: string
  toEmail: string
}

interface DepositResponse {
  success: boolean
  action: 'created' | 'updated'
  newBalance: number
  email: string
}

interface SendResponse {
  success: boolean
  fromEmail: string
  toEmail: string
  amount: number
  fromNewBalance: number
  toNewBalance: number
}

interface BalanceResponse {
  success: boolean
  email: string
  balance: number
  cash?: number
  btc?: number
  deposit?: number
  exists: boolean
  sentTo?: string[]
  receivedFrom?: string[]
  trades?: any[]
  created_at?: string
  updated_at?: string
}

interface AllWalletsResponse {
  success: boolean
  wallets: WalletRecord[]
  count: number
}

export function useWallet() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Deposit money to a user's wallet
   * Creates new record if email doesn't exist, otherwise adds to existing amount
   */
  const deposit = async ({ amount, email }: DepositParams): Promise<boolean> => {
    if (amount <= 0) {
      error.value = 'Deposit amount must be greater than 0'
      return false
    }

    loading.value = true
    error.value = null

    try {
      const response = await $fetch<DepositResponse>('/api/wallet/deposit', {
        method: 'POST',
        body: { amount, email }
      })

      return response.success
    } catch (err: any) {
      error.value = err.data?.statusMessage || err.message || 'Failed to deposit funds'
      console.error('Deposit error:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Send money from one user to another
   * Creates wallet records if they don't exist, otherwise updates amounts
   */
  const send = async ({ amount, fromEmail, toEmail }: SendParams): Promise<boolean> => {
    if (amount <= 0) {
      error.value = 'Send amount must be greater than 0'
      return false
    }

    if (fromEmail === toEmail) {
      error.value = 'Cannot send money to yourself'
      return false
    }

    loading.value = true
    error.value = null

    try {
      const response = await $fetch<SendResponse>('/api/wallet/send', {
        method: 'POST',
        body: { amount, fromEmail, toEmail }
      })

      return response.success
    } catch (err: any) {
      error.value = err.data?.statusMessage || err.message || 'Failed to send funds'
      console.error('Send error:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Get wallet balance for a specific email
   */
  const getBalance = async (email: string): Promise<number> => {
    try {
      const response = await $fetch<BalanceResponse>(`/api/wallet/balance?email=${encodeURIComponent(email)}`)
      return response.balance
    } catch (err: any) {
      console.error('Get balance error:', err)
      return 0
    }
  }

  /**
   * Get wallet balance details for a specific email (includes created_at)
   */
  const getBalanceDetails = async (email: string): Promise<BalanceResponse | null> => {
    try {
      const response = await $fetch<BalanceResponse>(`/api/wallet/balance?email=${encodeURIComponent(email)}`)
      return response
    } catch (err: any) {
      console.error('Get balance details error:', err)
      return null
    }
  }

  /**
   * Get all wallet records (admin function)
   */
  const getAllWallets = async (): Promise<WalletRecord[]> => {
    try {
      const response = await $fetch<AllWalletsResponse>('/api/wallet/all')
      return response.wallets
    } catch (err: any) {
      console.error('Get all wallets error:', err)
      return []
    }
  }

  /**
   * Check if email has a wallet record
   */
  const hasWallet = async (email: string): Promise<boolean> => {
    try {
      const response = await $fetch<BalanceResponse>(`/api/wallet/balance?email=${encodeURIComponent(email)}`)
      return response.exists
    } catch (err: any) {
      console.error('Has wallet check error:', err)
      return false
    }
  }

  return {
    // State
    loading: computed(() => loading.value),
    error: computed(() => error.value),

    // Methods
    deposit,
    send,
    getBalance,
    getBalanceDetails,
    getAllWallets,
    hasWallet,

    // Clear error helper
    clearError: () => { error.value = null }
  }
}
