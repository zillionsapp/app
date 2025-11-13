// server/api/referrals/list.get.ts
import Airtable from 'airtable'
import { getAuth } from '@clerk/nuxt/server'

interface ListRequest {
  userId: string
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

    const query = getQuery(event) as ListRequest
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

    // Find all referrals where this user is the referrer (direct referrals)
    const directReferrals = await base(tableName)
      .select({
        filterByFormula: `{Referrer Wallet} = '${userId}'`
      })
      .all()

    // Filter to only referee records (records that have Referee Wallet)
    const refereeRecords = directReferrals.filter(record => record.fields['Referee Wallet'])

    const referrals = refereeRecords.map(record => ({
      id: record.id,
      userId: record.fields['Referee Wallet'] as string,
      email: record.fields['Referee Email'] as string,
      level: 1, // Default level since field doesn't exist
      referralCode: record.fields['Referral Code'] as string,
      totalEarnings: record.fields['Reward Earned'] as number || 0,
      createdAt: record.fields['Created At'] as string,
      referrerId: record.fields['Referrer Wallet'] as string,
      referrerEmail: record.fields['Referrer Email'] as string
    }))

    // Get total earnings from the referrer's record
    let totalEarnings = 0
    if (directReferrals.length > 0) {
      // All records for this referrer should have the same Reward Earned
      totalEarnings = directReferrals[0].fields['Reward Earned'] as number || 0
    }

    return {
      success: true,
      referrals,
      totalEarnings,
      directCount: directReferrals.length,
      totalCount: referrals.length
    }
  } catch (error: any) {
    console.error('List referrals API error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to list referrals'
    })
  }
})
