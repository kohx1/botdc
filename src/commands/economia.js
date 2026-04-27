const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('economia')
    .setDescription('Sistema de economía')
    .addSubcommand(sub => sub
      .setName('balance')
      .setDescription('Ver tus monedas'))
    .addSubcommand(sub => sub
      .setName('daily')
      .setDescription('Reclamar monedas diarias'))
    .addSubcommand(sub => sub
      .setName('transferir')
      .setDescription('Transferir monedas a otro usuario')
      .addUserOption(opt => opt.setName('usuario').setDescription('Usuario destino').setRequired(true))
      .addIntegerOption(opt => opt.setName('cantidad').setDescription('Cantidad a transferir').setRequired(true).setMinValue(1)))
    .addSubcommand(sub => sub
      .setName('ranking')
      .setDescription('Top 10 más ricos del servidor')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    if (sub === 'balance') {
      const monedas = await db.get(`monedas_${guildId}_${userId}`) || 0;
      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle(`💰 Balance de ${interaction.user.username}`)
        .addFields({ name: 'Monedas', value: `${monedas} 🪙`, inline: true })
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }

    else if (sub === 'daily') {
      const ultimo = await db.get(`daily_${guildId}_${userId}`) || 0;
      const ahora = Date.now();
      const cooldown = 86400000;

      if (ahora - ultimo < cooldown) {
        const restante = Math.ceil((cooldown - (ahora - ultimo)) / 3600000);
        return interaction.reply({ content: `⏰ Ya reclamaste tu daily. Vuelve en **${restante} horas**.`, ephemeral: true });
      }

      const ganado = Math.floor(Math.random() * 500) + 100;
      const monedas = (await db.get(`monedas_${guildId}_${userId}`)) || 0;
      await db.set(`monedas_${guildId}_${userId}`, monedas + ganado);
      await db.set(`daily_${guildId}_${userId}`, ahora);

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('💰 Daily reclamado!')
        .setDescription(`Recibiste **${ganado} 🪙**\nBalance total: **${monedas + ganado} 🪙**`)
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }

    else if (sub === 'transferir') {
      const destino = interaction.options.getUser('usuario');
      const cantidad = interaction.options.getInteger('cantidad');
      const misMonedas = await db.get(`monedas_${guildId}_${userId}`) || 0;

      if (misMonedas < cantidad) return interaction.reply({ content: `❌ No tienes suficientes monedas. Tienes **${misMonedas} 🪙**`, ephemeral: true });
      if (destino.id === userId) return interaction.reply({ content: '❌ No puedes transferirte a ti mismo.', ephemeral: true });

      const monedasDestino = await db.get(`monedas_${guildId}_${destino.id}`) || 0;
      await db.set(`monedas_${guildId}_${userId}`, misMonedas - cantidad);
      await db.set(`monedas_${guildId}_${destino.id}`, monedasDestino + cantidad);

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('💸 Transferencia exitosa')
        .addFields(
          { name: 'Enviado a', value: destino.tag, inline: true },
          { name: 'Cantidad', value: `${cantidad} 🪙`, inline: true },
          { name: 'Tu balance', value: `${misMonedas - cantidad} 🪙`, inline: true },
        )
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }

    else if (sub === 'ranking') {
      const todos = await db.all();
      const filtrados = todos
        .filter(e => e.id.startsWith(`monedas_${guildId}_`))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      const descripcion = await Promise.all(filtrados.map(async (e, i) => {
        const id = e.id.replace(`monedas_${guildId}_`, '');
        const user = await interaction.client.users.fetch(id).catch(() => null);
        return `**${i + 1}.** ${user ? user.username : 'Usuario'} — ${e.value} 🪙`;
      }));

      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('🏆 Top 10 más ricos')
        .setDescription(descripcion.join('\n'))
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }
  }
};