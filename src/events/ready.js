const { ActivityType } = require('discord.js');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`✅ Bot conectado como ${client.user.tag}`);

    const estados = [
      { type: ActivityType.Watching, text: '⚡ Online 24/7' },
      { type: ActivityType.Playing, text: '🎮 Con la comunidad' },
      { type: ActivityType.Watching, text: '🛡️ Protegiendo el server' },
      { type: ActivityType.Watching, text: '🔧 Los tickets en vivo' },
      { type: ActivityType.Watching, text: '🌐 El servidor 24/7' },
    ];

    let i = 0;
    const cambiarEstado = () => {
      const estado = estados[i % estados.length];
      client.user.setPresence({
        activities: [{ name: estado.text, type: estado.type }],
        status: 'online',
      });
      i++;
    };

    cambiarEstado();
    setInterval(cambiarEstado, 15000);
  }
};