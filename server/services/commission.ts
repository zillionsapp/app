// server/services/commission.ts
import Airtable from 'airtable'

interface CommissionCalculation {
  profitAmount: number
  commissionType: 'direct' | 'sub'
  directRepRate: number
  subRepRate: number
  overrideRate: number
}

interface CommissionResult {
  totalCommission: number
  investorKeeps: number
  directRepCommission: number
  subRepCommission: number
  recruiterOverride: number
  ownerOverride: number
  type: 'direct' | 'sub'
}

export function calculateCommissions(params: CommissionCalculation): CommissionResult {
  const { profitAmount, commissionType, directRepRate, subRepRate, overrideRate } = params

  if (!profitAmount || profitAmount <= 0) {
    return {
      totalCommission: 0,
      investorKeeps: 0,
      directRepCommission: 0,
      subRepCommission: 0,
      recruiterOverride: 0,
      ownerOverride: 0,
      type: commissionType
    }
  }

  const profit = profitAmount

  let directRepCommission = 0
  let subRepCommission = 0
  let recruiterOverride = 0
  let ownerOverride = 0

  if (commissionType === 'direct') {
    directRepCommission = profit * (directRepRate / 100)
    ownerOverride = profit * (overrideRate / 100)
  } else if (commissionType === 'sub') {
    subRepCommission = profit * (subRepRate / 100)
    recruiterOverride = profit * (overrideRate / 100)
    ownerOverride = profit * (overrideRate / 100)
  }

  // Total commission pool
  const totalCommission = directRepCommission + subRepCommission + recruiterOverride + ownerOverride

  // Investor keeps the remainder
  const investorKeeps = profit - totalCommission

  return {
    totalCommission,
    investorKeeps,
    directRepCommission,
    subRepCommission,
    recruiterOverride,
    ownerOverride,
    type: commissionType
  }
}

export async function updateReferralEarnings(userId: string, earnings: number) {
  const base = new Airtable({
    apiKey: process.env.AIRTABLE_API_KEY
  }).base(process.env.AIRTABLE_REFERRAL_BASE_ID || '')

  const tableName = process.env.AIRTABLE_REFERRAL_TABLE || 'Referrals'

  // Find the user's referral record
  const records = await base(tableName)
    .select({
      filterByFormula: `{Referrer Wallet} = '${userId}'`,
      maxRecords: 1
    })
    .all()

  if (records.length > 0) {
    const record = records[0]
    const currentEarnings = record.fields['Reward Earned'] as number || 0
    const newEarnings = currentEarnings + earnings

    await base(tableName).update(record.id, {
      'Reward Earned': newEarnings,
      'Claimed At': new Date().toISOString()
    })

    return newEarnings
  }

  throw new Error('Referral record not found')
}

export async function distributeCommissions(referrerId: string, profitAmount: number) {
  // Since there's no hierarchy in the current table structure,
  // just distribute a flat commission to the referrer
  const commissionRate = 15 // Flat 15% commission
  const commission = profitAmount * (commissionRate / 100)

  // Update referrer's earnings
  await updateReferralEarnings(referrerId, commission)
}
