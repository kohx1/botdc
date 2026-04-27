const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mod')
    .setDescription('Comandos de moderación')
    .addSubcommand(sub => sub
      .setName('ban')
      .setDescription('Banear a un usuario')
      .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a banear').setRequired(true))
      .addStringOption(opt => opt.setName('razon').setDescription('Razón del ban').setRequired(false)))
    .addSubcommand(sub => sub
      .setName('kick')
      .setDescription('Expulsar a un usuario')
      .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a expulsar').setRequired(true))
      .addStringOption(opt => opt.setName('razon').setDescription('Razón').setRequired(false)))
    .addSubcommand(sub => sub
      .setName('clear')
      .setDescription('Eliminar mensajes')
      .addIntegerOption(opt => opt.setName('cantidad').setDescription('Cantidad de mensajes (máx 100)').setRequired(true).setMinValue(1).setMaxValue(100)))
    .addSubcommand(sub => sub
      .setName('mute')
      .setDescription('Silenciar a un usuario')
      .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a silenciar').setRequired(true))
      .addIntegerOption(opt => opt.setName('minutos').setDescription('Duración en minutos').setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const usuario = interaction.options.getUser('usuario');
    const razon = interaction.options.getString('razon') || 'Sin razón especificada';

    if (sub === 'ban') {
      const member = await interaction.guild.members.fetch(usuario.id).catch(() => null);
      if (!member) return interaction.reply({ content: 'Usuario no encontrado.', ephemeral: true });
      await member.ban({ reason: razon });
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('Usuario Baneado')
        .addFields(
          { name: 'Usuario', value: usuario.tag, inline: true },
          { name: 'Razón', value: razon, inline: true }
        )
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }

    else if (sub === 'kick') {
      const member = await interaction.guild.members.fetch(usuario.id).catch(() => null);
      if (!member) return interaction.reply({ content: 'Usuario no encontrado.', ephemeral: true });
      await member.kick(razon);
      const embed = new EmbedBuilder()
        .setColor('#FFA500')
        .setTitle('Usuario Expulsado')
        .addFields(
          { name: 'Usuario', value: usuario.tag, inline: true },
          { name: 'Razón', value: razon, inline: true }
        )
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }

    else if (sub === 'clear') {
      const cantidad = interaction.options.getInteger('cantidad');
      await interaction.channel.bulkDelete(cantidad, true);
      await interaction.reply({
        content: `✅ ${cantidad} mensajes eliminados.`,
        ephemeral: true
      });
    }

    else if (sub === 'mute') {
      const member = await interaction.guild.members.fetch(usuario.id).catch(() => null);
      if (!member) return interaction.reply({ content: 'Usuario no encontrado.', ephemeral: true });
      const minutos = interaction.options.getInteger('minutos');
      await member.timeout(minutos * 60 * 1000, razon);
      const embed = new EmbedBuilder()
        .setColor('#FFFF00')
        .setTitle('Usuario Silenciado')
        .addFields(
          { name: 'Usuario', value: usuario.tag, inline: true },
          { name: 'Duración', value: `${minutos} minutos`, inline: true }
        )
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }
  }
};