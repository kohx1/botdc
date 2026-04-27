module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot) return;

    // Anti-spam de links (puedes agregar más palabras)
    const palabrasProhibidas = ['discord.gg', 'bit.ly'];
    if (palabrasProhibidas.some(p => message.content.toLowerCase().includes(p))) {
      await message.delete();
      const aviso = await message.channel.send(`${message.author} ⚠️ No se permiten links en este servidor.`);
      setTimeout(() => aviso.delete(), 5000);
      return;
    }

    // Respuestas automáticas
    const contenido = message.content.toLowerCase();
    if (contenido === 'hola') message.reply('¡Hola! ¿En qué te puedo ayudar?');
    if (contenido === 'ping') message.reply('🏓 Pong!');
  }
};