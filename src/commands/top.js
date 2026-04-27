const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('top')
    .setDescription('Ranking de tickets atendidos por el staff'),

  async execute(interaction) {
    await interaction.deferReply();
    const todos = await db.all();
    const filtrados = todos
      .filter(e => e.id.startsWith(`claims_${interaction.guild.id}_`))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    if (filtrados.length === 0) {
      return interaction.editReply({ content: '❌ Nadie ha reclamado tickets aún.' });
    }

    const lista = await Promise.all(filtrados.map(async (e, i) => {
      const id = e.id.replace(`claims_${interaction.guild.id}_`, '');
      const user = await interaction.client.users.fetch(id).catch(() => null);
      const medalla = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**${i + 1}.**`;
      return `${medalla} ${user ? user.tag : 'Usuario'} — **${e.value}** tickets`;
    }));

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('🏆 Top Staff — Tickets Atendidos')
      .setDescription(lista.join('\n'))
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};