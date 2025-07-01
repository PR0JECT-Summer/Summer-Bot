const { spawn } = require("child_process");
const { error } = require("console");
const path = require("path");
const AudioConverter = require('./converter');
const GoogleSpeechSTT = require('./googleSpeech'); // REABILITADO

class STTBridge {
    constructor() {
        // Modelo antigo - mais estável e confiável
        this.modelPath = path.join(__dirname, "../../vosk-model/vosk-model-small-pt-0.3");
        this.scriptPath = path.join(__dirname, "../../scripts/transcribe.py");
        this.fastScriptPath = path.join(__dirname, "../../scripts/transcribe_fast.py");
        this.pythonPath = path.join(__dirname, "../../.venv/Scripts/python.exe");
        this.converter = new AudioConverter();
        
        // Google Speech como primário, Vosk como fallback
        this.googleSpeech = new GoogleSpeechSTT();
        this.useGoogleSpeech = true;
    }

    /**
     * Processa áudio PCM: converte para WAV e transcreve com otimizações de velocidade
     * @param {string} audioFilePath - Caminho para arquivo PCM ou OGG
     * @param {boolean} cleanup - Se deve remover arquivos temporários (default: true)
     * @returns {Promise<string>} - Texto transcrito
     */
    async processAudio(audioFilePath, cleanup = true) {
        const startTime = Date.now();
        let wavFilePath = null;
        
        try {
            console.log(`🚀 Processamento: ${path.basename(audioFilePath)}`);
            
            // Verificar se o arquivo é muito longo
            const stats = require('fs').statSync(audioFilePath);
            const extension = path.extname(audioFilePath).toLowerCase();
            
            // Estimar duração baseada no tamanho
            let estimatedDuration = 0;
            if (extension === '.pcm') {
                estimatedDuration = stats.size / (16000 * 2); // 16kHz, 16-bit
            } else if (extension === '.ogg') {
                estimatedDuration = stats.size / 4000; // Aproximação para OGG
            }
            
            console.log(`📊 Arquivo: ${(stats.size/1024).toFixed(0)}KB, ~${estimatedDuration.toFixed(1)}s`);
            
            // Se muito longo, usar processamento especial
            if (estimatedDuration > 60) {
                console.log('📏 Arquivo longo detectado, usando processamento especial...');
                return await this.processLongAudio(audioFilePath, cleanup);
            }
            
            // 1. Converter para WAV com prioridade alta
            const conversionStart = Date.now();
            console.log('⚡ Conversão otimizada...');
            
            if (extension === '.pcm') {
                wavFilePath = await this.converter.convertPcmToWav(audioFilePath);
            } else if (extension === '.ogg') {
                wavFilePath = await this.converter.convertOggToWav(audioFilePath);
            } else if (extension === '.wav') {
                // Arquivo já está em WAV, usar diretamente
                wavFilePath = audioFilePath;
            } else {
                throw new Error(`Formato não suportado: ${extension}`);
            }
            
            console.log(`⏱️ Conversão: ${Date.now() - conversionStart}ms`);
            
            // 2. Transcrever com método estável
            const transcriptionStart = Date.now();
            const transcription = await this.transcribeWithBestMethod(wavFilePath);
            console.log(`⏱️ Transcrição: ${Date.now() - transcriptionStart}ms`);
            
            // 3. Cleanup (opcional)
            if (cleanup) {
                this.converter.cleanup([audioFilePath, wavFilePath]);
            }
            
            console.log(`🎯 Tempo total: ${Date.now() - startTime}ms`);
            
            return transcription;
            
        } catch (error) {
            console.error('❌ Erro no processamento:', error.message);
            
            // Cleanup em caso de erro
            if (cleanup && wavFilePath) {
                this.converter.cleanup([audioFilePath, wavFilePath]);
            }
            
            throw error;
        }
    }

