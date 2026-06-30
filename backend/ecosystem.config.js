module.exports = {
  apps: [
    {
      name: 'hr-system-backend',
      script: 'server.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
        LOG_LEVEL: 'info',
        CLOUDWATCH_GROUP_NAME: '/aws/ec2/hr-system-backend',
        CLOUDWATCH_STREAM_NAME: 'backend-stream'
      }
    }
  ]
};
