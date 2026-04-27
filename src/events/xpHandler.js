const { QuickDB } = require('quick.db');
const { EmbedBuilder } = require('discord.js');
const db = new QuickDB();

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot) return;

    const userId = message.author.id;
    const guildId = message.guild.id;

    const cooldown = await db.get(`cooldown_${guildId}_${userId}`);
    const ahora = Date.now();
    if (cooldown && ahora - cooldown < 60000) return;

    await db.set(`cooldown_${guildId}_${userId}`, ahora);

    const xpGanado = Math.floor(Math.random() * 10) + 5;
    const xpActual = (await db.get(`xp_${guildId}_${userId}`)) || 0;
    const nivelActual = (await db.get(`nivel_${guildId}_${userId}`)) || 0;
    const nuevoXP = xpActual + xpGanado;
    const xpNecesario = (nivelActual + 1) * 100;

    await db.set(`xp_${guildId}_${userId}`, nuevoXP);

    if (nuevoXP >= xpNecesario) {
      const nuevoNivel = nivelActual + 1;
      await db.set(`nivel_${guildId}_${userId}`, nuevoNivel);
      await db.set(`xp_${guildId}_${userId}`, 0);

      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('¡Subiste de nivel!')
        .setDescription(`${message.author} ahora es nivel **${nuevoNivel}**! ⭐`)
        .setTimestamp();

      message.channel.send({ embeds: [embed] });
    }
  }
};