/**
 * PM2 Ecosystem Configuration for Hostinger Deployment
 * 
 * This file configures PM2 process manager for running the Next.js app on Hostinger.
 * PM2 ensures your application stays online, handles crashes, and manages logs.
 * 
 * Usage:
 *   Start: pm2 start ecosystem.config.js
 *   Stop: pm2 stop dudemw
 *   Restart: pm2 restart dudemw
 *   Logs: pm2 logs dudemw
 *   Status: pm2 status
 */

module.exports = {
  apps: [{
    name: 'dudemw',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 3000',
    cwd: './',
    instances: 1,
    exec_mode: 'fork', // Fork mode for better stability on shared hosting
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '500M', // Restart if memory exceeds 500MB
    watch: false, // Disable watch in production
    ignore_watch: ['node_modules', 'logs', '.next'],
  }]
};
