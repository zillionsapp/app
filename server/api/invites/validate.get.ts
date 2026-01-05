import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const code = query.code as string

  if (!code) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invite code is required'
    })
  }

  const supabase = await serverSupabaseClient(event)

  // Check if code exists and is valid
  const { data, error } = await supabase
    .from('invite_codes')
    .select('id, is_active, used_by')
    .eq('code', code)
    .single()

  if (error || !data) {
    return { valid: false }
  }

  // Code is valid if it's active and not used
  const valid = (data as any).is_active && !(data as any).used_by

  return { valid }
})
