module.exports = {
  apps: [{
    autorestart: true,
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      DEBUG: 'kiera-bot:*',
      NODE_ENV: 'production'
    },
    ignore_watch: ['node_modules', 'logs'],
    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    // args: 'one two',
    // node_args: "DEBUG='kiera-bot:*'",
    instances: 1,
    max_memory_restart: '1G',
    max_restarts: 1,
    name: 'kiera-bot',
    script: './app/start.js',
    watch: ['app', 'locales']
  }],
  deploy: {
    production: {
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
}