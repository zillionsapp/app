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

  // Get all invite codes created by this user
  const { data, error } = await (supabase as any)
    .from('invite_codes')
    .select(`
      id,
      code,
      created_at,
      used_at,
      is_active,
      used_by
    `)
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    // Check if the error is because the table doesn't exist
    if (error.message?.includes('relation "invite_codes" does not exist')) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Database table not found. Please run the supabase_schema.sql file in your Supabase database.'
      })
    }

    console.error('Database error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch invite codes'
    })
  }

  return {
    success: true,
    inviteCodes: data || []
  }
})
