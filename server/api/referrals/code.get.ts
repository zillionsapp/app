// server/api/referrals/code.get.ts
import Airtable from 'airtable'
import { getAuth } from '@clerk/nuxt/server'

interface CodeRequest {
  userId: string
  email?: string
}

export default defineEventHandler(async (event) => {
  try {
    // Check authentication
    const { userId: authUserId } = getAuth(event)
    if (!authUserId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const query = getQuery(event) as CodeRequest
    const { userId } = query

    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      })
    }

    // Ensure user can only access their own data
    if (userId !== authUserId) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You are not authorized to perform this operation'
      })
    }

    // Initialize Airtable
    const base = new Airtable({
      apiKey: process.env.AIRTABLE_API_KEY
    }).base(process.env.AIRTABLE_REFERRAL_BASE_ID || '')

    const tableName = process.env.AIRTABLE_REFERRAL_TABLE || 'Referrals'

    const records = await base(tableName)
      .select({
        filterByFormula: `{Referrer Email} = '${query.email}'`,
        maxRecords: 1
      })
      .all()

    if (records.length > 0) {
      const record = records[0]
      return {
        success: true,
        referralCode: record.fields['Referral Code'] as string,
        level: 1, // Default level since field doesn't exist
        totalEarnings: record.fields['Reward Earned'] as number || 0
      }
    }

    // If no referral record exists, create one for the authenticated user
    // This allows users to access the commission page and get a referral code
    const { v4: uuidv4 } = await import('uuid')

    // Generate unique referral code
    const referralCode = uuidv4().substring(0, 8).toUpperCase()

    // Create referral record (email will be updated later if needed)
    const recordData: any = {
      'Referrer Email': query.email || '',
      'Referral Code': referralCode,
      'Reward Earned': 0
    }

    await base(tableName).create(recordData)

    return {
      success: true,
      referralCode,
      level: 1,
      totalEarnings: 0
    }
  } catch (error: any) {
    console.error('Get referral code API error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to get referral code'
    })
  }
})
