const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add')
    .setDescription('Agregar a alguien al ticket')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a agregar').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const usuario = interaction.options.getUser('usuario');
    const member = await interaction.guild.members.fetch(usuario.id).catch(() => null);

    if (!member) return interaction.editReply({ content: '❌ Usuario no encontrado en el servidor.' });

    try {
      await interaction.channel.permissionOverwrites.edit(member, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
      });

      await interaction.editReply({ content: `✅ ${usuario} fue agregado al ticket.` });
      await interaction.channel.send(`📌 ${usuario} fue agregado al ticket por ${interaction.user}.`);
    } catch (error) {
      console.error(error);
      await interaction.editReply({ content: `❌ Error: ${error.message}` });
    }
  }
};