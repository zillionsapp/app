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

  // Get all invite codes created by this user with usage information
  const { data: codes, error } = await (supabase as any)
    .from('invite_codes')
    .select(`
      id,
      code,
      created_at,
      is_active,
      max_uses,
      current_uses,
      invite_code_usages (
        id,
        used_by,
        used_at
      )
    `)
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    // Check if the error is because the table doesn't exist
    if (error.message?.includes('relation "invite_codes" does not exist')) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Database table not found. Please run the frontend_schema.sql file in your Supabase database.'
      })
    }

    console.error('Database error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch invite codes'
    })
  }

  // Enrich usage data with user emails
  const enrichedCodes = await Promise.all(
    (codes || []).map(async (code: any) => {
      const enrichedUsages = await Promise.all(
        (code.invite_code_usages || []).map(async (usage: any) => {
          // Fetch user email from auth.users
          const { data: userData, error: userError } = await supabase.auth.admin.getUserById(usage.used_by)
          if (!userError && userData.user) {
            return {
              id: usage.id,
              used_at: usage.used_at,
              used_by: {
                id: usage.used_by,
                email: userData.user.email
              }
            }
          }
          return usage
        })
      )

      return {
        ...code,
        usages: enrichedUsages
      }
    })
  )

  return {
    success: true,
    inviteCodes: enrichedCodes
  }
})
