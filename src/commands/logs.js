const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('logs')
    .setDescription('Configurar logs de moderación')
    .addSubcommand(sub => sub
      .setName('activar')
      .setDescription('Activar logs en un canal')
      .addChannelOption(opt => opt.setName('canal').setDescription('Canal de logs').setRequired(true)))
    .addSubcommand(sub => sub
      .setName('desactivar')
      .setDescription('Desactivar logs'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'activar') {
      const canal = interaction.options.getChannel('canal');
      await db.set(`logs_${guildId}`, canal.id);
      await interaction.reply({ content: `✅ Logs activados en ${canal}`, ephemeral: true });
    }

    else if (sub === 'desactivar') {
      await db.delete(`logs_${guildId}`);
      await interaction.reply({ content: '✅ Logs desactivados.', ephemeral: true });
    }
  }
};