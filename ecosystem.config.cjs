module.exports = {
  apps: [
    {
      name: 'si3ri-api',
      script: 'artisan',
      args: 'serve --host 0.0.0.0 --port 6061',
      interpreter: 'php',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
    },
    {
      name: 'si3ri-worker',
      script: 'artisan',
      args: 'schedule:work',
      interpreter: 'php',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
    },
  ],
};
