export default defineEventHandler(async (event) => {
  return {
    success: true,
    message: 'API routes are working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  }
})
