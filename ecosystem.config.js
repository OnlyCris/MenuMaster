module.exports = {
  apps: [{
    name: 'menuisland',
    script: 'dist/index.js',
    cwd: '/var/www/menuisland',
    instances: 'max',
    exec_mode: 'cluster',
    
    // Environment
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    
    // Logging
    error_file: '/var/log/pm2/menuisland-error.log',
    out_file: '/var/log/pm2/menuisland-out.log',
    log_file: '/var/log/pm2/menuisland.log',
    time: true,
    
    // Performance
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    
    // Auto restart
    watch: false,
    ignore_watch: ['node_modules', 'uploads', 'logs'],
    
    // Graceful restart
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000
  }]
};