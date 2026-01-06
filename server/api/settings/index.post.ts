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

  // Get the request body
  const body = await readBody(event)

  if (!body || typeof body !== 'object') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request body'
    })
  }

  // Update each setting using upsert
  for (const [key, value] of Object.entries(body)) {
    // Force paper_mode to always be true
    const finalValue = key === 'paper_mode' ? true : value

    const { error: upsertError } = await (supabase as any)
      .from('user_settings')
      .upsert({
        user_id: user.id,
        setting_key: key,
        setting_value: finalValue,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,setting_key'
      })

    if (upsertError) {
      console.error('Error updating setting:', key, upsertError)
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to update setting: ${key}`
      })
    }
  }

  return { success: true, message: 'Settings updated successfully' }
})
