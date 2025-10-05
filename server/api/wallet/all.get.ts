// server/api/wallet/all.get.ts
import Airtable from 'airtable'

export default defineEventHandler(async (event) => {
  try {
    // Initialize Airtable
    const base = new Airtable({
      apiKey: process.env.AIRTABLE_API_KEY
    }).base(process.env.AIRTABLE_BASE_ID || '')

    const tableName = process.env.AIRTABLE_WALLET_TABLE || 'Wallets'

    const records = await base(tableName)
      .select({
        sort: [{ field: 'updated_at', direction: 'desc' }]
      })
      .all()

    const wallets = records.map(record => ({
      id: record.id,
      email: record.fields.email as string,
      amount: record.fields.amount as number || 0,
      created_at: record.fields.created_at as string,
      updated_at: record.fields.updated_at as string
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
