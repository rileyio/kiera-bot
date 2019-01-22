module.exports = {
  apps : [{
    name: 'kiera-bot',
    script: "./start.js",

    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    // args: 'one two',
    // node_args: "DEBUG='ldi:*'",
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      DEBUG: "ldi:*"
    }
  }],

  deploy : {
    production : {
      'post-deploy' : 'yarn install && pm2 reload ecosystem.config.js --env production'
    }
  }
};
