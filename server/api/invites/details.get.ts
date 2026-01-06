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

  // Get invite code details
  const { data, error } = await supabase
    .from('invite_codes')
    .select(`
      id,
      code,
      max_uses,
      current_uses,
      commission_rate,
      is_active,
      created_at
    `)
    .eq('code', code)
    .single()

  if (error || !data) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Invite code not found'
    })
  }

  // Check if code is valid for registration
  const isValid = (data as any).is_active && (data as any).current_uses < (data as any).max_uses

  return {
    code: (data as any).code,
    maxUses: (data as any).max_uses,
    currentUses: (data as any).current_uses,
    commissionRate: (data as any).commission_rate,
    commissionRatePercent: ((data as any).commission_rate * 100).toFixed(1),
    isActive: (data as any).is_active,
    isValid,
    remainingUses: (data as any).max_uses - (data as any).current_uses
  }
})
