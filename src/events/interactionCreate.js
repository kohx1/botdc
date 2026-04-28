const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits, AttachmentBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

const categorias = {
  soporte: {
    nombre: 'Soporte Técnico', emoji: '🔧',
    campos: [
      { id: 'nick', label: '¿Cuál es tu nick?', placeholder: 'Escribe tu nombre en el servidor.', style: 1, required: true },
      { id: 'descripcion', label: '¿Cuál es tu duda?', placeholder: 'Explica cómo podemos ayudarte.', style: 2, required: true },
    ]
  },
  reporte_jugador: {
    nombre: 'Reportar Jugador', emoji: '📋',
    campos: [
      { id: 'nick', label: '¿Cuál es tu nick?', placeholder: 'Escribe tu nombre en el servidor.', style: 1, required: true },
      { id: 'reportado', label: 'Nick del usuario que reportas', placeholder: 'Escribe el nick del jugador a reportar.', style: 1, required: true },
      { id: 'razon', label: '¿Por qué lo reportas?', placeholder: 'Explica el motivo del reporte con detalle.', style: 2, required: true },
      { id: 'pruebas', label: '¿Tienes pruebas? (fotos, videos, etc)', placeholder: 'Describe o pega links de tus pruebas.', style: 2, required: false },
    ]
  },
  bug: {
    nombre: 'Reporte de Bug', emoji: '⚠️',
    campos: [
      { id: 'nick', label: '¿Cuál es tu nick?', placeholder: 'Escribe tu nombre en el servidor.', style: 1, required: true },
      { id: 'bug', label: '¿Qué bug encontraste?', placeholder: 'Describe el bug con el mayor detalle posible.', style: 2, required: true },
      { id: 'pasos', label: '¿Cómo se reproduce el bug?', placeholder: 'Explica los pasos para reproducirlo.', style: 2, required: false },
    ]
  },
  sancion: {
    nombre: 'Sanciones & Anticheat', emoji: '💻',
    campos: [
      { id: 'nick', label: '¿Cuál es tu nick?', placeholder: 'Escribe tu nombre en el servidor.', style: 1, required: true },
      { id: 'modalidad', label: 'Modalidad, fecha y staff que sancionó', placeholder: 'En qué modalidad, cuándo y quién te sancionó.', style: 1, required: true },
      { id: 'motivo', label: '¿Por qué fuiste sancionado?', placeholder: 'Explica en qué consiste tu sanción.', style: 2, required: true },
      { id: 'apelacion', label: '¿Por qué estás apelando?', placeholder: 'Explica por qué deberíamos remover tu sanción.', style: 2, required: true },
    ]
  },
  pagos: {
    nombre: 'Pagos Tienda', emoji: '💰',
    campos: [
      { id: 'nick', label: '¿Cuál es tu nick?', placeholder: 'Escribe tu nombre en el servidor.', style: 1, required: true },
      { id: 'problema', label: '¿Cuál es tu problema con la tienda?', placeholder: 'Describe tu problema con detalle.', style: 2, required: true },
      { id: 'comprobante', label: '¿Tienes comprobante de pago?', placeholder: 'Pega el link o describe tu comprobante.', style: 2, required: false },
    ]
  },
  revive: {
    nombre: 'Solicitar Revive', emoji: '💀',
    campos: [
      { id: 'nick', label: '¿Cuál es tu nick?', placeholder: 'Escribe tu nombre en el servidor.', style: 1, required: true },
      { id: 'donde', label: '¿Dónde y cómo moriste?', placeholder: 'Explica el lugar y la situación.', style: 2, required: true },
      { id: 'pruebas', label: '¿Tienes pruebas?', placeholder: 'Describe o pega links de tus pruebas.', style: 2, required: false },
    ]
  },
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

      const camposAUsar = info.campos.slice(0, 5);

      for (const campo of camposAUsar) {
        const input = new TextInputBuilder()
          .setCustomId(campo.id)
          .setLabel(campo.label)
          .setStyle(campo.style)
          .setPlaceholder(campo.placeholder)
          .setRequired(campo.required);

        modal.addComponents(new ActionRowBuilder().addComponents(input));
      }

      await interaction.showModal(modal);
      return;
    }

    // ── Modal enviado → crear canal de ticket ──
    if (interaction.isModalSubmit() && interaction.customId.startsWith('ticket_modal_')) {
      const categoria = interaction.customId.replace('ticket_modal_', '');
      const info = categorias[categoria];

      await interaction.deferReply({ ephemeral: true });

      const ticketExistente = interaction.guild.channels.cache.find(
        c => c.name === `ticket-${interaction.user.username}`
      );
      if (ticketExistente) {
        return interaction.editReply({ content: `❌ Ya tienes un ticket abierto: ${ticketExistente}` });
      }

      const nick = interaction.fields.getTextInputValue('nick');

      // Recoger todos los campos del formulario
      const resumen = info.campos.map(campo => {
        try {
          const valor = interaction.fields.getTextInputValue(campo.id);
          return `**${campo.label}**\n${valor}`;
        } catch {
          return null;
        }
      }).filter(Boolean).join('\n\n');

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
        resumen,
        numero: nuevoContador,
        claimedBy: null,
        abierto: true,
      });

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`${info.emoji} ${info.nombre} — #${nuevoContador}`)
        .setDescription(resumen)
        .addFields(
          { name: '👤 Usuario', value: `${interaction.user}`, inline: true },
          { name: '🎮 Nick', value: nick, inline: true },
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

      const mensajes = await interaction.channel.messages.fetch({ limit: 100 });
      const transcript = mensajes.reverse().map(m =>
        `[${new Date(m.createdTimestamp).toLocaleString()}] ${m.author.tag}: ${m.content}`
      ).join('\n');

      const archivo = new AttachmentBuilder(
        Buffer.from(transcript, 'utf-8'),
        { name: `transcript-${interaction.channel.name}.txt` }
      );

      const logsCanal = interaction.guild.channels.cache.find(
        c => c.name === 'ticket-logs' || c.name === 'logs-tickets'
      );

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