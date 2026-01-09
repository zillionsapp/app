# Vault Balance Calculation Discrepancy Report

## Executive Summary

There is a critical discrepancy in how user wallet balances are calculated versus the actual vault balance. In some scenarios, a user's wallet balance appears larger than the vault's total balance, which is mathematically impossible and indicates a fundamental calculation error.

## Root Cause Analysis

### The Two Balance Systems

1. **Vault State System** (`vault_state` table):
   - Tracks `total_assets` and `total_shares`
   - Used for deposit/withdrawal operations
   - Represents the actual monetary value of the vault

2. **Portfolio Snapshot System** (`portfolio_snapshots` table):
   - Tracks trading performance metrics
   - Includes `currentEquity`, `walletBalance`, `totalMarginUsed`, etc.
   - Represents trading account state including locked margin

### The Core Problem

The issue lies in `server/api/wallet/summary.get.ts` where the user's available balance is calculated incorrectly:

```typescript
// Current (incorrect) calculation:
const userBalance = initialBalance > 0 ? (totalDeposited / initialBalance) * walletBalance : 0
```

**Why this is wrong:**
- `walletBalance` represents available trading funds (excluding locked margin)
- User's balance should be their proportional share of ALL vault assets
- The calculation uses `initialBalance` as the denominator, but this doesn't account for vault growth

### Mathematical Proof of the Issue

Let's consider a scenario:
- Initial vault balance: $10,000
- User deposits: $1,000 (10% ownership)
- Trading bot opens positions with $8,000 margin
- Vault walletBalance: $2,000 (available funds)
- Vault currentEquity: $10,000 (total value including margin)

Current calculation:
- User balance = ($1,000 / $10,000) * $2,000 = $200
- But user's actual equity should be: ($1,000 / $10,000) * $10,000 = $1,000

The user's wallet shows $200, but they actually own $1,000 worth of equity. The $800 difference represents their share of the locked margin.

## Impact Analysis

### User Experience Issues
1. **Incorrect Balance Display**: Users see much lower available balances than they should
2. **Withdrawal Limitations**: Users cannot withdraw their full equity due to incorrect calculations
3. **Trust Issues**: Users may believe the system is withholding their funds

### System Integrity Issues
1. **Mathematical Impossibility**: User balances can appear larger than vault balance in edge cases
2. **Margin Calculation Errors**: The system doesn't properly account for user's share of locked margin
3. **Equity Misrepresentation**: Total user equity across all users can exceed vault equity

## Proposed Solution

### Correct Calculation Method

```typescript
// User's total equity (what they actually own)
const userEquity = initialBalance > 0 ? (totalDeposited / initialBalance) * currentEquity : 0

// User's available balance (what they can withdraw)
const availableBalance = initialBalance > 0 ? (totalDeposited / initialBalance) * walletBalance : 0

// Ensure available balance doesn't exceed total equity
const userBalance = Math.min(availableBalance, userEquity)
```

### Implementation Changes Required

1. **wallet/summary.get.ts**:
   - Fix the `userBalance` calculation to use proper proportional logic
   - Add validation to ensure balance never exceeds vault balance
   - Include margin information in the response

2. **wallet/chart.get.ts**:
   - Ensure historical calculations use the same corrected logic
   - Add margin tracking to historical data

3. **withdraw.post.ts**:
   - Update withdrawal validation to use corrected balance calculation
   - Add margin awareness to prevent over-withdrawal

## Recommendations

1. **Immediate Fix**: Implement the corrected calculation in wallet/summary.get.ts
2. **Data Migration**: Review historical data to identify affected users
3. **Monitoring**: Add validation checks to prevent negative balances
4. **Documentation**: Update API documentation to clarify balance vs equity concepts
5. **Testing**: Create comprehensive test cases for various margin scenarios

## Technical Implementation Details

The fix requires understanding that:
- `currentEquity` = Total vault value (including locked margin)
- `walletBalance` = Available funds (excluding locked margin)
- User's balance should be proportional to their deposit percentage
- Available balance cannot exceed total equity

This ensures mathematical consistency and prevents the "balance larger than vault" scenario.