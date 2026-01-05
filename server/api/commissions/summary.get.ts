import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  // Get commission summary using the database function
  const { data, error } = await (supabase as any)
    .rpc('get_user_commission_summary', {
      user_id: user.id
    })

  if (error) {
    console.error('Database error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch commission summary'
    })
  }

  return {
    success: true,
    summary: data
  }
})
