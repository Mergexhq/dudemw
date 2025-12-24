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
  apps: [
    {
      name: 'dudemw',
      script: './server.js',
      cwd: './',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
    },
  ],
};
