// server/api/wallet/all.get.ts
import Airtable from 'airtable'

export default defineEventHandler(async (event) => {
  try {
    console.log(AIRTABLE_API_KEY);
    
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

    const wallets = records.map(record => ({
      id: record.id,
      email: record.fields.Email as string,
      amount: record.fields.Amount as number || 0,
      sentTo: (record.fields.sentTo as string[]) || [],
      receivedFrom: (record.fields.receivedFrom as string[]) || [],
      created_at: record.fields['Created At'] as string,
      updated_at: record.fields['Updated At'] as string
    }))

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
