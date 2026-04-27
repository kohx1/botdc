module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`✅ Bot conectado como ${client.user.tag}`);

    const estados = [
      { type: 3, text: '🌐 el servidor 24/7' },
      { type: 0, text: '🎮 con la comunidad' },
      { type: 3, text: '🔧 los tickets en vivo' },
      { type: 2, text: '🎵 música no stop' },
      { type: 3, text: '⚡ Online 24/7' },
      { type: 3, text: '🛡️ protegiendo el server' },
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
    setInterval(cambiarEstado, 10000);
  }
};