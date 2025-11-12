/**
 * Server middleware to detect language based on:
 * 1. Browser Accept-Language header
 * 2. IP geolocation (German-speaking countries: DE, AT, CH)
 * 3. Cookie preference
 * 4. Default to English
 */

export default defineEventHandler(async (event) => {
  // Check if language is already set in cookie
  const cookieLang = getCookie(event, 'i18n_redirected')
  if (cookieLang) {
    return
  }

  let detectedLang = 'en' // default

  // 1. Check Accept-Language header
  const acceptLanguage = getHeader(event, 'accept-language')
  if (acceptLanguage) {
    // Parse Accept-Language header (e.g., "de-DE,de;q=0.9,en;q=0.8")
    const languages = acceptLanguage
      .split(',')
      .map((lang) => {
        const [code, q = 'q=1'] = lang.trim().split(';')
        const quality = parseFloat(q.replace('q=', ''))
        return { code: code.split('-')[0], quality }
      })
      .sort((a, b) => b.quality - a.quality)

    // Check if German is preferred
    if (languages.some((lang) => lang.code === 'de')) {
      detectedLang = 'de'
    }
  }

  // 2. If English is still default, try IP-based geolocation
  if (detectedLang === 'en') {
    try {
      // Get client IP from various headers (works with proxies like Vercel, Cloudflare)
      const ip =
        getHeader(event, 'x-forwarded-for')?.split(',')[0].trim() ||
        getHeader(event, 'cf-connecting-ip') ||
        getHeader(event, 'x-real-ip') ||
        event.node.req.socket.remoteAddress

      if (ip && ip !== '::1' && ip !== '127.0.0.1') {
        // Try to get country from IP using a free geolocation service
        // For production, consider using a more reliable service
        const geoResponse = await fetch(`https://ipapi.co/${ip}/json/`)
        if (geoResponse.ok) {
          const geoData = await geoResponse.json()
          const countryCode = geoData.country_code

          // German-speaking countries: DE, AT, CH
          if (['DE', 'AT', 'CH'].includes(countryCode)) {
            detectedLang = 'de'
          }
        }
      }
    } catch (error) {
      // Silently fail - geolocation is optional
      console.debug('IP geolocation failed:', error)
    }
  }

  // Set the detected language in a cookie for future requests
  setCookie(event, 'i18n_redirected', detectedLang, {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    secure: true,
    httpOnly: false,
    sameSite: 'lax'
  })
})
