import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { inviteCode } = body

  if (!inviteCode) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invite code is required'
    })
  }

  const supabase = await serverSupabaseClient(event)

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  // Use the invite code
  const { data, error } = await (supabase as any)
    .rpc('use_invite_code', {
      invite_code_param: inviteCode,
      user_id: user.id
    })

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to use invite code'
    })
  }

  if (!data) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid or already used invite code'
    })
  }

  return {
    success: true,
    message: 'Invite code used successfully'
  }
})
