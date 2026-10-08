// pm2 start ecosystem.config.js   ·   pm2 restart mapa-web mapa-tse
module.exports = {
  apps: [
    {
      name: 'mapa-web',
      script: 'src/server.js',
      env: { PORT: 3100, HOST: '0.0.0.0' },
      max_memory_restart: '400M',
    },
    {
      // sem --turno: usa o 1º turno até 24/10/2026 e troca sozinho para o 2º a partir de 25/10
      name: 'mapa-tse',
      script: 'src/updater/index.js',
      args: '--interval 30',
      max_memory_restart: '600M',
      restart_delay: 5000,
    },
  ],
};
