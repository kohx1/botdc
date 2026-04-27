const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Información del servidor y usuarios')
    .addSubcommand(sub => sub
      .setName('servidor')
      .setDescription('Muestra info del servidor'))
    .addSubcommand(sub => sub
      .setName('usuario')
      .setDescription('Muestra info de un usuario')
      .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a consultar').setRequired(false))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'servidor') {
      const guild = interaction.guild;
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(guild.name)
        .setThumbnail(guild.iconURL())
        .addFields(
          { name: '👑 Dueño', value: `<@${guild.ownerId}>`, inline: true },
          { name: '👥 Miembros', value: `${guild.memberCount}`, inline: true },
          { name: '📅 Creado', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
          { name: '💬 Canales', value: `${guild.channels.cache.size}`, inline: true },
          { name: '🎭 Roles', value: `${guild.roles.cache.size}`, inline: true },
          { name: '😀 Emojis', value: `${guild.emojis.cache.size}`, inline: true },
        )
        .setFooter({ text: `ID: ${guild.id}` })
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }

    else if (sub === 'usuario') {
      const usuario = interaction.options.getUser('usuario') || interaction.user;
      const member = await interaction.guild.members.fetch(usuario.id).catch(() => null);
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(usuario.tag)
        .setThumbnail(usuario.displayAvatarURL())
        .addFields(
          { name: '🪪 ID', value: usuario.id, inline: true },
          { name: '📅 Cuenta creada', value: `<t:${Math.floor(usuario.createdTimestamp / 1000)}:D>`, inline: true },
          { name: '📥 Se unió', value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>` : 'N/A', inline: true },
          { name: '🎭 Roles', value: member ? member.roles.cache.filter(r => r.id !== interaction.guild.id).map(r => `${r}`).join(', ') || 'Ninguno' : 'N/A', inline: false },
        )
        .setFooter({ text: `Bot de ${interaction.guild.name}` })
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }
  }
};