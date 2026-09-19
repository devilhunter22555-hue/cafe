# Local Thermal Print Agent

This tiny Node.js service accepts bill payloads from the POS frontend and sends ESC/POS commands to a network thermal printer.

## Setup

1. Copy `.env.example` to `.env`
2. Set the printer IP and port
   - Example: `PRINTER_IP=192.168.1.100`, `PRINTER_PORT=9100`
   - If you are testing locally without hardware, set:
     - `PRINTER_IP=127.0.0.1`
     - `PRINTER_PORT=9999`
3. Install dependencies:

```bash
npm install
```

4. Start the service:

```bash
npm start
```

## Health check

```bash
curl http://localhost:6000/health
```

## Mock printer for local testing

Run the mock TCP listener:

```bash
node mockPrinterServer.js
```

This listens on port `9999` and logs the exact raw bytes and decoded ASCII that would be sent to a real thermal printer.
