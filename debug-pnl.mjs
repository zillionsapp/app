/**
 * Debug script to audit PnL calculations for wallet users
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_KEY must be set in .env file')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const USERS = [
  'chris@autonomous.enterprises',
  'chris@brane.media'
]

async function debugUser(userEmail) {
  console.log('\n' + '='.repeat(80))
  console.log(`DEBUGGING USER: ${userEmail}`)
  console.log('='.repeat(80))

  // 1. Get user's vault transactions
  const { data: userTransactions } = await supabase
    .from('vault_transactions')
    .select('amount, shares, type, timestamp')
    .eq('email', userEmail)
    .order('timestamp', { ascending: true })

  console.log('\n1. USER TRANSACTIONS:')
  let userTotalDeposited = 0
  let userTotalShares = 0
  for (const tx of userTransactions || []) {
    console.log(`   [${new Date(Number(tx.timestamp)).toISOString()}] ${tx.type}: $${tx.amount}, shares: ${tx.shares}`)
    if (tx.type === 'DEPOSIT' || tx.type === 'RECEIVE') {
      userTotalDeposited += Number(tx.amount)
      userTotalShares += Number(tx.shares)
    } else if (tx.type === 'WITHDRAWAL' || tx.type === 'SEND') {
      userTotalDeposited -= Number(tx.amount)
      userTotalShares -= Number(tx.shares)
    }
  }
  console.log(`   TOTAL DEPOSITED: $${userTotalDeposited}`)
  console.log(`   TOTAL SHARES: ${userTotalShares}`)

  // 2. Get all vault transactions
  const { data: allTransactions } = await supabase
    .from('vault_transactions')
    .select('shares, type, timestamp, email')
    .order('timestamp', { ascending: true })

  let vaultTotalShares = 0
  for (const tx of allTransactions || []) {
    if (tx.type === 'DEPOSIT' || tx.type === 'RECEIVE') {
      vaultTotalShares += Number(tx.shares)
    } else if (tx.type === 'WITHDRAWAL' || tx.type === 'SEND') {
      vaultTotalShares -= Number(tx.shares)
    }
  }

  // 3. Get vault state
  const { data: vaultState } = await supabase
    .from('vault_state')
    .select('total_assets, total_shares')
    .limit(1)

  const vaultAssets = Number(vaultState?.[0]?.total_assets || 0)
  const vaultShares = Number(vaultState?.[0]?.total_shares || 0)

  console.log('\n2. VAULT STATE:')
  console.log(`   Vault Assets: $${vaultAssets}`)
  console.log(`   Vault Shares: ${vaultShares}`)
  console.log(`   User's Shares: ${userTotalShares}`)

  // 4. Calculate ownership
  const userOwnership = vaultShares > 0 ? userTotalShares / vaultShares : 0
  console.log(`\n3. OWNERSHIP:`)
  console.log(`   User Ownership: ${(userOwnership * 100).toFixed(4)}%`)

  // 5. Get snapshot data
  const { data: latestSnapshot } = await supabase
    .from('portfolio_snapshots')
    .select('pnl, totalMarginUsed, currentEquity, initialBalance')
    .order('timestamp', { ascending: false })
    .limit(1)

  const vaultPnl = Number(latestSnapshot?.[0]?.pnl) || 0
  const vaultMarginUsed = Number(latestSnapshot?.[0]?.totalMarginUsed) || 0
  const vaultEquity = Number(latestSnapshot?.[0]?.currentEquity) || vaultAssets

  console.log(`\n4. SNAPSHOT DATA:`)
  console.log(`   Vault PnL: $${vaultPnl.toFixed(2)}`)
  console.log(`   Vault Margin Used: $${vaultMarginUsed.toFixed(2)}`)
  console.log(`   Vault Equity (currentEquity): $${vaultEquity.toFixed(2)}`)

  // 6. Calculate user's values
  const userEquity = userOwnership * vaultEquity
  const userMarginLocked = vaultMarginUsed * userOwnership
  const userRealizedPnl = vaultPnl * userOwnership

  console.log(`\n5. CALCULATED VALUES:`)
  console.log(`   User Equity (ownership × vaultEquity): $${userEquity.toFixed(2)}`)
  console.log(`   User Margin Locked (ownership × vaultMargin): $${userMarginLocked.toFixed(2)}`)
  console.log(`   User Realized PnL (ownership × vaultPnl): $${userRealizedPnl.toFixed(2)}`)

  // 7. Balance calculations
  const balanceWithMargin = userTotalDeposited + userRealizedPnl + userMarginLocked
  const balanceWithoutMargin = userTotalDeposited + userRealizedPnl

  console.log(`\n6. BALANCE CALCULATIONS:`)
  console.log(`   Total Deposited: $${userTotalDeposited}`)
  console.log(`   + Realized PnL: $${userRealizedPnl.toFixed(2)}`)
  console.log(`   + Margin Locked: $${userMarginLocked.toFixed(2)}`)
  console.log(`   = Balance WITH margin: $${balanceWithMargin.toFixed(2)}`)
  console.log(`   = Balance WITHOUT margin: $${balanceWithoutMargin.toFixed(2)}`)

  // 8. Check if shares equals deposited (share price = $1)
  const sharePrice = vaultShares > 0 ? vaultAssets / vaultShares : 1
  console.log(`\n7. SHARE PRICE ANALYSIS:`)
  console.log(`   Share Price: $${sharePrice.toFixed(4)}`)
  console.log(`   User Shares × Share Price: ${userTotalShares} × $${sharePrice.toFixed(4)} = $${(userTotalShares * sharePrice).toFixed(2)}`)
  console.log(`   User Deposited: $${userTotalDeposited}`)

  console.log('\n' + '='.repeat(80))
  return {
    totalDeposited: userTotalDeposited,
    totalShares: userTotalShares,
    userOwnership,
    vaultPnl,
    vaultMarginUsed,
    vaultEquity,
    userEquity,
    userMarginLocked,
    userRealizedPnl,
    balanceWithMargin,
    balanceWithoutMargin
  }
}

async function main() {
  console.log('Starting PnL Debug Audit')
  console.log(`Supabase URL: ${SUPABASE_URL}`)

  const results = {}
  for (const user of USERS) {
    results[user] = await debugUser(user)
  }

  // Compare both users
  console.log('\n' + '='.repeat(80))
  console.log('COMPARISON OF BOTH USERS:')
  console.log('='.repeat(80))
  console.log(`                        ${USERS[0].split('@')[0]}                    ${USERS[1].split('@')[0]}`)
  console.log('-'.repeat(80))
  console.log(`Total Deposited:        $${results[USERS[0]].totalDeposited.toFixed(2)}          $${results[USERS[1]].totalDeposited.toFixed(2)}`)
  console.log(`Total Shares:           ${results[USERS[0]].totalShares.toFixed(2)}             ${results[USERS[1]].totalShares.toFixed(2)}`)
  console.log(`Ownership %:            ${(results[USERS[0]].userOwnership * 100).toFixed(2)}%              ${(results[USERS[1]].userOwnership * 100).toFixed(2)}%`)
  console.log(`Realized PnL:           $${results[USERS[0]].userRealizedPnl.toFixed(2)}          $${results[USERS[1]].userRealizedPnl.toFixed(2)}`)
  console.log(`Margin Locked:          $${results[USERS[0]].userMarginLocked.toFixed(2)}          $${results[USERS[1]].userMarginLocked.toFixed(2)}`)
  console.log(`Balance (with margin):  $${results[USERS[0]].balanceWithMargin.toFixed(2)}          $${results[USERS[1]].balanceWithMargin.toFixed(2)}`)
  console.log(`Balance (no margin):    $${results[USERS[0]].balanceWithoutMargin.toFixed(2)}          $${results[USERS[1]].balanceWithoutMargin.toFixed(2)}`)
  console.log('-'.repeat(80))

  // Check math
  console.log('\nMATH CHECK:')
  const totalDeposited = results[USERS[0]].totalDeposited + results[USERS[1]].totalDeposited
  const totalPnl = results[USERS[0]].userRealizedPnl + results[USERS[1]].userRealizedPnl
  const totalMargin = results[USERS[0]].userMarginLocked + results[USERS[1]].userMarginLocked

  console.log(`   Sum of deposited: $${totalDeposited}`)
  console.log(`   Sum of PnL: $${totalPnl.toFixed(2)} (vault: $${results[USERS[0]].vaultPnl.toFixed(2)})`)
  console.log(`   Sum of margin locked: $${totalMargin.toFixed(2)} (vault: $${results[USERS[0]].vaultMarginUsed.toFixed(2)})`)

  console.log('\nDone!')
}

main().catch(console.error)
  console.log(`   User Shares: ${userTotalShares}`)
