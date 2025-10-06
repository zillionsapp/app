// server/api/wallet/deposit.post.ts
import Airtable from 'airtable'

interface DepositRequest {
  amount: number
  email: string
}

interface TransactionRecord {
  id?: string
  email: string
  amount: number
  type: 'deposit' | 'send' | 'receive'
  sentTo?: string
  receivedFrom?: string
  relatedEmail?: string
  created_at: string
  updated_at: string
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<DepositRequest>(event)
    const { amount, email } = body

    // Validate input
    if (!amount || amount <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Amount must be greater than 0'
      })
    }

    if (!email) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email is required'
      })
    }
    
    // Initialize Airtable
    const base = new Airtable({
      apiKey: process.env.AIRTABLE_API_KEY
    }).base(process.env.AIRTABLE_BASE_ID || '')

    const tableName = process.env.AIRTABLE_WALLET_TABLE || 'Wallets'

    // Check if user already has a wallet record
    const existingRecords = await base(tableName)
      .select({
        filterByFormula: `{Email} = '${email}'`,
        maxRecords: 1
      })
      .all()

    const now = new Date().toISOString()

    if (existingRecords.length > 0) {
      // Update existing record
      const existingRecord = existingRecords[0]
      if (existingRecord) {
        const currentAmount = existingRecord.fields.Amount as number || 0
        const newAmount = currentAmount + amount

        await base(tableName).update(existingRecord.id, {
          Amount: newAmount,
        })

        return {
          success: true,
          action: 'updated',
          newBalance: newAmount,
          email
        }
      }
    } else {
      // Create new wallet record
      await base(tableName).create({
        Email: email,
        Amount: amount,
      })

      return {
        success: true,
        action: 'created',
        newBalance: amount,
        email
      }
    }
  } catch (error: any) {
    console.error('Deposit API error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to deposit funds'
    })
  }
})
