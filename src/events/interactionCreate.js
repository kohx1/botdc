const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits, AttachmentBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

const categorias = {
  soporte: { nombre: 'Soporte Técnico', emoji: '🔧', preguntas: ['¿Cuál es tu nick?', '¿Cuál es tu duda?'] },
  reporte_jugador: { nombre: 'Reportar Jugador', emoji: '📋', preguntas: ['¿Cuál es tu nick?', '¿A quién reportas y por qué?'] },
  bug: { nombre: 'Reporte de Bug', emoji: '⚠️', preguntas: ['¿Cuál es tu nick?', '¿Qué bug encontraste?'] },
  sancion: { nombre: 'Sanciones & Anticheat', emoji: '💻', preguntas: ['¿Cuál es tu nick?', '¿Por qué apelas tu sanción?'] },
  pagos: { nombre: 'Pagos Tienda', emoji: '💰', preguntas: ['¿Cuál es tu nick?', '¿Cuál es tu problema con la tienda?'] },
  revive: { nombre: 'Solicitar Revive', emoji: '💀', preguntas: ['¿Cuál es tu nick?', '¿Cómo y dónde moriste?'] },
};

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {

    // ── Comandos slash ──
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        const msg = { content: '❌ Hubo un error ejecutando este comando.', ephemeral: true };
        interaction.replied ? interaction.followUp(msg) : interaction.reply(msg);
      }
      return;
    }

    // ── Menú de categoría de ticket ──
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_categoria') {
      const categoria = interaction.values[0];
      const info = categorias[categoria];

      const modal = new ModalBuilder()
        .setCustomId(`ticket_modal_${categoria}`)
        .setTitle(info.nombre);

      const nick = new TextInputBuilder()
        .setCustomId('nick')
        .setLabel(info.preguntas[0])
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Escribe aquí tu nombre en el servidor.')
        .setRequired(true);

      const descripcion = new TextInputBuilder()
        .setCustomId('descripcion')
        .setLabel(info.preguntas[1])
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Explica como podemos ayudarte.')
        .setMaxLength(1024)
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(nick),
        new ActionRowBuilder().addComponents(descripcion)
      );

      await interaction.showModal(modal);
      return;
    }

    // ── Modal enviado → crear canal de ticket ──
    if (interaction.isModalSubmit() && interaction.customId.startsWith('ticket_modal_')) {
      const categoria = interaction.customId.replace('ticket_modal_', '');
      const info = categorias[categoria];
      const nick = interaction.fields.getTextInputValue('nick');
      const descripcion = interaction.fields.getTextInputValue('descripcion');

      await interaction.deferReply({ ephemeral: true });

      const ticketExistente = interaction.guild.channels.cache.find(
        c => c.name === `ticket-${interaction.user.username}`
      );
      if (ticketExistente) {
        return interaction.editReply({ content: `❌ Ya tienes un ticket abierto: ${ticketExistente}` });
      }

      const contador = (await db.get(`ticket_contador_${interaction.guild.id}`)) || 0;
      const nuevoContador = contador + 1;
      await db.set(`ticket_contador_${interaction.guild.id}`, nuevoContador);

      const canal = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
        ],
      });

      await db.set(`ticket_${canal.id}`, {
        userId: interaction.user.id,
        categoria,
        nick,
        descripcion,
        numero: nuevoContador,
        claimedBy: null,
        abierto: true,
        mensajes: [],
      });

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`${info.emoji} ${info.nombre} — #${nuevoContador}`)
        .addFields(
          { name: '👤 Usuario', value: `${interaction.user}`, inline: true },
          { name: '🎮 Nick', value: nick, inline: true },
          { name: '📝 Descripción', value: descripcion, inline: false },
        )
        .setFooter({ text: 'El staff te atenderá pronto.' })
        .setTimestamp();

      const botones = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('claim_ticket').setLabel('📌 Reclamar').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('cerrar_ticket').setLabel('🔒 Cerrar').setStyle(ButtonStyle.Danger),
      );

      await canal.send({ content: `${interaction.user}`, embeds: [embed], components: [botones] });
      await interaction.editReply({ content: `✅ Tu ticket fue creado: ${canal}` });
      return;
    }

    // ── Botón: Reclamar ticket ──
    if (interaction.isButton() && interaction.customId === 'claim_ticket') {
      const data = await db.get(`ticket_${interaction.channel.id}`);
      if (!data) return interaction.reply({ content: '❌ No se encontró info de este ticket.', ephemeral: true });
      if (data.claimedBy) return interaction.reply({ content: `❌ Este ticket ya fue reclamado por <@${data.claimedBy}>.`, ephemeral: true });

      data.claimedBy = interaction.user.id;
      await db.set(`ticket_${interaction.channel.id}`, data);

      const claims = (await db.get(`claims_${interaction.guild.id}_${interaction.user.id}`)) || 0;
      await db.set(`claims_${interaction.guild.id}_${interaction.user.id}`, claims + 1);

      await interaction.channel.permissionOverwrites.edit(interaction.user.id, {
        ViewChannel: true, SendMessages: true
      });

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setDescription(`📌 ${interaction.user} ha reclamado este ticket.`)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      return;
    }

    // ── Botón: Cerrar ticket ──
    if (interaction.isButton() && interaction.customId === 'cerrar_ticket') {
      const data = await db.get(`ticket_${interaction.channel.id}`);
      if (!data) return interaction.reply({ content: '❌ No se encontró info de este ticket.', ephemeral: true });

      await interaction.deferReply();

      // Generar transcript
      const mensajes = await interaction.channel.messages.fetch({ limit: 100 });
      const transcript = mensajes.reverse().map(m =>
        `[${new Date(m.createdTimestamp).toLocaleString()}] ${m.author.tag}: ${m.content}`
      ).join('\n');

      const archivo = new AttachmentBuilder(
        Buffer.from(transcript, 'utf-8'),
        { name: `transcript-${interaction.channel.name}.txt` }
      );

      // Buscar canal de logs
      const logsCanal = interaction.guild.channels.cache.find(c => c.name === 'ticket-logs' || c.name === 'logs-tickets');

      const embedCierre = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('🔒 Ticket Cerrado')
        .addFields(
          { name: '👤 Abierto por', value: `<@${data.userId}>`, inline: true },
          { name: '📌 Atendido por', value: data.claimedBy ? `<@${data.claimedBy}>` : 'Sin reclamar', inline: true },
          { name: '📁 Categoría', value: categorias[data.categoria]?.nombre || data.categoria, inline: true },
        )
        .setTimestamp();

      if (logsCanal) {
        await logsCanal.send({ embeds: [embedCierre], files: [archivo] });
      }

      await interaction.editReply({ content: '🔒 Cerrando ticket en 5 segundos...' });
      setTimeout(() => interaction.channel.delete(), 5000);
      return;
    }

    // ── Menú de roles ──
    if (interaction.isStringSelectMenu() && interaction.customId === 'menu_roles') {
      const member = await interaction.guild.members.fetch(interaction.user.id);
      const seleccionados = interaction.values;
      const todosLosRoles = interaction.component.options.map(o => o.value);
      for (const rolId of todosLosRoles) {
        if (seleccionados.includes(rolId)) {
          await member.roles.add(rolId).catch(() => {});
        } else {
          await member.roles.remove(rolId).catch(() => {});
        }
      }
      await interaction.reply({ content: '✅ Roles actualizados.', ephemeral: true });
      return;
    }

    // ── Botón: Verificación ──
    if (interaction.isButton() && interaction.customId.startsWith('verificar_')) {
      const rolId = interaction.customId.replace('verificar_', '');
      const rol = interaction.guild.roles.cache.get(rolId);
      if (!rol) return interaction.reply({ content: '❌ Rol no encontrado.', ephemeral: true });
      const member = await interaction.guild.members.fetch(interaction.user.id);
      if (member.roles.cache.has(rolId)) return interaction.reply({ content: '✅ Ya estás verificado.', ephemeral: true });
      await member.roles.add(rol);
      await interaction.reply({ content: `✅ Verificado! Recibiste el rol **${rol.name}**.`, ephemeral: true });
      return;
    }
  }
};