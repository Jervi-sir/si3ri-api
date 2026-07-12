module.exports = {
  apps: [
    {
      name: 'si3ri-api',
      script: 'artisan',
      args: 'serve --host 0.0.0.0 --port 6061',
      interpreter: 'php',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'si3ri-worker',
      script: 'artisan',
      args: 'schedule:work',
      interpreter: 'php',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
    }
  ]
};
