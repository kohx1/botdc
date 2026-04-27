const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verificar')
    .setDescription('Sistema de verificación')
    .addSubcommand(sub => sub
      .setName('panel')
      .setDescription('Enviar panel de verificación al canal')
      .addStringOption(opt => opt.setName('rol').setDescription('Nombre del rol a dar al verificarse').setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'panel') {
      const nombreRol = interaction.options.getString('rol');
      const rol = interaction.guild.roles.cache.find(r => r.name === nombreRol);
      if (!rol) return interaction.reply({ content: `❌ No existe el rol **${nombreRol}**.`, ephemeral: true });

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('✅ Verificación')
        .setDescription('Haz clic en el botón de abajo para verificarte y acceder al servidor.')
        .setTimestamp();

      const boton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`verificar_${rol.id}`)
          .setLabel('✅ Verificarme')
          .setStyle(ButtonStyle.Success)
      );

      await interaction.channel.send({ embeds: [embed], components: [boton] });
      await interaction.reply({ content: '✅ Panel de verificación enviado.', ephemeral: true });
    }
  }
};