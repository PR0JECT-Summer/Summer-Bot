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
        this.pythonPath = path.join(__dirname, "../../.venv/Scripts/python.exe");
        this.converter = new AudioConverter();
        
        // Adicionar Google Speech
        this.googleSpeech = new GoogleSpeechSTT(); // REABILITADO
        this.useGoogleSpeech = true; // REABILITADO
    }

    /**
     * Processa áudio PCM: converte para WAV e transcreve
     * @param {string} audioFilePath - Caminho para arquivo PCM ou OGG
     * @param {boolean} cleanup - Se deve remover arquivos temporários (default: true)
     * @returns {Promise<string>} - Texto transcrito
     */
    async processAudio(audioFilePath, cleanup = true) {
        let wavFilePath = null;
        
        try {
            console.log(`🎤 Processando áudio: ${path.basename(audioFilePath)}`);
            
            // Detectar tipo de arquivo
            const extension = path.extname(audioFilePath).toLowerCase();
            
            // 1. Converter para WAV baseado no tipo
            console.log('1️⃣ Convertendo para WAV...');
            if (extension === '.pcm') {
                wavFilePath = await this.converter.convertPcmToWav(audioFilePath);
            } else if (extension === '.ogg') {
                wavFilePath = await this.converter.convertOggToWav(audioFilePath);
            } else {
                throw new Error(`Formato não suportado: ${extension}`);
            }
            
            // 2. Transcrever o WAV
            console.log('2️⃣ Transcrevendo áudio...');
            const transcription = await this.transcribeWithBestMethod(wavFilePath);
            
            // 3. Cleanup (opcional)
            if (cleanup) {
                this.converter.cleanup([audioFilePath, wavFilePath]);
            }
            
            return transcription;
            
        } catch (error) {
            console.error('❌ Erro no processamento de áudio:', error.message);
            
            // Cleanup em caso de erro
            if (cleanup && wavFilePath) {
                this.converter.cleanup([audioFilePath, wavFilePath]);
            }
            
            throw error;
        }
    }

    /**
     * Transcreve usando o melhor método disponível (Google Speech primeiro, Vosk como fallback)
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
        
        // Usar Vosk
        console.log('🗣️ Usando Vosk...');
        return await this.transcribeWithVosk(wavFilePath);
    }

    /**
     * Transcreve usando Vosk (método original)
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
            ]);

            let stdout = "";
            let stderr = "";

            pythonProcess.stdout.on("data", (data) => {
                stdout += data.toString();
            });

            pythonProcess.stderr.on("data", (data) => {
                stderr += data.toString();
            })

            pythonProcess.on("close", (code) => {
                if (code !== 0) {
                    console.error(`❌ Vosk - Erro no Python (código ${code}):`, stderr);
                    reject(new Error(`Python script failed with code ${code}`));
                    return;
                }

                try {
                    const lines = stdout.split("\n")
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
                console.error('❌ Vosk - Erro ao executar Python:', error);
                reject(error);
            })
        })
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