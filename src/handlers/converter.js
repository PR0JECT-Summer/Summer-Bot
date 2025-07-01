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
     * Corta arquivo de áudio em chunks menores
     * @param {string} inputPath - Caminho do arquivo WAV
     * @param {number} chunkDuration - Duração de cada chunk em segundos (padrão: 45)
     * @returns {Promise<string[]>} - Array com caminhos dos chunks gerados
     */
    async splitAudioFile(inputPath, chunkDuration = 45) {
        if (!fs.existsSync(inputPath)) {
            throw new Error(`Arquivo não encontrado: ${inputPath}`);
        }

        const inputDir = path.dirname(inputPath);
        const inputName = path.basename(inputPath, '.wav');
        const outputPattern = path.join(inputDir, `${inputName}_chunk_%03d.wav`);

        return new Promise((resolve, reject) => {
            console.log(`✂️ Cortando áudio em chunks de ${chunkDuration}s...`);

            ffmpeg(inputPath)
                .addOptions([
                    '-f', 'segment',
                    '-segment_time', chunkDuration.toString(),
                    '-segment_format', 'wav',
                    '-reset_timestamps', '1'
                ])
                .on('start', (commandLine) => {
                    console.log(`[INFO] FFmpeg chunk: ${commandLine}`);
                })
                .on('end', () => {
                    // Listar arquivos de chunk gerados
                    const chunks = [];
                    let chunkIndex = 0;
                    
                    while (true) {
                        const chunkPath = path.join(inputDir, `${inputName}_chunk_${chunkIndex.toString().padStart(3, '0')}.wav`);
                        if (fs.existsSync(chunkPath)) {
                            chunks.push(chunkPath);
                            chunkIndex++;
                        } else {
                            break;
                        }
                    }
                    
                    console.log(`✅ Áudio cortado em ${chunks.length} chunks`);
                    resolve(chunks);
                })
                .on('error', (err) => {
                    console.error(`❌ Erro ao cortar áudio: ${err.message}`);
                    reject(err);
                })
                .save(outputPattern);
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