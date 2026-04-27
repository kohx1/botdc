const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Enviar panel de tickets al canal')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('🎫 Sistema de Tickets')
      .setDescription(
        '🔧 **SOPORTE TÉCNICO**\nResponderemos tus dudas y preguntas.\n\n' +
        '📋 **REPORTAR JUGADOR**\nReporta a un jugador que rompa las reglas.\n\n' +
        '⚠️ **REPORTE DE BUG**\nReporta cualquier bug del servidor.\n\n' +
        '💻 **SANCIONES & ANTICHEAT**\nApela tu sanción aquí con pruebas.\n\n' +
        '💰 **PAGOS TIENDA**\n¿Tienes problema con la tienda? Te ayudamos.\n\n' +
        '💀 **SOLICITAR REVIVE**\nSolicita un revive si moriste por un problema.'
      )
      .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() })
      .setTimestamp();

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('ticket_categoria')
        .setPlaceholder('Click para seleccionar categoría')
        .addOptions([
          { label: 'Soporte Técnico', description: 'Responderemos tus dudas y preguntas', value: 'soporte', emoji: '🔧' },
          { label: 'Reportar jugador', description: 'Reporta a un jugador', value: 'reporte_jugador', emoji: '📋' },
          { label: 'Reporte de bug', description: 'Reporta cualquier bug del servidor', value: 'bug', emoji: '⚠️' },
          { label: 'Sanciones & Anticheat', description: 'Apela tu sanción aquí', value: 'sancion', emoji: '💻' },
          { label: 'Pagos tienda', description: 'Problema con la tienda', value: 'pagos', emoji: '💰' },
          { label: 'Solicitar revive', description: 'Solicita un revive', value: 'revive', emoji: '💀' },
        ])
    );

    await interaction.channel.send({ embeds: [embed], components: [menu] });
    await interaction.reply({ content: '✅ Panel enviado.', ephemeral: true });
  }
};