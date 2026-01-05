export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const symbols = query.symbols as string

  if (!symbols) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Symbols parameter is required'
    })
  }

  const symbolList = symbols.split(',')

  try {
    // Fetch real prices from Binance API
    const prices: Record<string, number> = {}

    // Binance API expects symbols in uppercase without slashes
    const binanceSymbols = symbolList.map(symbol => symbol.replace('/', '').toUpperCase())

    // Fetch prices for all symbols at once
    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbols=${JSON.stringify(binanceSymbols)}`)
    const data = await response.json()

    // Convert back to our format
    data.forEach((item: any) => {
      const symbol = item.symbol.replace('USDT', '/USDT')
      prices[symbol] = parseFloat(item.price)
    })

    return prices
  } catch (error) {
    console.error('Failed to fetch prices from Binance:', error)

    // Fallback to cached/mock prices if API fails
    const fallbackPrices: Record<string, number> = {}
    symbolList.forEach(symbol => {
      fallbackPrices[symbol] = 0
    })

    return fallbackPrices
  }
})
