const { EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

async function enviarLog(guild, embed) {
  const canalId = await db.get(`logs_${guild.id}`);
  if (!canalId) return;
  const canal = guild.channels.cache.get(canalId);
  if (canal) canal.send({ embeds: [embed] });
}

module.exports = [
  {
    name: 'guildMemberRemove',
    async execute(member) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('👤 Miembro salió')
        .setDescription(`${member.user.tag}`)
        .addFields({ name: 'ID', value: member.id, inline: true })
        .setTimestamp();
      await enviarLog(member.guild, embed);
    }
  },
  {
    name: 'messageDelete',
    async execute(message) {
      if (!message.guild || message.author?.bot) return;
      const embed = new EmbedBuilder()
        .setColor('#FFA500')
        .setTitle('🗑️ Mensaje eliminado')
        .addFields(
          { name: 'Autor', value: message.author?.tag || 'Desconocido', inline: true },
          { name: 'Canal', value: `${message.channel}`, inline: true },
          { name: 'Contenido', value: message.content || 'Sin contenido', inline: false },
        )
        .setTimestamp();
      await enviarLog(message.guild, embed);
    }
  },
  {
    name: 'messageUpdate',
    async execute(oldMessage, newMessage) {
      if (!oldMessage.guild || oldMessage.author?.bot) return;
      if (oldMessage.content === newMessage.content) return;
      const embed = new EmbedBuilder()
        .setColor('#FFFF00')
        .setTitle('✏️ Mensaje editado')
        .addFields(
          { name: 'Autor', value: oldMessage.author?.tag || 'Desconocido', inline: true },
          { name: 'Canal', value: `${oldMessage.channel}`, inline: true },
          { name: 'Antes', value: oldMessage.content || 'Sin contenido', inline: false },
          { name: 'Después', value: newMessage.content || 'Sin contenido', inline: false },
        )
        .setTimestamp();
      await enviarLog(oldMessage.guild, embed);
    }
  }
];