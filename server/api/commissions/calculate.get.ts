import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  // Set timeout for long-running operations (extend to 10 minutes)
  event.node.res.setTimeout?.(600000) // 10 minutes

  // Bearer token authentication for external cron jobs
  const headers = getHeaders(event)
  const authHeader = headers['authorization']

  // Extract Bearer token
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : null

  // Validate against environment variable
  const expectedKey = process.env.COMMISSION_API_KEY

  if (!expectedKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Commission API key not configured'
    })
  }

  if (!token || token !== expectedKey) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid or missing API key'
    })
  }

  // Create direct Supabase client to avoid Nuxt i18n context issues
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase configuration missing'
    })
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // Optional: Add target date parameter
    const query = getQuery(event)
    const targetDate = query.date as string || new Date().toISOString().split('T')[0]

    console.log(`Starting commission calculation for date: ${targetDate}`)

    // Call the commission calculation function
    const { data, error } = await supabase
      .rpc('calculate_daily_commissions')

    if (error) {
      console.error('Commission calculation error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to calculate commissions: ${error.message}`
      })
    }

    const result = {
      success: true,
      message: `Calculated commissions for ${data || 0} invite relationships`,
      commissionRecordsCreated: data || 0,
      targetDate: targetDate,
      timestamp: new Date().toISOString()
    }

    console.log('Commission calculation completed:', result)
    return result

  } catch (error: any) {
    console.error('Commission calculation endpoint error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Commission calculation failed'
    })
  }
})
