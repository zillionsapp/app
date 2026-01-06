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

  const body = await readBody(event)
  const { codeId } = body

  if (!codeId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invite code ID is required'
    })
  }

  // Update the invite code to deactivate it
  const { data, error } = await (supabase as any)
    .from('invite_codes')
    .update({ is_active: false })
    .eq('id', codeId)
    .eq('created_by', user.id) // Ensure user can only deactivate their own codes
    .select()

  if (error) {
    console.error('Database error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to deactivate invite code'
    })
  }

  if (!data || data.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Invite code not found or not owned by user'
    })
  }

  return {
    success: true,
    message: 'Invite code deactivated successfully'
  }
})
