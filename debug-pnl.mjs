/**
 * Debug script to audit PnL calculations for wallet users
 * Run with: node debug-pnl.mjs
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
  console.log(`   Total transactions: ${userTransactions?.length || 0}`)
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

  console.log('\n2. ALL VAULT TRANSACTIONS:')
  console.log(`   Total transactions: ${allTransactions?.length || 0}`)

  // Calculate cumulative vault shares over time
  let vaultTotalShares = 0
  const vaultHistory = []
  for (const tx of allTransactions || []) {
    if (tx.type === 'DEPOSIT' || tx.type === 'RECEIVE') {
      vaultTotalShares += Number(tx.shares)
    } else if (tx.type === 'WITHDRAWAL' || tx.type === 'SEND') {
      vaultTotalShares -= Number(tx.shares)
    }
    vaultHistory.push({
      timestamp: Number(tx.timestamp),
      totalShares: vaultTotalShares,
      type: tx.type,
      shares: tx.shares,
      email: tx.email
    })
  }
  console.log(`   CURRENT TOTAL SHARES: ${vaultTotalShares}`)

  // 3. Get vault state
  const { data: vaultState } = await supabase
    .from('vault_state')
    .select('total_assets, total_shares')
    .limit(1)

  const vaultAssets = Number(vaultState?.[0]?.total_assets || 0)
  const vaultShares = Number(vaultState?.[0]?.total_shares || 0)
  const sharePrice = vaultShares > 0 ? vaultAssets / vaultShares : 1

  console.log('\n3. VAULT STATE:')
  console.log(`   Total Assets: $${vaultAssets}`)
  console.log(`   Total Shares: ${vaultShares}`)
  console.log(`   Share Price: $${sharePrice}`)

  // 4. Get historical snapshots
  const { data: snapshots } = await supabase
    .from('portfolio_snapshots')
    .select('id, timestamp, pnl, pnlPercentage, initialBalance, currentEquity, walletBalance')
    .order('timestamp', { ascending: true })

  console.log('\n4. PORTFOLIO SNAPSHOTS:')
  console.log(`   Total snapshots: ${snapshots?.length || 0}`)
  if (snapshots?.length > 0) {
    console.log(`   Latest PnL: $${snapshots[snapshots.length - 1].pnl}`)
    console.log(`   Latest PnL %: ${snapshots[snapshots.length - 1].pnlPercentage}%`)
  }

  // 5. Calculate user's ownership over time
  console.log('\n5. OWNERSHIP CALCULATION:')
  const userOwnershipHistory = []
  for (const snap of snapshots || []) {
    const snapTime = Number(snap.timestamp)

    // Calculate user's shares at this snapshot
    let userSharesAtSnap = 0
    for (const tx of userTransactions || []) {
      if (Number(tx.timestamp) <= snapTime) {
        if (tx.type === 'DEPOSIT' || tx.type === 'RECEIVE') {
          userSharesAtSnap += Number(tx.shares)
        } else if (tx.type === 'WITHDRAWAL' || tx.type === 'SEND') {
          userSharesAtSnap -= Number(tx.shares)
        }
      } else {
        break
      }
    }

    // Calculate vault shares at this snapshot
    let vaultSharesAtSnap = 0
    for (const vh of vaultHistory) {
      if (vh.timestamp <= snapTime) {
        vaultSharesAtSnap = vh.totalShares
      } else {
        break
      }
    }

    const ownership = vaultSharesAtSnap > 0 ? userSharesAtSnap / vaultSharesAtSnap : 0
    userOwnershipHistory.push({
      timestamp: snapTime,
      date: new Date(snapTime).toISOString().split('T')[0],
      userShares: userSharesAtSnap,
      vaultShares: vaultSharesAtSnap,
      ownership: (ownership * 100).toFixed(2) + '%',
      vaultPnl: snap.pnl
    })
  }

  // Show first and last few snapshots
  console.log('   First 3 snapshots:')
  for (const h of userOwnershipHistory.slice(0, 3)) {
    console.log(`   ${h.date}: user=${h.userShares}, vault=${h.vaultShares}, ownership=${h.ownership}, vaultPnl=$${h.vaultPnl}`)
  }
  console.log('   ...')
  console.log('   Last 3 snapshots:')
  for (const h of userOwnershipHistory.slice(-3)) {
    console.log(`   ${h.date}: user=${h.userShares}, vault=${h.vaultShares}, ownership=${h.ownership}, vaultPnl=$${h.vaultPnl}`)
  }

  // 6. Calculate user's realized PnL
  console.log('\n6. REALIZED PnL CALCULATION:')
  let userRealizedPnl = 0
  let prevVaultPnl = 0

  for (const h of userOwnershipHistory) {
    const incrementalPnl = (h.vaultPnl || 0) - prevVaultPnl
    const ownership = parseFloat(h.ownership) / 100
    const attributedPnl = incrementalPnl * ownership
    userRealizedPnl += attributedPnl
    prevVaultPnl = h.vaultPnl || 0
  }

  console.log(`   User's Realized PnL: $${userRealizedPnl.toFixed(2)}`)
  console.log(`   Vault's Total PnL: $${snapshots?.[snapshots.length - 1]?.pnl || 0}`)
  console.log(`   User's Ownership (current): ${((userTotalShares / vaultShares) * 100).toFixed(2)}%`)
  console.log(`   Expected PnL (if constant ownership): $${((snapshots?.[snapshots.length - 1]?.pnl || 0) * (userTotalShares / vaultShares)).toFixed(2)}`)

  // 7. Current equity calculation
  const currentOwnership = vaultShares > 0 ? userTotalShares / vaultShares : 0
  const userEquity = currentOwnership * vaultAssets

  console.log('\n7. CURRENT EQUITY:')
  console.log(`   User Shares: ${userTotalShares}`)
  console.log(`   Vault Shares: ${vaultShares}`)
  console.log(`   Ownership: ${(currentOwnership * 100).toFixed(2)}%`)
  console.log(`   Vault Assets: $${vaultAssets}`)
  console.log(`   User Equity: $${userEquity.toFixed(2)}`)

  // 8. Open trades (unrealized PnL)
  const { data: openTrades } = await supabase
    .from('trades')
    .select('*')
    .eq('status', 'OPEN')

  console.log('\n8. OPEN TRADES (Unrealized PnL):')
  console.log(`   Count: ${openTrades?.length || 0}`)

  // Initialize unrealized PnL (must be declared outside the if block)
  let totalUnrealizedPnl = 0

  // Fetch prices
  if (openTrades?.length > 0) {
    const symbols = [...new Set(openTrades.map(t => t.symbol))]
    const { data: prices } = await supabase
      .from('prices')
      .select('symbol, price')
      .in('symbol', symbols)

    const priceMap = {}
    for (const p of prices || []) {
      priceMap[p.symbol] = p.price
    }

    for (const trade of openTrades) {
      const currentPrice = priceMap[trade.symbol]
      if (currentPrice) {
        const entryPrice = Number(trade.price)
        const quantity = Number(trade.quantity)
        const dollarPnL = trade.side === 'BUY'
          ? (currentPrice - entryPrice) * quantity
          : (entryPrice - currentPrice) * quantity
        totalUnrealizedPnl += dollarPnL * currentOwnership
        console.log(`   ${trade.symbol} ${trade.side}: entry=$${entryPrice}, current=$${currentPrice}, qty=${quantity}, PnL=$${dollarPnL.toFixed(2)}, userShare=$${dollarPnL.toFixed(2)} × ${(currentOwnership * 100).toFixed(2)}% = $${(dollarPnL * currentOwnership).toFixed(2)}`)
      }
    }
    console.log(`   Total Unrealized PnL: $${totalUnrealizedPnl.toFixed(2)}`)
  }

  // 9. Summary
  console.log('\n' + '='.repeat(80))
  console.log('SUMMARY:')
  console.log('='.repeat(80))
  console.log(`   Total Deposited: $${userTotalDeposited}`)
  console.log(`   Current Shares: ${userTotalShares}`)
  console.log(`   Current Ownership: ${(currentOwnership * 100).toFixed(2)}%`)
  console.log(`   Realized PnL: $${userRealizedPnl.toFixed(2)}`)
  console.log(`   Unrealized PnL: $${openTrades?.length > 0 ? totalUnrealizedPnl.toFixed(2) : '0.00'}`)
  console.log(`   Current Equity: $${(userEquity + (openTrades?.length > 0 ? totalUnrealizedPnl : 0)).toFixed(2)}`)
  console.log(`   Available Balance: $${userEquity.toFixed(2)}`)
  console.log('='.repeat(80))

  return {
    totalDeposited: userTotalDeposited,
    totalShares: userTotalShares,
    ownership: currentOwnership,
    realizedPnl: userRealizedPnl,
    unrealizedPnl: openTrades?.length > 0 ? totalUnrealizedPnl : 0,
    equity: userEquity + (openTrades?.length > 0 ? totalUnrealizedPnl : 0)
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

  const chris1 = results[USERS[0]]
  const chris2 = results[USERS[1]]

  console.log(`                        ${USERS[0].split('@')[0]}                    ${USERS[1].split('@')[0]}`)
  console.log('-'.repeat(80))
  console.log(`Total Deposited:        $${chris1.totalDeposited.toFixed(2)}          $${chris2.totalDeposited.toFixed(2)}`)
  console.log(`Total Shares:           ${chris1.totalShares.toFixed(2)}             ${chris2.totalShares.toFixed(2)}`)
  console.log(`Ownership %:            ${(chris1.ownership * 100).toFixed(2)}%              ${(chris2.ownership * 100).toFixed(2)}%`)
  console.log(`Realized PnL:           $${chris1.realizedPnl.toFixed(2)}          $${chris2.realizedPnl.toFixed(2)}`)
  console.log(`Unrealized PnL:         $${chris1.unrealizedPnl.toFixed(2)}          $${chris2.unrealizedPnl.toFixed(2)}`)
  console.log(`Current Equity:         $${chris1.equity.toFixed(2)}          $${chris2.equity.toFixed(2)}`)
  console.log('-'.repeat(80))

  // Check if proportions make sense
  const totalOwnership = chris1.ownership + chris2.ownership
  console.log(`\nTotal ownership of both users: ${(totalOwnership * 100).toFixed(2)}%`)
  console.log(`Sum of both PnLs: $${(chris1.realizedPnl + chris2.realizedPnl).toFixed(2)}`)

  if (totalOwnership > 1) {
    console.log('\n⚠️  WARNING: Total ownership exceeds 100%! There may be other users.')
  }

  console.log('\nDone!')
}

main().catch(console.error)
