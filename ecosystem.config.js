module.exports = {
  apps: [
    {
      name: 'tnt',
      script: 'node_modules/.bin/next',
      args: 'start',
      env: {
        PORT: 4007,
        NODE_ENV: 'production',
      },
    },
  ],
};
