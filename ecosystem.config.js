// pm2 start ecosystem.config.js   ·   pm2 restart mapa-web mapa-tse
module.exports = {
  apps: [
    {
      name: 'mapa-web',
      script: 'src/server.js',
      env: { PORT: 3100, HOST: '127.0.0.1' },
    },
    {
      name: 'mapa-tse',
      script: 'src/updater/index.js',
      args: '--interval 45',
    },
  ],
};
