// server/api/referrals/create.post.ts
import Airtable from 'airtable'
import { v4 as uuidv4 } from 'uuid'
import { getAuth } from '@clerk/nuxt/server'

interface CreateReferralRequest {
  userId: string
  email: string
  referrerId?: string
  referrerEmail?: string
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

    const body = await readBody(event) as CreateReferralRequest
    const { userId, email, referrerId, referrerEmail } = body

    if (!userId || !email) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID and email are required'
      })
    }

    // Ensure user can only create their own referral record
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

    // Generate unique referral code
    const referralCode = uuidv4().substring(0, 8).toUpperCase()

    // Create referral record - since there's no hierarchy, just create a basic record
    const recordData: any = {
      'Referrer Wallet': userId,
      'Referrer Email': email,
      'Referral Code': referralCode,
      'Reward Earned': 0,
      'Created At': new Date().toISOString()
    }

    // If this is a referral from someone else, we need to create a referee record
    if (referrerId) {
      // This means someone referred this user, so we need to create a referee record
      // But since the table structure is different, we might need to create a separate record
      // For now, just create the referrer record
    }

    const createdRecords = await base(tableName).create([recordData])
    const createdRecord = createdRecords[0]

    return {
      success: true,
      referralCode,
      level: 1,
      recordId: createdRecord.id
    }
  } catch (error: any) {
    console.error('Create referral API error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to create referral record'
    })
  }
})
