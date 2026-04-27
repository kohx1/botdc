const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Estadísticas detalladas del servidor'),

  async execute(interaction) {
    await interaction.deferReply();
    const guild = interaction.guild;
    await guild.members.fetch();

    const total = guild.memberCount;
    const bots = guild.members.cache.filter(m => m.user.bot).size;
    const humanos = total - bots;
    const enLinea = guild.members.cache.filter(m => m.presence?.status === 'online').size;
    const canalesTexto = guild.channels.cache.filter(c => c.type === 0).size;
    const canalesVoz = guild.channels.cache.filter(c => c.type === 2).size;
    const roles = guild.roles.cache.size - 1;
    const emojis = guild.emojis.cache.size;
    const creado = Math.floor(guild.createdTimestamp / 1000);

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`📊 Estadísticas de ${guild.name}`)
      .setThumbnail(guild.iconURL())
      .addFields(
        { name: '👥 Total miembros', value: `${total}`, inline: true },
        { name: '👤 Humanos', value: `${humanos}`, inline: true },
        { name: '🤖 Bots', value: `${bots}`, inline: true },
        { name: '🟢 En línea', value: `${enLinea}`, inline: true },
        { name: '💬 Canales texto', value: `${canalesTexto}`, inline: true },
        { name: '🔊 Canales voz', value: `${canalesVoz}`, inline: true },
        { name: '🎭 Roles', value: `${roles}`, inline: true },
        { name: '😀 Emojis', value: `${emojis}`, inline: true },
        { name: '📅 Creado', value: `<t:${creado}:R>`, inline: true },
      )
      .setFooter({ text: `ID: ${guild.id}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};