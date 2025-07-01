const { spawn } = require("child_process");
const path = require("path");
const AudioConverter = require('./converter');
const WhisperSTT = require('./whisperSTT'); // ← NOVO

class STTBridge {
    constructor() {
        // Modelo Vosk antigo - mais estável e confiável
        this.modelPath = path.join(__dirname, "../../vosk-model/vosk-model-small-pt-0.3");
        this.scriptPath = path.join(__dirname, "../../scripts/transcribe.py");
        this.pythonPath = path.join(__dirname, "../../.venv/Scripts/python.exe");
        this.converter = new AudioConverter();

        // Whisper como primário, Vosk como fallback
        this.whisperSTT = new WhisperSTT(); // ← NOVO
        this.useWhisper = true; // ← NOVO
    }

    /**
     * Processa áudio: converte para WAV e transcreve
     * @param {string} audioFilePath - Caminho para arquivo PCM ou OGG
     * @param {boolean} cleanup - Se deve remover arquivos temporários (default: true)
     * @returns {Promise<string>} - Texto transcrito
     */
    async processAudio(audioFilePath, cleanup = true) {
        const startTime = Date.now();

        try {
            console.log(`🚀 Processamento: ${path.basename(audioFilePath)}`);

            // Verificar se o arquivo é muito longo
            const stats = require('fs').statSync(audioFilePath);
            const extension = path.extname(audioFilePath).toLowerCase();

            let wavFilePath;

            // Whisper suporta múltiplos formatos diretamente
            if (this.useWhisper && (extension === '.wav' || extension === '.ogg' || extension === '.mp3' || extension === '.m4a' || extension === '.flac')) {
                // Whisper pode processar diretamente - sem conversão necessária
                wavFilePath = audioFilePath;
                console.log(`✅ Formato ${extension.toUpperCase()} suportado nativamente pelo Whisper`);
            } else if (extension === '.wav') {
                // WAV sempre suportado
                wavFilePath = audioFilePath;
            } else {
                // Converter para WAV (necessário para PCM ou formatos não suportados)
                console.log('1️⃣ Convertendo para WAV...');

                if (extension === '.pcm') {
                    wavFilePath = await this.converter.convertPcmToWav(audioFilePath);
                } else if (extension === '.ogg') {
                    wavFilePath = await this.converter.convertOggToWav(audioFilePath);
                } else {
                    throw new Error(`Formato não suportado: ${extension}`);
                }

                console.log('✅ Conversão concluída');
            }

            // Verificar duração do arquivo (estimativa: 16kHz, 16-bit, mono = ~32KB/s)
            const fileSizeKB = stats.size / 1024;
            const estimatedDurationSeconds = fileSizeKB / 32;

            let transcription;

            // Se arquivo muito longo (>60s), processar em chunks
            if (estimatedDurationSeconds > 60) {
                console.log(`📊 Arquivo longo detectado (~${Math.round(estimatedDurationSeconds)}s), processando em chunks...`);
                transcription = await this.processLongAudio(wavFilePath);
            } else {
                console.log('2️⃣ Transcrevendo áudio...');
                transcription = await this.transcribeWithBestMethod(wavFilePath);
            }

            // Cleanup de arquivos temporários
            if (cleanup && wavFilePath !== audioFilePath) {
                try {
                    require('fs').unlinkSync(wavFilePath);
                    console.log('🗑️ Arquivo temporário removido');
                } catch (err) {
                    console.warn('⚠️ Não foi possível remover arquivo temporário:', err.message);
                }
            }

            const processingTime = Date.now() - startTime;
            console.log(`✅ Processamento concluído em ${processingTime}ms: "${transcription}"`);

            return transcription;

        } catch (error) {
            const processingTime = Date.now() - startTime;
            console.error(`❌ Erro no processamento (${processingTime}ms):`, error.message);
            return "";
        }
    }

