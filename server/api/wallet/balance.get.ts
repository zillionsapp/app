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
        filterByFormula: `{Email} = '${email}'`,
        maxRecords: 1
      })
      .all()

    if (records.length > 0) {
      const record = records[0]
      const balance = record.fields.Amount as number || 0
      return {
        success: true,
        email,
        balance,
        exists: true,
        sentTo: (record.fields.sentTo as string[]) || [],
        receivedFrom: (record.fields.receivedFrom as string[]) || [],
        trades: (record.fields.trades as string[]) || [],
        created_at: record.fields['Created At'] as string,
        updated_at: record.fields['Updated At'] as string
      }
    }

    return {
      success: true,
      email,
      balance: 0,
      exists: false,
      sentTo: [],
      receivedFrom: [],
      trades: []
    }
  } catch (error: any) {
    console.error('Get balance API error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to get balance'
    })
  }
})
