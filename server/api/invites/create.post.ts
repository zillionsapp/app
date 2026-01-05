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

  // Generate a new invite code using the database function
  const { data: codeData, error: codeError } = await supabase
    .rpc('generate_invite_code')

  if (codeError || !codeData) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate invite code'
    })
  }

  // Insert the new invite code
  const { data, error } = await (supabase as any)
    .from('invite_codes')
    .insert({
      code: codeData,
      created_by: user.id
    })
    .select()
    .single()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create invite code'
    })
  }

  return {
    success: true,
    inviteCode: data
  }
})
