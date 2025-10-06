export default defineEventHandler(async (event) => {
  try {
    // Import the paper trading bot class and run it directly
    const { PaperTradingBot } = await import('../tasks/paper-trading')
    const bot = new PaperTradingBot()
    await bot.runPaperTradingCycle()

    return {
      success: true,
      message: 'Paper trading task executed successfully'
    }
  } catch (error: any) {
    console.error('Manual paper trading execution error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to execute paper trading task'
    })
  }
})
