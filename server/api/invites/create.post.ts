import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  let body: any = {}
  try {
    body = await readBody(event) || {}
  } catch (error) {
    // No body sent, use defaults
    body = {}
  }
  const { maxUses = 1, commissionRate = 0.10 } = body

  const supabase = await serverSupabaseClient(event)

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  // Validate maxUses
  if (typeof maxUses !== 'number' || maxUses < 1 || maxUses > 1000) {
    throw createError({
      statusCode: 400,
      statusMessage: 'maxUses must be a number between 1 and 1000'
    })
  }

  // Validate commissionRate
  if (typeof commissionRate !== 'number' || commissionRate < 0 || commissionRate > 0.2) {
    throw createError({
      statusCode: 400,
      statusMessage: 'commissionRate must be a number between 0 and 0.2 (e.g., 0.10 for 10%, max 20%)'
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
      created_by: user.id,
      max_uses: maxUses,
      commission_rate: commissionRate
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
