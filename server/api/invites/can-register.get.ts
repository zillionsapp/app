import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const inviteCode = query.invite as string

  const supabase = await serverSupabaseClient(event)

  // Use the database function to check if user can register
  const { data, error } = await (supabase as any)
    .rpc('can_user_register', {
      invite_code_param: inviteCode || null
    })

  if (error) {
    // If error, default to false for security
    return { canRegister: false }
  }

  return { canRegister: data }
})
