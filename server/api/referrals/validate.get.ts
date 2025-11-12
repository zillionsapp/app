// server/api/referrals/validate.get.ts
import Airtable from 'airtable'

interface ValidateRequest {
  code: string
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event) as ValidateRequest
    const { code } = query

    if (!code) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Referral code is required'
      })
    }

    // Initialize Airtable
    const base = new Airtable({
      apiKey: process.env.AIRTABLE_API_KEY
    }).base(process.env.AIRTABLE_REFERRAL_BASE_ID || '')

    const tableName = process.env.AIRTABLE_REFERRAL_TABLE || 'Referrals'

    const records = await base(tableName)
      .select({
        filterByFormula: `{Referral Code} = '${code}'`,
        maxRecords: 1
      })
      .all()

    if (records.length > 0) {
      const record = records[0]
      return {
        success: true,
        valid: true,
        referrerId: record.fields['Referrer Wallet'] as string,
        referrerEmail: record.fields['Referrer Email'] as string,
        level: 1 // Default level since field doesn't exist
      }
    }

    return {
      success: true,
      valid: false
    }
  } catch (error: any) {
    console.error('Validate referral code API error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to validate referral code'
    })
  }
})
