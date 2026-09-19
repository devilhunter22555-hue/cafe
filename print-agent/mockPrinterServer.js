const net = require('net')

const PORT = Number(process.env.MOCK_PRINTER_PORT || 9999)

const server = net.createServer((socket) => {
  console.log(`[mock-printer] client connected: ${socket.remoteAddress}:${socket.remotePort}`)

  socket.on('data', (chunk) => {
    const ascii = chunk.toString('ascii', 0, chunk.length)
    const hex = chunk.toString('hex')

    console.log('\n--- RAW ESC/POS DATA ---')
    console.log(`ASCII:\n${ascii}`)
    console.log(`HEX:\n${hex}`)
    console.log('------------------------\n')
  })

  socket.on('close', () => {
    console.log('[mock-printer] client disconnected')
  })

  socket.on('error', (error) => {
    console.error('[mock-printer] socket error:', error.message)
  })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[mock-printer] listening on 0.0.0.0:${PORT}`)
})

server.on('error', (error) => {
  console.error('[mock-printer] server error:', error.message)
})
