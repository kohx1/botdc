module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot) return;

    // Anti-spam de links
    const palabrasProhibidas = ['discord.gg', 'bit.ly'];
    if (palabrasProhibidas.some(p => message.content.toLowerCase().includes(p))) {
      await message.delete();
      const aviso = await message.channel.send(`${message.author} ⚠️ No se permiten links en este servidor.`);
      setTimeout(() => aviso.delete(), 5000);
      return;
    }

    // Comandos con prefijo !
    const prefix = process.env.PREFIX || '!';
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const comando = args.shift().toLowerCase();

    // !ban @usuario razón
    if (comando === 'ban') {
      if (!message.member.permissions.has('BanMembers')) return message.reply('❌ No tienes permisos.');
      const usuario = message.mentions.members.first();
      if (!usuario) return message.reply('❌ Menciona un usuario. Ej: `!ban @usuario razón`');
      const razon = args.slice(1).join(' ') || 'Sin razón';
      await usuario.ban({ reason: razon });
      message.reply(`✅ **${usuario.user.tag}** fue baneado. Razón: ${razon}`);
    }

    // !kick @usuario
    else if (comando === 'kick') {
      if (!message.member.permissions.has('KickMembers')) return message.reply('❌ No tienes permisos.');
      const usuario = message.mentions.members.first();
      if (!usuario) return message.reply('❌ Menciona un usuario. Ej: `!kick @usuario`');
      await usuario.kick();
      message.reply(`✅ **${usuario.user.tag}** fue expulsado.`);
    }

    // !clear 10
    else if (comando === 'clear') {
      if (!message.member.permissions.has('ManageMessages')) return message.reply('❌ No tienes permisos.');
      const cantidad = parseInt(args[0]);
      if (!cantidad || cantidad < 1 || cantidad > 100) return message.reply('❌ Usa: `!clear 1-100`');
      await message.channel.bulkDelete(cantidad + 1, true);
      const aviso = await message.channel.send(`✅ ${cantidad} mensajes eliminados.`);
      setTimeout(() => aviso.delete(), 3000);
    }

    // !mute @usuario 10
    else if (comando === 'mute') {
      if (!message.member.permissions.has('ModerateMembers')) return message.reply('❌ No tienes permisos.');
      const usuario = message.mentions.members.first();
      const minutos = parseInt(args[1]) || 10;
      if (!usuario) return message.reply('❌ Usa: `!mute @usuario minutos`');
      await usuario.timeout(minutos * 60 * 1000);
      message.reply(`✅ **${usuario.user.tag}** silenciado por ${minutos} minutos.`);
    }

    // !add ID
    else if (comando === 'add') {
      if (!message.member.permissions.has('ManageChannels')) return message.reply('❌ No tienes permisos.');
      const id = args[0];
      if (!id) return message.reply('❌ Usa: `!add ID_del_usuario`');
      const member = await message.guild.members.fetch(id).catch(() => null);
      if (!member) return message.reply('❌ Usuario no encontrado.');
      await message.channel.permissionOverwrites.edit(member, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
      });
      message.reply(`✅ ${member} fue agregado al ticket.`);
    }

    // !nivel @usuario
    else if (comando === 'nivel' || comando === 'rank') {
      const { QuickDB } = require('quick.db');
      const db = new QuickDB();
      const usuario = message.mentions.users.first() || message.author;
      const xp = await db.get(`xp_${message.guild.id}_${usuario.id}`) || 0;
      const nivel = await db.get(`nivel_${message.guild.id}_${usuario.id}`) || 0;
      message.reply(`⭐ **${usuario.username}** — Nivel: **${nivel}** | XP: **${xp}**`);
    }

    // !ping
    else if (comando === 'ping') {
      message.reply(`🏓 Pong! **${message.client.ws.ping}ms**`);
    }

    // !help
    else if (comando === 'help') {
      message.reply(
        '📋 **Comandos disponibles:**\n' +
        '`!ban @usuario razón` — Banear\n' +
        '`!kick @usuario` — Expulsar\n' +
        '`!mute @usuario minutos` — Silenciar\n' +
        '`!clear cantidad` — Eliminar mensajes\n' +
        '`!add ID` — Agregar al ticket\n' +
        '`!nivel @usuario` — Ver nivel\n' +
        '`!ping` — Ver latencia'
      );
    }
  }
};