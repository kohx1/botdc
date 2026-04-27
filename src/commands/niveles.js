const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nivel')
    .setDescription('Ver tu nivel y XP')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a consultar').setRequired(false)),

  async execute(interaction) {
    const usuario = interaction.options.getUser('usuario') || interaction.user;
    const xp = await db.get(`xp_${interaction.guild.id}_${usuario.id}`) || 0;
    const nivel = await db.get(`nivel_${interaction.guild.id}_${usuario.id}`) || 0;
    const xpSiguiente = (nivel + 1) * 100;
    const progreso = Math.floor((xp / xpSiguiente) * 20);
    const barra = '█'.repeat(progreso) + '░'.repeat(20 - progreso);

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`Nivel de ${usuario.username}`)
      .setThumbnail(usuario.displayAvatarURL())
      .addFields(
        { name: '⭐ Nivel', value: `${nivel}`, inline: true },
        { name: '✨ XP', value: `${xp} / ${xpSiguiente}`, inline: true },
        { name: '📊 Progreso', value: `\`${barra}\``, inline: false },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};