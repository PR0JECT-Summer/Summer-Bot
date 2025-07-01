const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');

// Configura o caminho do FFmpeg
ffmpeg.setFfmpegPath(ffmpegStatic);

class AudioConverter {
    /**
     * Converte arquivo OGG para WAV no formato que o Vosk precisa
     * @param {string} inputPath - Caminho do arquivo OGG
     * @param {string} outputPath - Caminho onde salvar o WAV (opcional)
     * @returns {Promise<string>} - Caminho do arquivo WAV gerado
     */
    async convertOggToWav(inputPath, outputPath = null) {
        // Verifica se o arquivo de entrada existe
        if (!fs.existsSync(inputPath)) {
            throw new Error(`Arquivo de entrada não encontrado: ${inputPath}`);
        }

        // Se não especificar output, salva na pasta processed
        if (!outputPath) {
            const name = path.basename(inputPath, '.ogg');
            outputPath = path.join(__dirname, '../../assets/processed', `${name}.wav`);
        }

        // Cria o diretório de saída se não existir
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        return new Promise((resolve, reject) => {
            console.log(`🔄 Convertendo: ${path.basename(inputPath)} → ${path.basename(outputPath)}`);

            ffmpeg(inputPath)
                .audioChannels(1)        // Mono (Vosk precisa)
                .audioFrequency(16000)   // 16kHz (Vosk precisa)
                .audioCodec('pcm_s16le') // 16-bit PCM (Vosk precisa)
                .toFormat('wav')
                .on('start', (commandLine) => {
                    console.log(`[INFO] FFmpeg executando: ${commandLine}`);
                })
                .on('progress', (progress) => {
                    if (progress.percent) {
                        console.log(`[PROGRESS] ${Math.round(progress.percent)}% processado`);
                    }
                })
                .save(outputPath)
                .on('end', () => {
                    console.log(`✅ Conversão concluída: ${outputPath}`);
                    resolve(outputPath);
                })
                .on('error', (err) => {
                    console.error(`❌ Erro na conversão: ${err.message}`);
                    reject(err);
                });
        });
    }

    /**
     * Converte arquivo PCM para WAV no formato que o Vosk precisa
     * @param {string} inputPath - Caminho do arquivo PCM
     * @param {string} outputPath - Caminho onde salvar o WAV (opcional)
     * @returns {Promise<string>} - Caminho do arquivo WAV gerado
     */
    async convertPcmToWav(inputPath, outputPath = null) {
        // Verifica se o arquivo de entrada existe
        if (!fs.existsSync(inputPath)) {
            throw new Error(`Arquivo de entrada não encontrado: ${inputPath}`);
        }

        // Se não especificar output, salva na pasta processed
        if (!outputPath) {
            const name = path.basename(inputPath, '.pcm');
            outputPath = path.join(__dirname, '../../assets/processed', `${name}.wav`);
        }

        // Cria o diretório de saída se não existir
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        return new Promise((resolve, reject) => {
            console.log(`🔄 Convertendo PCM: ${path.basename(inputPath)} → ${path.basename(outputPath)}`);

            ffmpeg(inputPath)
                .inputFormat('s16le')        // 16-bit signed little-endian PCM
                .inputOptions([
                    '-ar', '48000',          // Sample rate do Discord
                    '-ac', '2'               // 2 canais (stereo)
                ])
                .audioChannels(1)            // Converter para mono (Vosk precisa)
                .audioFrequency(16000)       // 16kHz (Vosk precisa)
                .audioCodec('pcm_s16le')     // 16-bit PCM (Vosk precisa)
                .toFormat('wav')
                .on('start', (commandLine) => {
                    console.log(`[INFO] FFmpeg executando: ${commandLine}`);
                })
                .on('progress', (progress) => {
                    if (progress.percent) {
                        console.log(`[PROGRESS] ${Math.round(progress.percent)}% processado`);
                    }
                })
                .save(outputPath)
                .on('end', () => {
                    console.log(`✅ Conversão PCM→WAV concluída: ${outputPath}`);
                    resolve(outputPath);
                })
                .on('error', (err) => {
                    console.error(`❌ Erro na conversão PCM→WAV: ${err.message}`);
                    reject(err);
                });
        });
    }

    /**
     * Remove arquivos temporários
     * @param {string[]} filePaths - Array de caminhos para deletar
     */
    cleanup(filePaths) {
        filePaths.forEach(filePath => {
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                    console.log(`🗑️ Arquivo removido: ${path.basename(filePath)}`);
                } catch (error) {
                    console.error(`❌ Erro ao remover arquivo: ${error.message}`);
                }
            }
        });
    }
}

module.exports = AudioConverter;