    /**
     * Transcreve usando o melhor método disponível (Google Speech primeiro, Vosk como fallback)
     * Versão estável com timeouts maiores
     * @param {string} wavFilePath - Caminho para arquivo WAV
     * @returns {Promise<string>} - Texto transcrito
     */
    async transcribeWithBestMethod(wavFilePath) {
        if (this.useGoogleSpeech) {
            try {
                console.log('🤖 Tentando Google Speech...');
                const result = await this.googleSpeech.transcribe(wavFilePath);
                if (result && result.trim()) {
                    console.log('✅ Google Speech funcionou!');
                    return result;
                }
                console.log('⚠️ Google Speech não retornou resultado, tentando Vosk...');
            } catch (error) {
                console.error('⚠️ Google Speech falhou:', error.message);
                console.log('🔄 Tentando fallback com Vosk...');
            }
        } else {
            console.log('ℹ️ Google Speech desabilitado, usando Vosk...');
        }
        
        // Usar Vosk estável
        console.log('🗣️ Usando Vosk (versão estável)...');
        return await this.transcribeWithVosk(wavFilePath);
    }



    /**
     * Transcreve usando Vosk (método original estável)
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
                        if (line) {
                            resultLine = line;
                            break;
                        }
                    }

                    if (!resultLine) {
                        throw new Error('Resultado JSON não encontrado na saída');
                    }

                    const result = JSON.parse(resultLine);

                    if (result.success && result.text) {
                        console.log(`✅ Vosk - Transcrição: "${result.text}"`);
                        resolve(result.text);
                    } else {
                        console.log('🔇 Vosk - Nenhum texto detectado');
                        resolve('');
                    }
                } catch (error) {
                    console.error('❌ Vosk - Erro ao processar resultado:', error);
                    console.log('Raw stdout:', stdout);
                    reject(error);
                }
            });
            
            pythonProcess.on("error", (error) => {
                clearTimeout(timeout);
                console.error('❌ Vosk - Erro ao executar Python:', error);
                reject(error);
            });
        });
    }

    /**
     * Processa arquivos longos cortando em chunks menores
     * @param {string} audioFilePath - Caminho para arquivo longo
     * @param {boolean} cleanup - Se deve limpar arquivos temporários
     * @returns {Promise<string>} - Texto transcrito combinado
     */
    async processLongAudio(audioFilePath, cleanup = true) {
        const startTime = Date.now();
        let chunks = [];
        
        try {
            console.log(`📏 Processando áudio longo: ${path.basename(audioFilePath)}`);
            
            // Primeiro converter para WAV se necessário
            let wavFilePath = audioFilePath;
            const extension = path.extname(audioFilePath).toLowerCase();
            
            if (extension !== '.wav') {
                console.log('🔄 Convertendo para WAV primeiro...');
                if (extension === '.pcm') {
                    wavFilePath = await this.converter.convertPcmToWav(audioFilePath);
                } else if (extension === '.ogg') {
                    wavFilePath = await this.converter.convertOggToWav(audioFilePath);
                }
            }
            
            // Cortar em chunks
            console.log('✂️ Cortando em chunks de 45 segundos...');
            chunks = await this.converter.splitAudioFile(wavFilePath, 45);
            
            // Processar cada chunk
            const transcriptions = [];
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                console.log(`🎤 Processando chunk ${i + 1}/${chunks.length}...`);
                
                try {
                    const chunkResult = await this.transcribeWithBestMethod(chunk);
                    if (chunkResult && chunkResult.trim()) {
                        transcriptions.push(chunkResult.trim());
                        console.log(`✅ Chunk ${i + 1}: "${chunkResult.substring(0, 50)}..."`);
                    } else {
                        console.log(`🔇 Chunk ${i + 1}: sem texto`);
                    }
                } catch (error) {
                    console.error(`❌ Erro chunk ${i + 1}:`, error.message);
                }
            }
            
            // Combinar resultados
            const finalText = transcriptions.join(' ').trim();
            
            // Cleanup
            if (cleanup) {
                const filesToClean = [audioFilePath];
                if (wavFilePath !== audioFilePath) {
                    filesToClean.push(wavFilePath);
                }
                filesToClean.push(...chunks);
                this.converter.cleanup(filesToClean);
            }
            
            console.log(`🎯 Áudio longo processado em ${Date.now() - startTime}ms`);
            return finalText;
            
        } catch (error) {
            console.error('❌ Erro no processamento longo:', error.message);
            
            // Cleanup em caso de erro
            if (cleanup && chunks.length > 0) {
                this.converter.cleanup(chunks);
            }
            
            throw error;
        }
    }



    /**
     * Testa se as credenciais do Google estão configuradas
     * @returns {Promise<boolean>} - True se Google Speech está disponível
     */
    async testGoogleSpeech() {
        try {
            return await this.googleSpeech.testCredentials();
        } catch (error) {
            return false;
        }
    }
}

module.exports = STTBridge;