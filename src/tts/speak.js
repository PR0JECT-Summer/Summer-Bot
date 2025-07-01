const fs = require('fs');
const path = require('path');
const { createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');

class TTSHandler {
    constructor() {
        this.player = createAudioPlayer();
        this.isPlaying = false;
    }

    /**
     * Converte texto em fala usando uma API de TTS (exemplo com Google TTS)
     * @param {string} text - Texto para converter
     * @param {string} language - Idioma (pt-BR, en-US, etc.)
     * @returns {Promise<string>} - Caminho do arquivo de áudio gerado
     */
    async textToSpeech(text, language = 'pt-BR') {
        // Aqui você pode implementar diferentes provedores de TTS:
        // - Google Cloud Text-to-Speech
        // - Amazon Polly
        // - Microsoft Speech Services
        // - gTTS (Google Text-to-Speech) - versão gratuita

        console.log(`Convertendo texto para fala: "${text}" (${language})`);

        // Placeholder - implementar TTS real aqui
        throw new Error('TTS não implementado ainda. Implemente seu provedor preferido.');
    }

    /**
     * Reproduz um arquivo de áudio no canal de voz
     * @param {VoiceConnection} connection - Conexão do bot no canal de voz
     * @param {string} audioPath - Caminho do arquivo de áudio
     */
    async playAudio(connection, audioPath) {
        if (this.isPlaying) {
            console.log('Já está reproduzindo áudio');
            return;
        }

        try {
            const resource = createAudioResource(audioPath);
            this.player.play(resource);
            connection.subscribe(this.player);

            this.isPlaying = true;

            this.player.on(AudioPlayerStatus.Playing, () => {
                console.log('Reproduzindo áudio...');
            });

            this.player.on(AudioPlayerStatus.Idle, () => {
                console.log('Reprodução finalizada');
                this.isPlaying = false;
            });

        } catch (error) {
            console.error('Erro ao reproduzir áudio:', error);
            this.isPlaying = false;
        }
    }

    /**
     * Para a reprodução atual
     */
    stop() {
        if (this.isPlaying) {
            this.player.stop();
            this.isPlaying = false;
        }
    }

    /**
     * Converte texto em fala e reproduz diretamente
     * @param {VoiceConnection} connection - Conexão do canal de voz
     * @param {string} text - Texto para falar
     * @param {string} language - Idioma
     */
    async speak(connection, text, language = 'pt-BR') {
        try {
            const audioPath = await this.textToSpeech(text, language);
            await this.playAudio(connection, audioPath);

            // Opcional: limpar arquivo temporário após reprodução
            setTimeout(() => {
                if (fs.existsSync(audioPath)) {
                    fs.unlinkSync(audioPath);
                }
            }, 30000); // 30 segundos

        } catch (error) {
            console.error('Erro no TTS:', error);
        }
    }
}

module.exports = new TTSHandler();
