const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class WhisperSTT {
    constructor() {
        this.scriptPath = path.join(__dirname, '../../scripts/whisper_transcribe.py');
        this.pythonPath = path.join(__dirname, '../../.venv/Scripts/python.exe');

        // Modelos disponíveis por ordem de velocidade/qualidade
        this.models = {
            'tiny': { speed: 'muito_rapido', quality: 'basica', size: '39 MB' },
            'base': { speed: 'rapido', quality: 'boa', size: '74 MB' },
            'small': { speed: 'medio', quality: 'muito_boa', size: '244 MB' },
            'medium': { speed: 'lento', quality: 'excelente', size: '769 MB' },
            'large': { speed: 'muito_lento', quality: 'maxima', size: '1550 MB' }
        };

        this.defaultModel = 'base'; // Balanceado
    }

    /**
     * Transcreve áudio usando Whisper
     * @param {string} audioFilePath - Caminho para arquivo de áudio
     * @param {string} model - Modelo Whisper (tiny, base, small, medium, large)
     * @returns {Promise<string>} - Texto transcrito
     */
    async transcribe(audioFilePath, model = this.defaultModel) {
        return new Promise((resolve, reject) => {
            console.log(`🎤 Whisper - Iniciando transcrição com modelo '${model}': ${path.basename(audioFilePath)}`);

            // Verificar se arquivo existe
            if (!fs.existsSync(audioFilePath)) {
                reject(new Error(`Arquivo não encontrado: ${audioFilePath}`));
                return;
            }

            // Verificar se script Python existe
            if (!fs.existsSync(this.scriptPath)) {
                reject(new Error(`Script Whisper não encontrado: ${this.scriptPath}`));
                return;
            }

            const pythonProcess = spawn(this.pythonPath, [
                this.scriptPath,
                audioFilePath,
                model
            ], {
                stdio: ['ignore', 'pipe', 'pipe']
            });

            let stdout = "";
            let stderr = "";

            // Timeout baseado no modelo (modelos maiores precisam mais tempo)
            const timeouts = {
                'tiny': 15000,    // 15s
                'base': 30000,    // 30s 
                'small': 45000,   // 45s
                'medium': 60000,  // 60s
                'large': 90000    // 90s
            };

            const timeout = setTimeout(() => {
                pythonProcess.kill('SIGTERM');
                reject(new Error(`Whisper timeout (${model}) - ${timeouts[model] / 1000}s`));
            }, timeouts[model] || 30000);

            pythonProcess.stdout.on("data", (data) => {
                stdout += data.toString();
            });

            pythonProcess.stderr.on("data", (data) => {
                stderr += data.toString();
            });

            pythonProcess.on("close", (code) => {
                clearTimeout(timeout);

                if (code !== 0) {
                    console.error(`❌ Whisper - Erro no Python (código ${code}):`, stderr);
                    reject(new Error(`Whisper Python script failed with code ${code}`));
                    return;
                }

                try {
                    const lines = stdout.split("\n");
                    let resultLine = '';

                    // Encontrar linha com resultado final (última linha não vazia que não é log)
                    for (let i = lines.length - 1; i >= 0; i--) {
                        const line = lines[i].trim();
                        if (line && !line.startsWith('[')) {
                            resultLine = line;
                            break;
                        }
                    }

                    if (resultLine) {
                        console.log(`✅ Whisper - Transcrição: "${resultLine}"`);
                        resolve(resultLine);
                    } else {
                        console.log(`🔇 Whisper - Nenhum texto detectado`);
                        resolve("");
                    }
                } catch (error) {
                    console.error(`❌ Whisper - Erro ao processar resultado:`, error.message);
                    reject(error);
                }
            });

            pythonProcess.on("error", (error) => {
                clearTimeout(timeout);
                console.error(`❌ Whisper - Erro ao executar Python:`, error.message);
                reject(error);
            });
        });
    }

    /**
     * Testa se o Whisper está funcionando
     * @returns {Promise<boolean>}
     */
    async test() {
        try {
            // Verificar se Python existe
            if (!fs.existsSync(this.pythonPath)) {
                console.log('❌ Python não encontrado:', this.pythonPath);
                return false;
            }

            // Verificar se script existe
            if (!fs.existsSync(this.scriptPath)) {
                console.log('❌ Script Whisper não encontrado:', this.scriptPath);
                return false;
            }

            // Tentar encontrar arquivo de teste
            const possibleTestFiles = [
                path.join(__dirname, '../../assets/raw/Test.wav'),
                path.join(__dirname, '../../assets/processed/test.wav'),
                path.join(__dirname, '../../assets/Test.wav')
            ];

            let testFile = null;
            for (const file of possibleTestFiles) {
                if (fs.existsSync(file)) {
                    testFile = file;
                    break;
                }
            }

            if (!testFile) {
                console.log('⚠️ Nenhum arquivo de teste encontrado, assumindo Whisper disponível');
                return true;
            }

            console.log('🧪 Testando Whisper com arquivo:', path.basename(testFile));
            const result = await this.transcribe(testFile, 'tiny'); // Usar modelo mais rápido para teste

            return result.length > 0;
        } catch (error) {
            console.error('❌ Whisper não está funcionando:', error.message);
            return false;
        }
    }

    /**
     * Retorna informações sobre os modelos disponíveis
     * @returns {Object}
     */
    getModelsInfo() {
        return this.models;
    }

    /**
     * Verifica se um modelo é válido
     * @param {string} model - Nome do modelo
     * @returns {boolean}
     */
    isValidModel(model) {
        return model in this.models;
    }
}

module.exports = WhisperSTT;
