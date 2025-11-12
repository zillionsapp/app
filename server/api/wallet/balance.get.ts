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
      const cash = record.fields.Cash as number || 0
      const btc = record.fields.btc as number || 0
      const deposit = record.fields.Deposit as number || 0

      // Parse trades JSON
      let trades: any[] = []
      try {
        const tradesField = record.fields.Trades as string
        if (tradesField) {
          trades = JSON.parse(tradesField)
        }
      } catch (parseError) {
        console.error(`Error parsing trades for ${email}:`, parseError)
        trades = []
      }

      return {
        success: true,
        email,
        balance: cash, // For backward compatibility
        cash,
        btc,
        deposit,
        exists: true,
        sentTo: (record.fields.sentTo as string[]) || [],
        receivedFrom: (record.fields.receivedFrom as string[]) || [],
        trades,
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
