/**
 * Custom Next.js Server for Hostinger with Subdomain Support
 * 
 * This server ensures proper handling of both main domain (dudemw.com)
 * and admin subdomain (admin.dudemw.com) on Hostinger's infrastructure.
 */

const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

// Default to production if not explicitly set to development
const dev = process.env.NODE_ENV === 'development'
console.log('----------------------------------------')
console.log(`[Server] Starting up...`)
console.log(`[Server] NODE_ENV: ${process.env.NODE_ENV || 'undefined (defaulting to prod)'}`)
console.log(`[Server] Dev Mode: ${dev}`)
console.log('----------------------------------------')

const hostname = '0.0.0.0' // Bind to all network interfaces for Hostinger
const port = parseInt(process.env.PORT || '3000', 10)

// Initialize Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)

      // Get hostname from various possible headers (Hostinger compatibility)
      const host = req.headers['x-forwarded-host'] ||
        req.headers['host'] ||
        req.headers['x-original-host'] ||
        'dudemw.com'

      // Ensure the host header is properly set for middleware detection
      req.headers['host'] = host

      // Log subdomain detection for debugging
      if (host.startsWith('admin.')) {
        console.log(`[Server] Admin subdomain request: ${host}${req.url}`)
      }

      // Let Next.js handle the request (middleware will handle subdomain routing)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('Internal server error')
    }
  })
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, hostname, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
      console.log(`> Environment: ${process.env.NODE_ENV}`)
      console.log(`> Main domain: dudemw.com`)
      console.log(`> Admin subdomain: admin.dudemw.com`)
    })
})
