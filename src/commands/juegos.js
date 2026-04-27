const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('juego')
    .setDescription('Minijuegos')
    .addSubcommand(sub => sub
      .setName('trivia')
      .setDescription('Pregunta de trivia aleatoria'))
    .addSubcommand(sub => sub
      .setName('adivina')
      .setDescription('Adivina el número del 1 al 100'))
    .addSubcommand(sub => sub
      .setName('ppt')
      .setDescription('Piedra, papel o tijera contra el bot')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'trivia') {
      const preguntas = [
        { pregunta: '¿Cuál es el planeta más grande del sistema solar?', respuestas: ['Jupiter', 'Júpiter'], pista: 'Es un gigante gaseoso' },
        { pregunta: '¿En qué año llegó el hombre a la Luna?', respuestas: ['1969'], pista: 'Fue en la misión Apollo 11' },
        { pregunta: '¿Cuántos continentes tiene la Tierra?', respuestas: ['7', 'siete'], pista: 'Cuenta América del Norte y del Sur por separado' },
        { pregunta: '¿Cuál es el océano más grande del mundo?', respuestas: ['Pacífico', 'Pacifico'], pista: 'Está entre Asia y América' },
        { pregunta: '¿Cuántos lados tiene un hexágono?', respuestas: ['6', 'seis'], pista: 'Es par y mayor que 5' },
      ];

      const random = preguntas[Math.floor(Math.random() * preguntas.length)];

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🎮 Trivia')
        .setDescription(`**${random.pregunta}**\n\n💡 Pista: ${random.pista}\n\nResponde en el chat en los próximos **30 segundos**`)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

      const filter = m => m.author.id === interaction.user.id;
      const collector = interaction.channel.createMessageCollector({ filter, time: 30000, max: 1 });

      collector.on('collect', async m => {
        const correcto = random.respuestas.some(r => r.toLowerCase() === m.content.toLowerCase());
        if (correcto) {
          await m.reply('✅ ¡Correcto! Muy bien! 🎉');
        } else {
          await m.reply(`❌ Incorrecto. La respuesta era: **${random.respuestas[0]}**`);
        }
      });

      collector.on('end', collected => {
        if (collected.size === 0) {
          interaction.followUp(`⏰ Tiempo agotado! La respuesta era: **${random.respuestas[0]}**`);
        }
      });
    }

    else if (sub === 'adivina') {
      const numero = Math.floor(Math.random() * 100) + 1;
      let intentos = 0;

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🎮 Adivina el número')
        .setDescription('Tengo un número del **1 al 100**.\n¿Puedes adivinarlo? Tienes **5 intentos**.\nResponde en el chat.')
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

      const filter = m => m.author.id === interaction.user.id && !isNaN(m.content);
      const collector = interaction.channel.createMessageCollector({ filter, time: 60000, max: 5 });

      collector.on('collect', async m => {
        intentos++;
        const intento = parseInt(m.content);

        if (intento === numero) {
          collector.stop('ganó');
          await m.reply(`✅ ¡Correcto! Era el **${numero}**. Lo adivinaste en ${intentos} intentos! 🎉`);
        } else if (intentos >= 5) {
          collector.stop('perdió');
          await m.reply(`❌ ¡Sin intentos! Era el **${numero}**.`);
        } else if (intento < numero) {
          await m.reply(`⬆️ El número es **mayor**. Te quedan ${5 - intentos} intentos.`);
        } else {
          await m.reply(`⬇️ El número es **menor**. Te quedan ${5 - intentos} intentos.`);
        }
      });
    }

    else if (sub === 'ppt') {
      const opciones = ['🪨 Piedra', '📄 Papel', '✂️ Tijera'];
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('piedra').setLabel('🪨 Piedra').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('papel').setLabel('📄 Papel').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('tijera').setLabel('✂️ Tijera').setStyle(ButtonStyle.Primary),
      );

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🎮 Piedra, Papel o Tijera')
        .setDescription('¡Elige tu opción!')
        .setTimestamp();

      const msg = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

      const filter = i => i.user.id === interaction.user.id;
      const collector = msg.createMessageComponentCollector({ filter, time: 30000, max: 1 });

      collector.on('collect', async i => {
        const botEleccion = ['piedra', 'papel', 'tijera'][Math.floor(Math.random() * 3)];
        const userEleccion = i.customId;

        let resultado;
        if (userEleccion === botEleccion) resultado = '🤝 ¡Empate!';
        else if (
          (userEleccion === 'piedra' && botEleccion === 'tijera') ||
          (userEleccion === 'papel' && botEleccion === 'piedra') ||
          (userEleccion === 'tijera' && botEleccion === 'papel')
        ) resultado = '🎉 ¡Ganaste!';
        else resultado = '❌ ¡Perdiste!';

        const embedResult = new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle('🎮 Resultado')
          .addFields(
            { name: 'Tu elección', value: userEleccion, inline: true },
            { name: 'Bot eligió', value: botEleccion, inline: true },
            { name: 'Resultado', value: resultado, inline: false },
          )
          .setTimestamp();

        await i.update({ embeds: [embedResult], components: [] });
      });
    }
  }
};