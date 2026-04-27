const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    const canal = member.guild.channels.cache.find(c => c.name === 'bienvenidas');
    if (!canal) return;

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('¡Bienvenido al servidor!')
      .setDescription(`Hola ${member}! Eres el miembro **#${member.guild.memberCount}**.\nLee las reglas y disfruta tu estadía.`)
      .setThumbnail(member.user.displayAvatarURL())
      .setFooter({ text: member.guild.name })
      .setTimestamp();

    canal.send({ embeds: [embed] });

    const rol = member.guild.roles.cache.find(r => r.name === 'Miembro');
    if (rol) member.roles.add(rol);
  }
};