    /**
     * Escolhe o melhor método de transcrição: Whisper primeiro, Vosk como fallback
     * @param {string} audioFilePath - Caminho para arquivo WAV
     * @returns {Promise<string>} - Texto transcrito
     */
    async transcribeWithBestMethod(audioFilePath) {
        // Tentar Whisper primeiro (se habilitado)
        if (this.useWhisper) {
            try {
                console.log('🗣️ Usando Whisper...');
                const result = await this.whisperSTT.transcribe(audioFilePath, 'base');

                if (result && result.trim()) {
                    return result.trim();
                } else {
                    console.log('⚠️ Whisper não detectou texto, tentando Vosk...');
                }
            } catch (error) {
                console.error('❌ Erro no Whisper:', error.message);
                console.log('🔄 Fallback para Vosk...');
            }
        } else {
            console.log('ℹ️ Whisper desabilitado, usando Vosk...');
        }

        // Fallback para Vosk
        try {
            console.log('🗣️ Usando Vosk...');
            return await this.transcribeWithVosk(audioFilePath);
        } catch (error) {
            console.error('❌ Erro no Vosk:', error.message);
            throw new Error('Todos os métodos de STT falharam');
        }
    }

    /**
     * Transcreve usando Vosk (fallback)
     * @param {string} audioFilePath - Caminho para arquivo WAV
     * @returns {Promise<string>} - Texto transcrito
     */
    async transcribeWithVosk(audioFilePath) {
        return new Promise((resolve, reject) => {
            console.log(`🎤 Vosk - Iniciando transcrição: ${audioFilePath}`);

            const pythonProcess = spawn(this.pythonPath, [
                this.scriptPath,
                audioFilePath,
                this.modelPath
            ], {
                stdio: ['ignore', 'pipe', 'pipe']
            });

            let stdout = "";
            let stderr = "";

            // Timeout mais generoso para versão estável
            const timeout = setTimeout(() => {
                pythonProcess.kill('SIGTERM');
                reject(new Error('Vosk timeout - versão estável'));
            }, 30000); // 30 segundos para versão estável

            pythonProcess.stdout.on("data", (data) => {
                stdout += data.toString();
            });

            pythonProcess.stderr.on("data", (data) => {
                stderr += data.toString();
            });

            pythonProcess.on("close", (code) => {
                clearTimeout(timeout);

                if (code !== 0) {
                    console.error(`❌ Vosk - Erro no Python (código ${code}):`, stderr);
                    reject(new Error(`Python script failed with code ${code}`));
                    return;
                }

                try {
                    const lines = stdout.split("\n");
                    let resultLine = '';

                    for (let i = lines.length - 1; i >= 0; i--) {
                        const line = lines[i].trim();
                        if (line && !line.startsWith('[')) {
                            resultLine = line;
                            break;
                        }
                    }

                    if (resultLine) {
                        console.log(`✅ Vosk - Transcrição: "${resultLine}"`);
                        resolve(resultLine);
                    } else {
                        console.log(`🔇 Vosk - Nenhum texto detectado`);
                        resolve("");
                    }
                } catch (error) {
                    console.error(`❌ Vosk - Erro ao processar resultado:`, error.message);
                    reject(error);
                }
            });
        });
    }

    /**
     * Processa arquivos de áudio longos cortando em chunks
     * @param {string} audioFilePath - Caminho para arquivo WAV
     * @returns {Promise<string>} - Texto transcrito combinado
     */
    async processLongAudio(audioFilePath) {
        try {
            // Cortar arquivo em chunks de 45 segundos
            const chunkDuration = 45;
            const chunks = await this.converter.splitAudioFile(audioFilePath, chunkDuration);

            console.log(`📝 Processando ${chunks.length} chunks...`);

            const transcriptions = [];

            for (let i = 0; i < chunks.length; i++) {
                console.log(`🔄 Processando chunk ${i + 1}/${chunks.length}...`);

                try {
                    const chunkTranscription = await this.transcribeWithBestMethod(chunks[i]);
                    if (chunkTranscription && chunkTranscription.trim()) {
                        transcriptions.push(chunkTranscription.trim());
                    }
                } catch (error) {
                    console.error(`❌ Erro no chunk ${i + 1}:`, error.message);
                }

                // Limpar chunk temporário
                try {
                    require('fs').unlinkSync(chunks[i]);
                } catch (err) {
                    console.warn(`⚠️ Não foi possível remover chunk ${i + 1}`);
                }
            }

            const finalTranscription = transcriptions.join(' ').trim();
            console.log(`✅ Transcrição final de ${chunks.length} chunks: "${finalTranscription}"`);

            return finalTranscription;

        } catch (error) {
            console.error('❌ Erro no processamento de arquivo longo:', error.message);
            throw error;
        }
    }

    /**
     * Testa se o Whisper está funcionando
     * @returns {Promise<boolean>}
     */
    async testWhisper() {
        return await this.whisperSTT.test();
    }
}

module.exports = STTBridge;