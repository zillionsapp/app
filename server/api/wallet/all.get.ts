// server/api/wallet/all.get.ts
import Airtable from 'airtable'

interface TransactionDetail {
  email: string
  amount: number
  timestamp: string
}

export default defineEventHandler(async (event) => {
  try {
    
    // Initialize Airtable
    const base = new Airtable({
      apiKey: process.env.AIRTABLE_API_KEY
    }).base(process.env.AIRTABLE_BASE_ID || '')

    const tableName = process.env.AIRTABLE_WALLET_TABLE || 'Wallets'

    const records = await base(tableName)
      .select({
        sort: [{ field: 'Updated At', direction: 'desc' }]
      })
      .all()

    const wallets = records.map(record => {
      // Parse sentTo field
      let sentTo: TransactionDetail[] = []
      try {
        const sentToField = record.fields.sentTo as string
        if (sentToField) {
          sentTo = JSON.parse(sentToField)
        }
      } catch (parseError) {
        console.error(`Error parsing sentTo for ${record.fields.Email}:`, parseError)
        sentTo = []
      }

      // Parse receivedFrom field
      let receivedFrom: TransactionDetail[] = []
      try {
        const receivedFromField = record.fields.receivedFrom as string
        if (receivedFromField) {
          receivedFrom = JSON.parse(receivedFromField)
        }
      } catch (parseError) {
        console.error(`Error parsing receivedFrom for ${record.fields.Email}:`, parseError)
        receivedFrom = []
      }

      // Parse trades field
      let trades: string[] = []
      try {
        const tradesField = record.fields.trades as string
        if (tradesField) {
          trades = JSON.parse(tradesField)
        }
      } catch (parseError) {
        console.error(`Error parsing trades for ${record.fields.Email}:`, parseError)
        trades = []
      }

      return {
        id: record.id,
        email: record.fields.Email as string,
        amount: record.fields.Amount as number || 0,
        sentTo,
        receivedFrom,
        trades,
        created_at: record.fields['Created At'] as string,
        updated_at: record.fields['Updated At'] as string
      }
    })

    return {
      success: true,
      wallets,
      count: wallets.length
    }
  } catch (error: any) {
    console.error('Get all wallets API error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to get wallets'
    })
  }
})
