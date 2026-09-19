require('dotenv').config()

const express = require('express')
const cors = require('cors')
const { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } = require('node-thermal-printer')

const app = express()
const PORT = Number(process.env.PORT || 6000)
const PRINTER_IP = process.env.PRINTER_IP || '192.168.1.100'
const PRINTER_PORT = Number(process.env.PRINTER_PORT || 9100)
const PRINTER_WIDTH = Number(process.env.PRINTER_WIDTH || 48)

app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true,
}))
app.use(express.json({ limit: '2mb' }))

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

function formatCurrency(value) {
  const amount = Number(value || 0)
  return `₹${amount.toFixed(2)}`
}

async function printBill(payload) {
  const printer = new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface: `tcp://${PRINTER_IP}:${PRINTER_PORT}`,
    width: PRINTER_WIDTH,
    charset: CharacterSet.PC1252,
    removeSpecialCharacters: false,
    lineCharacter: '=',
    breakLine: BreakLine.NONE,
  })

  const items = Array.isArray(payload.items) ? payload.items : []

  printer.alignCenter()
  printer.bold(true)
  printer.setTextSize(2, 2)
  printer.println(String(payload.restaurantName || 'Restaurant'))
  printer.bold(false)
  printer.setTextNormal()
  printer.drawLine()

  printer.alignLeft()
  printer.println(`Bill #: ${payload.billNumber || 'N/A'}`)
  printer.println(`Date: ${payload.date || new Date().toLocaleString()}`)
  printer.drawLine()

  items.forEach((item) => {
    const name = String(item.name || 'Item')
    const qty = Number(item.qty || 1)
    const lineTotal = Number(item.lineTotal || item.price || 0)
    const price = Number(item.price || 0)

    printer.tableCustom([
      { text: name, align: 'LEFT', width: 0.52 },
      { text: `${qty}x`, align: 'RIGHT', width: 0.12 },
      { text: formatCurrency(price), align: 'RIGHT', width: 0.18 },
      { text: formatCurrency(lineTotal), align: 'RIGHT', width: 0.18 },
    ])
  })

  printer.drawLine()

  const rows = [
    ['Subtotal', formatCurrency(payload.subtotal || 0)],
    ['CGST', formatCurrency(payload.cgst || 0)],
    ['SGST', formatCurrency(payload.sgst || 0)],
    ['Discount', `-${formatCurrency(payload.discount || 0)}`],
    ['Total', formatCurrency(payload.total || 0)],
  ]

  rows.forEach(([label, value]) => {
    printer.tableCustom([
      { text: label, align: 'LEFT', width: 0.6 },
      { text: value, align: 'RIGHT', width: 0.4 },
    ])
  })

  printer.println(`Payment: ${payload.paymentMode || 'Cash'}`)
  printer.alignCenter()
  printer.println('Thank you, visit again!')
  printer.cut()

  await printer.execute()
}

app.post('/print-bill', async (req, res) => {
  try {
    const payload = req.body || {}

    if (!payload.restaurantName || !Array.isArray(payload.items)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bill payload. Expected restaurantName and items array.',
      })
    }

    await printBill(payload)

    return res.json({
      success: true,
      message: 'Bill sent to printer successfully.',
    })
  } catch (error) {
    console.error('Print error:', error)

    if (error && (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.name === 'TimeoutError' || /connect|refused|timeout/i.test(error.message || ''))) {
      return res.status(503).json({
        success: false,
        message: 'Printer not reachable. Check it\'s powered on and connected to the network.',
      })
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to print bill.',
    })
  }
})

app.listen(PORT, () => {
  console.log(`Print agent listening on http://localhost:${PORT}`)
  console.log(`Printer target: ${PRINTER_IP}:${PRINTER_PORT}`)
})
