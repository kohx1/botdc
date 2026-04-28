const { ActivityType } = require('discord.js');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`✅ Bot conectado como ${client.user.tag}`);

    const estados = [
      { type: ActivityType.Watching, text: '⚡ Online 24/7' },
      { type: ActivityType.Playing, text: '🎮 con la comunidad' },
      { type: ActivityType.Watching, text: '🛡️ protegiendo el server' },
      { type: ActivityType.Listening, text: '🎵 música no stop' },
      { type: ActivityType.Watching, text: '🔧 los tickets en vivo' },
      { type: ActivityType.Watching, text: '🌐 el servidor 24/7' },
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