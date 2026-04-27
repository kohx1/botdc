const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roles')
    .setDescription('Panel de roles por selección')
    .addSubcommand(sub => sub
      .setName('panel')
      .setDescription('Crear panel de roles')
      .addStringOption(opt => opt
        .setName('roles')
        .setDescription('Roles separados por coma (ej: Gamer, Músico, Artista)')
        .setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'panel') {
      const nombresRoles = interaction.options.getString('roles').split(',').map(r => r.trim());
      const rolesEncontrados = nombresRoles.map(nombre => {
        return interaction.guild.roles.cache.find(r => r.name === nombre);
      }).filter(Boolean);

      if (rolesEncontrados.length === 0) return interaction.reply({ content: '❌ No se encontró ningún rol válido.', ephemeral: true });

      const opciones = rolesEncontrados.map(rol => ({
        label: rol.name,
        value: rol.id,
        description: `Obtener o quitar el rol ${rol.name}`,
      }));

      const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('menu_roles')
          .setPlaceholder('Selecciona un rol...')
          .setMinValues(0)
          .setMaxValues(opciones.length)
          .addOptions(opciones)
      );

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🎭 Panel de Roles')
        .setDescription('Selecciona los roles que quieres obtener o quitar del menú de abajo.')
        .addFields({ name: 'Roles disponibles', value: rolesEncontrados.map(r => `• ${r}`).join('\n') })
        .setTimestamp();

      await interaction.channel.send({ embeds: [embed], components: [menu] });
      await interaction.reply({ content: '✅ Panel de roles creado.', ephemeral: true });
    }
  }
};