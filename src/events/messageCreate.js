const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

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

    const prefix = process.env.PREFIX || '!';
    const botMention = `<@${message.client.user.id}>`;
    const botMention2 = `<@!${message.client.user.id}>`;

    let usedPrefix = null;
    if (message.content.startsWith(prefix)) usedPrefix = prefix;
    else if (message.content.startsWith(botMention)) usedPrefix = botMention;
    else if (message.content.startsWith(botMention2)) usedPrefix = botMention2;
    else return;

    const args = message.content.slice(usedPrefix.length).trim().split(/ +/);
    const comando = args.shift().toLowerCase();

    if (comando === 'ban') {
      if (!message.member.permissions.has('BanMembers')) return message.reply('❌ No tienes permisos.');
      const usuario = message.mentions.members.first();
      if (!usuario) return message.reply('❌ Usa: `!ban @usuario razón`');
      const razon = args.slice(1).join(' ') || 'Sin razón';
      await usuario.ban({ reason: razon });
      message.reply(`✅ **${usuario.user.tag}** fue baneado. Razón: ${razon}`);
    }

    else if (comando === 'kick') {
      if (!message.member.permissions.has('KickMembers')) return message.reply('❌ No tienes permisos.');
      const usuario = message.mentions.members.first();
      if (!usuario) return message.reply('❌ Usa: `!kick @usuario`');
      await usuario.kick();
      message.reply(`✅ **${usuario.user.tag}** fue expulsado.`);
    }

    else if (comando === 'clear') {
      if (!message.member.permissions.has('ManageMessages')) return message.reply('❌ No tienes permisos.');
      const cantidad = parseInt(args[0]);
      if (!cantidad || cantidad < 1 || cantidad > 100) return message.reply('❌ Usa: `!clear 1-100`');
      await message.channel.bulkDelete(cantidad + 1, true);
      const aviso = await message.channel.send(`✅ ${cantidad} mensajes eliminados.`);
      setTimeout(() => aviso.delete(), 3000);
    }

    else if (comando === 'mute') {
      if (!message.member.permissions.has('ModerateMembers')) return message.reply('❌ No tienes permisos.');
      const usuario = message.mentions.members.first();
      const minutos = parseInt(args[1]) || 10;
      if (!usuario) return message.reply('❌ Usa: `!mute @usuario minutos`');
      await usuario.timeout(minutos * 60 * 1000);
      message.reply(`✅ **${usuario.user.tag}** silenciado por ${minutos} minutos.`);
    }

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

    else if (comando === 'nivel' || comando === 'rank') {
      const usuario = message.mentions.users.first() || message.author;
      const xp = await db.get(`xp_${message.guild.id}_${usuario.id}`) || 0;
      const nivel = await db.get(`nivel_${message.guild.id}_${usuario.id}`) || 0;
      const xpSiguiente = (nivel + 1) * 100;
      const progreso = Math.floor((xp / xpSiguiente) * 20);
      const barra = '█'.repeat(progreso) + '░'.repeat(20 - progreso);
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`⭐ Nivel de ${usuario.username}`)
        .setThumbnail(usuario.displayAvatarURL())
        .addFields(
          { name: '⭐ Nivel', value: `${nivel}`, inline: true },
          { name: '✨ XP', value: `${xp} / ${xpSiguiente}`, inline: true },
          { name: '📊 Progreso', value: `\`${barra}\``, inline: false },
        )
        .setTimestamp();
      message.reply({ embeds: [embed] });
    }

    else if (comando === 'balance' || comando === 'bal') {
      const usuario = message.mentions.users.first() || message.author;
      const monedas = await db.get(`monedas_${message.guild.id}_${usuario.id}`) || 0;
      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle(`💰 Balance de ${usuario.username}`)
        .addFields({ name: 'Monedas', value: `${monedas} 🪙`, inline: true })
        .setTimestamp();
      message.reply({ embeds: [embed] });
    }

    else if (comando === 'daily') {
      const ultimo = await db.get(`daily_${message.guild.id}_${message.author.id}`) || 0;
      const ahora = Date.now();
      const cooldown = 86400000;
      if (ahora - ultimo < cooldown) {
        const restante = Math.ceil((cooldown - (ahora - ultimo)) / 3600000);
        return message.reply(`⏰ Ya reclamaste tu daily. Vuelve en **${restante} horas**.`);
      }
      const ganado = Math.floor(Math.random() * 500) + 100;
      const monedas = await db.get(`monedas_${message.guild.id}_${message.author.id}`) || 0;
      await db.set(`monedas_${message.guild.id}_${message.author.id}`, monedas + ganado);
      await db.set(`daily_${message.guild.id}_${message.author.id}`, ahora);
      message.reply(`💰 Recibiste **${ganado} 🪙**! Balance: **${monedas + ganado} 🪙**`);
    }

    else if (comando === 'top') {
      const todos = await db.all();
      const filtrados = todos
        .filter(e => e.id.startsWith(`claims_${message.guild.id}_`))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
      if (filtrados.length === 0) return message.reply('❌ Nadie ha reclamado tickets aún.');
      const lista = await Promise.all(filtrados.map(async (e, i) => {
        const id = e.id.replace(`claims_${message.guild.id}_`, '');
        const user = await message.client.users.fetch(id).catch(() => null);
        const medalla = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**${i + 1}.**`;
        return `${medalla} ${user ? user.tag : 'Usuario'} — **${e.value}** tickets`;
      }));
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🏆 Top Staff — Tickets Atendidos')
        .setDescription(lista.join('\n'))
        .setTimestamp();
      message.reply({ embeds: [embed] });
    }

    else if (comando === 'panel') {
      if (!message.member.permissions.has('Administrator')) return message.reply('❌ No tienes permisos.');
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🎫 Sistema de Tickets')
        .setDescription(
          '🔧 **SOPORTE TÉCNICO**\nResponderemos tus dudas y preguntas.\n\n' +
          '📋 **REPORTAR JUGADOR**\nReporta a un jugador que rompa las reglas.\n\n' +
          '⚠️ **REPORTE DE BUG**\nReporta cualquier bug del servidor.\n\n' +
          '💻 **SANCIONES & ANTICHEAT**\nApela tu sanción aquí con pruebas.\n\n' +
          '💰 **PAGOS TIENDA**\n¿Tienes problema con la tienda? Te ayudamos.\n\n' +
          '💀 **SOLICITAR REVIVE**\nSolicita un revive si moriste por un problema.'
        )
        .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL() })
        .setTimestamp();
      const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('ticket_categoria')
          .setPlaceholder('Click para seleccionar categoría')
          .addOptions([
            { label: 'Soporte Técnico', description: 'Responderemos tus dudas y preguntas', value: 'soporte', emoji: '🔧' },
            { label: 'Reportar jugador', description: 'Reporta a un jugador', value: 'reporte_jugador', emoji: '📋' },
            { label: 'Reporte de bug', description: 'Reporta cualquier bug del servidor', value: 'bug', emoji: '⚠️' },
            { label: 'Sanciones & Anticheat', description: 'Apela tu sanción aquí', value: 'sancion', emoji: '💻' },
            { label: 'Pagos tienda', description: 'Problema con la tienda', value: 'pagos', emoji: '💰' },
            { label: 'Solicitar revive', description: 'Solicita un revive', value: 'revive', emoji: '💀' },
          ])
      );
      await message.channel.send({ embeds: [embed], components: [menu] });
      await message.delete().catch(() => {});
    }

    else if (comando === 'logs') {
      if (!message.member.permissions.has('Administrator')) return message.reply('❌ No tienes permisos.');
      const canal = message.mentions.channels.first();
      if (!canal) return message.reply('❌ Usa: `!logs #canal`');
      await db.set(`logs_${message.guild.id}`, canal.id);
      message.reply(`✅ Logs activados en ${canal}`);
    }

    else if (comando === 'verificar') {
      if (!message.member.permissions.has('Administrator')) return message.reply('❌ No tienes permisos.');
      const nombreRol = args.join(' ');
      if (!nombreRol) return message.reply('❌ Usa: `!verificar NombreDelRol`');
      const rol = message.guild.roles.cache.find(r => r.name === nombreRol);
      if (!rol) return message.reply(`❌ No existe el rol **${nombreRol}**.`);
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('✅ Verificación')
        .setDescription('Haz clic en el botón de abajo para verificarte y acceder al servidor.')
        .setTimestamp();
      const boton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`verificar_${rol.id}`)
          .setLabel('✅ Verificarme')
          .setStyle(ButtonStyle.Success)
      );
      await message.channel.send({ embeds: [embed], components: [boton] });
      await message.delete().catch(() => {});
    }

    else if (comando === 'roles') {
      if (!message.member.permissions.has('Administrator')) return message.reply('❌ No tienes permisos.');
      const nombresRoles = args.join(' ').split(',').map(r => r.trim());
      const rolesEncontrados = nombresRoles.map(nombre =>
        message.guild.roles.cache.find(r => r.name === nombre)
      ).filter(Boolean);
      if (rolesEncontrados.length === 0) return message.reply('❌ No se encontró ningún rol. Usa: `!roles Rol1, Rol2`');
      const opciones = rolesEncontrados.map(rol => ({
        label: rol.name, value: rol.id, description: `Obtener o quitar ${rol.name}`,
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
        .setDescription('Selecciona los roles que quieres obtener o quitar.')
        .addFields({ name: 'Roles disponibles', value: rolesEncontrados.map(r => `• ${r}`).join('\n') })
        .setTimestamp();
      await message.channel.send({ embeds: [embed], components: [menu] });
      await message.delete().catch(() => {});
    }

    else if (comando === 'testwelcome') {
      const canal = message.guild.channels.cache.get(process.env.WELCOME_CHANNEL);
      if (!canal) return message.reply('❌ Canal de bienvenidas no encontrado.');
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setAuthor({ name: message.guild.name, iconURL: message.guild.iconURL() })
        .setTitle(`¡Bienvenido a ${message.guild.name}! 🎉`)
        .setDescription(
          `Hey ${message.author}, nos alegra tenerte aquí!\n\n` +
          `📖 Lee las reglas antes de participar.\n` +
          `🎫 Si necesitas ayuda abre un ticket.\n` +
          `👥 Eres el miembro número **#${message.guild.memberCount}**`
        )
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true, size: 256 }))
        .setFooter({ text: `ID: ${message.author.id}` })
        .setTimestamp();
      await canal.send({ content: `${message.author}`, embeds: [embed] });
      await message.reply('✅ Bienvenida de prueba enviada!');
    }

    else if (comando === 'ping') {
      message.reply(`🏓 Pong! **${message.client.ws.ping}ms**`);
    }

    else if (comando === 'help') {
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('📋 Comandos del Bot')
        .setDescription('Usa `!comando` o menciona al bot `@Bot comando`')
        .addFields(
          { name: '🛡️ Moderación', value: '`!ban @user razón` `!kick @user` `!mute @user min` `!clear N`', inline: false },
          { name: '🎫 Tickets', value: '`!panel` `!add ID`', inline: false },
          { name: '⚙️ Config', value: '`!logs #canal` `!verificar Rol` `!roles Rol1, Rol2`', inline: false },
          { name: '📊 Info', value: '`!nivel @user` `!balance @user` `!daily` `!top` `!ping`', inline: false },
          { name: '🧪 Test', value: '`!testwelcome`', inline: false },
        )
        .setTimestamp();
      message.reply({ embeds: [embed] });
    }
  }
};