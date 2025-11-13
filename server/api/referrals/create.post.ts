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

    // If this is a referral from someone else
    if (referrerId) {
      // Create a referee record linked to the referrer
      const recordData: any = {
        'Referrer Wallet': referrerId,
        'Referrer Email': referrerEmail || '',
        'Referee Wallet': userId,
        'Referee Email': email,
        'Reward Earned': 0
      }

      await base(tableName).create(recordData)

      return {
        success: true,
        level: 1
      }
    } else {
      // Generate unique referral code for the new user
      const referralCode = uuidv4().substring(0, 8).toUpperCase()

      // Create a referrer record for the user
      const recordData: any = {
        'Referrer Wallet': userId,
        'Referrer Email': email,
        'Referral Code': referralCode,
        'Reward Earned': 0
      }

      await base(tableName).create(recordData)

      return {
        success: true,
        referralCode,
        level: 1
      }
    }
  } catch (error: any) {
    console.error('Create referral API error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to create referral record'
    })
  }
})
