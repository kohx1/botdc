const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add')
    .setDescription('Agregar a alguien al ticket')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a agregar').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const usuario = interaction.options.getUser('usuario');
    const member = await interaction.guild.members.fetch(usuario.id).catch(() => null);
    if (!member) return interaction.reply({ content: '❌ Usuario no encontrado.', ephemeral: true });

    await interaction.channel.permissionOverwrites.edit(member.id, {
      ViewChannel: true,
      SendMessages: true,
    });

    await interaction.reply({ content: `✅ ${usuario} fue agregado al ticket.` });
  }
};