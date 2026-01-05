import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
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

  const supabase = await serverSupabaseClient(event)

  try {
    // Get the current user (if authenticated)
    const { data: { user } } = await supabase.auth.getUser()

    // Call the commission calculation function
    const { data, error } = await supabase
      .rpc('calculate_daily_commissions')

    if (error) {
      console.error('Commission calculation error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to calculate commissions'
      })
    }

    return {
      success: true,
      message: `Calculated commissions for ${data || 0} invite relationships`,
      commissionRecordsCreated: data || 0,
      timestamp: new Date().toISOString()
    }
  } catch (error: any) {
    console.error('Commission calculation endpoint error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Commission calculation failed'
    })
  }
})
