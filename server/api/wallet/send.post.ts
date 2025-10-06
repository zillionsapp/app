// server/api/wallet/send.post.ts
import Airtable from 'airtable'

interface SendRequest {
  amount: number
  fromEmail: string
  toEmail: string
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<SendRequest>(event)
    const { amount, fromEmail, toEmail } = body

    // Validate input
    if (!amount || amount <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Amount must be greater than 0'
      })
    }

    if (!fromEmail || !toEmail) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Both sender and recipient emails are required'
      })
    }

    if (fromEmail === toEmail) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Cannot send money to yourself'
      })
    }

    // Initialize Airtable
    const base = new Airtable({
      apiKey: process.env.AIRTABLE_API_KEY
    }).base(process.env.AIRTABLE_BASE_ID || '')

    const tableName = process.env.AIRTABLE_WALLET_TABLE || 'Wallets'

    // Get current wallet records for both users
    const [fromRecords, toRecords] = await Promise.all([
      base(tableName)
        .select({
          filterByFormula: `{Email} = '${fromEmail}'`,
          maxRecords: 1
        })
        .all(),
      base(tableName)
        .select({
          filterByFormula: `{Email} = '${toEmail}'`,
          maxRecords: 1
        })
        .all()
    ])

    const fromRecord = fromRecords[0]
    const toRecord = toRecords[0]

    // Check if sender has sufficient funds
    const fromCurrentAmount = fromRecord ? (fromRecord.fields.Amount as number || 0) : 0
    if (fromCurrentAmount < amount) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Insufficient funds'
      })
    }

    const now = new Date().toISOString()

    // Update sender's amount (subtract) and add transaction history
    const fromNewAmount = fromCurrentAmount - amount
    if (fromRecord && fromRecord.id) {
      // Get current sentTo history or initialize empty array
      const currentSentTo = (fromRecord.fields.sentTo as string[]) || []

      await base(tableName).update(fromRecord.id, {
        Amount: fromNewAmount,
        sentTo: [...currentSentTo, toEmail],
        'Updated At': now
      })
    }

    // Update or create receiver's amount (add) and add transaction history
    if (toRecord) {
      const toCurrentAmount = toRecord.fields.Amount as number || 0
      const toNewAmount = toCurrentAmount + amount
      // Get current receivedFrom history or initialize empty array
      const currentReceivedFrom = (toRecord.fields.receivedFrom as string[]) || []

      await base(tableName).update(toRecord.id, {
        Amount: toNewAmount,
        receivedFrom: [...currentReceivedFrom, fromEmail],
        'Updated At': now
      })
    } else {
      await base(tableName).create({
        Email: toEmail,
        Amount: amount,
        receivedFrom: [fromEmail],
        'Created At': now,
        'Updated At': now
      })
    }

    return {
      success: true,
      fromEmail,
      toEmail,
      amount,
      fromNewBalance: fromNewAmount,
      toNewBalance: toRecord
        ? (toRecord.fields.Amount as number || 0) + amount
        : amount
    }
  } catch (error: any) {
    console.error('Send API error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to send funds'
    })
  }
})
