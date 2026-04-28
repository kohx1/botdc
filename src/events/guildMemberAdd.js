const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    const canalBienvenida = member.guild.channels.cache.get(process.env.WELCOME_CHANNEL);
    if (!canalBienvenida) return;

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setAuthor({ name: member.guild.name, iconURL: member.guild.iconURL() })
      .setTitle(`¡Bienvenido a ${member.guild.name}! 🎉`)
      .setDescription(
        `Hey ${member}, nos alegra tenerte aquí!\n\n` +
        `📖 Lee las reglas antes de participar.\n` +
        `🎫 Si necesitas ayuda abre un ticket.\n` +
        `👥 Eres el miembro número **#${member.guild.memberCount}**`
      )
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setFooter({ text: `ID: ${member.id}` })
      .setTimestamp();

    await canalBienvenida.send({ content: `${member}`, embeds: [embed] });

    const rol = member.guild.roles.cache.find(r => r.name === 'Miembro');
    if (rol) await member.roles.add(rol);
  }
};