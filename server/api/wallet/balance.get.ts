// server/api/wallet/balance.get.ts
import Airtable from 'airtable'

interface BalanceRequest {
  email: string
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event) as BalanceRequest
    const { email } = query

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

    const records = await base(tableName)
      .select({
        filterByFormula: `{email} = '${email}'`,
        maxRecords: 1
      })
      .all()

    if (records.length > 0) {
      const balance = records[0].fields.amount as number || 0
      return {
        success: true,
        email,
        balance,
        exists: true
      }
    }

    return {
      success: true,
      email,
      balance: 0,
      exists: false
    }
  } catch (error: any) {
    console.error('Get balance API error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to get balance'
    })
  }
})
