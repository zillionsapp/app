// server/io/index.ts
// This file is auto-registered by nuxt-socket-io's "Automatic IO Server Registration".
// It is called with the Socket.IO server instance when Nuxt boots.

import type { Server } from 'socket.io'

declare global {
  // eslint-disable-next-line no-var
  var $io: Server | undefined
}

export default function registerIO(io: Server) {
  // keep a global reference so cron jobs (and API routes) can emit
  globalThis.$io = io

  // optional: basic connection log
  io.on('connection', (socket) => {
    // join a room/namespace logic if you want
    // socket.join('solana')
    // initial push could happen here if you cache the latest price
  })
}
