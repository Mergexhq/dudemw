/**
 * PM2 Ecosystem Configuration for Hostinger Cloud Hosting
 * 
 * Optimized for Hostinger's cloud infrastructure with:
 * - Cluster mode for better CPU utilization
 * - Automatic log rotation
 * - Memory management
 * - Auto-restart on crashes
 * 
 * Usage:
 *   Start: pm2 start ecosystem.config.js
 *   Stop: pm2 stop dudemw
 *   Restart: pm2 restart dudemw
 *   Reload (zero-downtime): pm2 reload dudemw
 *   Logs: pm2 logs dudemw
 *   Status: pm2 status
 *   Monitor: pm2 monit
 */

module.exports = {
  apps: [{
    name: 'dudemw',
    script: 'server.js',
    // args: 'start -p 3000', // Not needed for custom server
    cwd: './',

    // Cluster mode for better performance (use max 2 instances on Hostinger)
    instances: process.env.PM2_INSTANCES || 1,
    exec_mode: 'cluster',

    // Environment variables
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NODE_OPTIONS: '--max-old-space-size=2048' // Optimize memory for Hostinger
    },

    // Logging with rotation
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,

    // Log rotation to prevent disk space issues
    max_size: '10M',
    retain: 5, // Keep last 5 log files

    // Auto-restart configuration
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 4000,

    // Memory management (restart if exceeds 1GB on Hostinger)
    max_memory_restart: '1G',

    // Performance monitoring
    watch: false,
    ignore_watch: ['node_modules', 'logs', '.next', '.git'],

    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,

    // Error handling
    exp_backoff_restart_delay: 100,
  }]
};
