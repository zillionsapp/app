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
    .select('id, is_active, current_uses, max_uses')
    .eq('code', code)
    .single()

  if (error || !data) {
    return { valid: false }
  }

  // Code is valid if it's active and has remaining uses
  const valid = (data as any).is_active && (data as any).current_uses < (data as any).max_uses

  return { valid }
})
