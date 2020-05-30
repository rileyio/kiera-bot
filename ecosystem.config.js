module.exports = {
  apps: [{
    name: 'kiera-bot',
    script: './app/start.js',

    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    // args: 'one two',
    // node_args: "DEBUG='kiera-bot:*'",
    instances: 1,
    autorestart: true,
    watch: ['app', 'locales'],
    ignore_watch: ['node_modules', 'logs'],
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      DEBUG: 'kiera-bot:*'
    },
    max_restarts: 1
  }],

  deploy: {
    production: {
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
}
