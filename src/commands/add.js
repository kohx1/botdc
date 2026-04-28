const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add')
    .setDescription('Agregar a alguien al ticket por su ID')
    .addStringOption(opt => opt
      .setName('id')
      .setDescription('ID del usuario a agregar')
      .setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const id = interaction.options.getString('id');
    const member = await interaction.guild.members.fetch(id).catch(() => null);

    if (!member) return interaction.editReply({ content: '❌ No se encontró ningún usuario con esa ID en el servidor.' });

    try {
      await interaction.channel.permissionOverwrites.edit(member, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
      });

      await interaction.editReply({ content: `✅ ${member.user.tag} fue agregado al ticket.` });
      await interaction.channel.send(`📌 ${member} fue agregado al ticket por ${interaction.user}.`);
    } catch (error) {
      console.error(error);
      await interaction.editReply({ content: `❌ Error: ${error.message}` });
    }
  }
};