const STTBridge = require('./sttBridge'); // ← Correção: STTBridge com S maiúsculo
const { joinVoiceChannel, EndBehaviorType } = require('@discordjs/voice');
const prism = require('prism-media');
const fs = require('fs');
const path = require('path');

function joinAndRecord(voiceChannel, userId, onTranscriptionReady) {
    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: false,
    });

    const stt = new STTBridge(); // ← Correção: STTBridge com S maiúsculo

    const receiver = connection.receiver;

    const opusStream = receiver.subscribe(userId, {
        end: {
            behavior: EndBehaviorType.AfterSilence,
            duration: 1000,
        }
    });

    // Gravar como PCM para melhor compatibilidade
    const fileName = `voice_${userId}-${Date.now()}.pcm`;
    const outputPath = path.join(__dirname, '../../assets/raw', fileName);
    const outputStream = fs.createWriteStream(outputPath);

    console.log('🎙️ Configurando decodificação de áudio...');
    
    // Decodificar Opus para PCM
    const decoder = new prism.opus.Decoder({ 
        frameSize: 960, 
        channels: 2, 
        rate: 48000 
    });

    // Pipeline: Opus → Decoder → PCM File
    opusStream.pipe(decoder).pipe(outputStream);
    
    decoder.on('error', (error) => {
        console.error('❌ Erro no decoder:', error.message);
    });

    outputStream.on('finish', async () => {
        console.log(`Gravação concluída: ${outputPath}`);

        try {
            console.log('🔄 Processando áudio automaticamente...');
            const transcription = await stt.processAudio(outputPath);

            if (transcription && transcription.trim()) {
                console.log(`📝 Texto detectado: "${transcription}"`);
                if (onTranscriptionReady) {
                    onTranscriptionReady(transcription, userId);
                }
            } else {
                console.log('🔇 Nenhum texto detectado no áudio');
            }
        } catch (error) {
            console.error('❌ Erro no processamento STT:', error.message);
        }
    });
}

module.exports = {
    joinAndRecord
};