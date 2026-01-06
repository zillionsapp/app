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

  // Get all user settings
  const { data: settings, error: settingsError } = await supabase
    .from('user_settings')
    .select('setting_key, setting_value')
    .eq('user_id', user.id)

  if (settingsError) {
    console.error('Error fetching user settings:', settingsError)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch user settings'
    })
  }

  // Convert array of objects to key-value object
  const settingsObject: Record<string, any> = {}
  if (settings) {
    settings.forEach((setting: any) => {
      settingsObject[setting.setting_key] = setting.setting_value
    })
  }

  // Force paper_mode to always be true
  settingsObject.paper_mode = true

  return settingsObject
})
