const { joinVoiceChannel } = require('@discordjs/voice');
const { Client, GatewayIntentBits } = require('discord.js');
const { joinAndRecord } = require('./handlers/audioReceiver');
require('dotenv').config();

console.log("Token usado:", process.env.DISCORD_TOKEN);
// Verifica se o token está definido

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.once('ready', () => {
    console.log(`✅ Summer conectada como ${client.user.tag}`);
});

client.on('messageCreate', message => {
    if (message.content === '!ping') {
        message.reply('🏓 Pong!');
    }

    if (message.author.bot) return;

    if (message.content === "!gravar") {
        if (!message.member.voice.channel) {
            return message.reply('❌ Você precisa estar em um canal de voz.');
        }

        joinAndRecord(message.member.voice.channel, message.author.id,
            (transcription, userId) => {
                message.channel.send(`🎤 **${message.author.username}** disse: "${transcription}"`)
            });

        message.reply('🎙️ Gravação iniciada...');

    }

    // Comando para entrar no canal
    if (message.content === '!entrar') {
        if (!message.member.voice.channel) {
            return message.reply('❌ Você precisa estar em um canal de voz.');
        }

        // Lógica para entrar no canal sem gravar
        message.reply('🎵 Entrei no canal de voz!');
    }

    // Comando para sair do canal
    if (message.content === '!sair') {
        // Lógica para sair do canal de voz
        message.reply('👋 Saí do canal de voz!');
    }

    // Comando de teste do STT
    if (message.content === '!testar-stt') {
        message.reply('🧪 Executando teste do STT...');
        // Executar o teste que criamos
    }

});

client.login(process.env.DISCORD_TOKEN);
