const speech = require('@google-cloud/speech');
const fs = require('fs');
const path = require('path');
const os = require('os');

class GoogleSpeechSTT {
    constructor() {
        this.client = null;
        this.isAvailable = false;
        this.initializeClient();
        
        this.config = {
            encoding: 'LINEAR16',
            sampleRateHertz: 16000,
            languageCode: 'pt-BR',
            alternativeLanguageCodes: ['en-US'], // Fallback para inglês
            enableAutomaticPunctuation: true,
            enableWordTimeOffsets: false,
            model: 'latest_long', // Melhor para áudio mais longo
        };
    }

    /**
     * Inicializa o cliente Google Speech de forma segura
     */
    initializeClient() {
        try {
            // Tentar diferentes formas de carregar as credenciais
            const credentialsPath = this.findCredentialsPath();
            
            if (credentialsPath && fs.existsSync(credentialsPath)) {
                console.log(`🔑 Carregando credenciais Google Cloud de: ${path.basename(credentialsPath)}`);
                this.client = new speech.SpeechClient({
                    keyFilename: credentialsPath
                });
                this.isAvailable = true;
                console.log('✅ Google Speech STT inicializado com sucesso');
            } else {
                console.log('⚠️ Credenciais Google Cloud não encontradas');
                console.log('💡 Para usar Google Speech, configure as credenciais:');
                console.log('   1. Baixe o arquivo de credenciais do Google Cloud');
                console.log('   2. Coloque em: %USERPROFILE%\\.config\\summer-bot\\google-credentials.json');
                console.log('   3. Ou defina GOOGLE_APPLICATION_CREDENTIALS');
                this.isAvailable = false;
            }
        } catch (error) {
            console.error('❌ Erro ao inicializar Google Speech STT:', error.message);
            this.isAvailable = false;
        }
    }

    /**
     * Encontra o caminho das credenciais do Google Cloud
     * @returns {string|null} Caminho para o arquivo de credenciais ou null
     */
    findCredentialsPath() {
        // Lista de locais possíveis para as credenciais
        const possiblePaths = [
            // Variável de ambiente (método recomendado para produção)
            process.env.GOOGLE_APPLICATION_CREDENTIALS,
            
            // Diretório de configuração do usuário (método recomendado para desenvolvimento)
            path.join(os.homedir(), '.config', 'summer-bot', 'google-credentials.json'),
            
            // Diretório local credentials (para desenvolvimento)
            path.join(__dirname, '..', '..', 'credentials', 'google-credentials.json'),
            
            // Path antigo (para compatibilidade temporária - será removido)
            path.join(__dirname, '..', '..', 'gen-lang-client-0414032880-68c7e0d48736.json')
        ];

        for (const credPath of possiblePaths) {
            if (credPath && fs.existsSync(credPath)) {
                return credPath;
            }
        }

        return null;
    }

    /**
     * Transcreve arquivo WAV usando Google Speech-to-Text
     * @param {string} audioFilePath - Caminho para arquivo WAV
     * @returns {Promise<string>} - Texto transcrito
     */
    async transcribe(audioFilePath) {
        try {
            // Verificar se o cliente está disponível
            if (!this.isAvailable || !this.client) {
                throw new Error('Google Speech STT não está disponível. Verifique as credenciais.');
            }

            console.log(`🤖 Transcrevendo com Google Speech: ${path.basename(audioFilePath)}`);

            // Verificar se o arquivo existe
            if (!fs.existsSync(audioFilePath)) {
                throw new Error(`Arquivo não encontrado: ${audioFilePath}`);
            }

            // Ler arquivo de áudio
            const audioBytes = fs.readFileSync(audioFilePath).toString('base64');

            // Configurar requisição
            const request = {
                audio: {
                    content: audioBytes,
                },
                config: this.config,
            };

            console.log('📡 Enviando áudio para Google Speech...');

            // Fazer reconhecimento
            const [response] = await this.client.recognize(request);
            const transcription = response.results
                .map(result => result.alternatives[0].transcript)
                .join('\n');

            if (transcription && transcription.trim()) {
                console.log(`✅ Google Speech - Transcrição: "${transcription}"`);
                return transcription.trim();
            } else {
                console.log('🔇 Google Speech - Nenhum texto detectado');
                return '';
            }

        } catch (error) {
            console.error('❌ Erro na Google Speech API:', error.message);

            // Verificar tipos de erro específicos
            if (error.message.includes('INVALID_ARGUMENT')) {
                console.error('💡 Dica: Verifique se o arquivo WAV está no formato correto (16kHz, mono)');
            } else if (error.message.includes('UNAUTHENTICATED')) {
                console.error('💡 Dica: Configure as credenciais do Google Cloud');
                console.error('   1. Crie um projeto no Google Cloud Console');
                console.error('   2. Ative a Speech-to-Text API');
                console.error('   3. Crie uma chave de serviço');
                console.error('   4. Defina GOOGLE_APPLICATION_CREDENTIALS=caminho/para/chave.json');
            }

            throw error;
        }
    }

    /**
     * Transcreve áudio longo usando operação assíncrona
     * Para áudios > 1 minuto ou > 10MB
     * @param {string} audioFilePath - Caminho para arquivo WAV
     * @returns {Promise<string>} - Texto transcrito
     */
    async transcribeLongAudio(audioFilePath) {
        try {
            console.log(`🤖 Transcrevendo áudio longo com Google Speech: ${path.basename(audioFilePath)}`);

            // Para áudios longos, é melhor usar Google Cloud Storage
            // Por enquanto, vamos usar o método síncrono mesmo
            return await this.transcribe(audioFilePath);

        } catch (error) {
            console.error('❌ Erro na transcrição de áudio longo:', error.message);
            throw error;
        }
    }

    /**
     * Verifica se as credenciais estão configuradas
     * @returns {Promise<boolean>} - True se as credenciais estão OK
     */
    async testCredentials() {
        try {
            // Verificar se o cliente está disponível
            if (!this.isAvailable || !this.client) {
                console.error('❌ Google Speech STT não está inicializado');
                return false;
            }

            console.log('🔐 Testando credenciais do Google Cloud...');

            // Fazer uma chamada simples para testar
            const request = {
                audio: {
                    content: '', // Vazio, só para testar autenticação
                },
                config: {
                    encoding: 'LINEAR16',
                    sampleRateHertz: 16000,
                    languageCode: 'pt-BR',
                },
            };

            await this.client.recognize(request);
            return true;

        } catch (error) {
            if (error.message.includes('UNAUTHENTICATED')) {
                console.error('❌ Credenciais não configuradas');
                return false;
            } else if (error.message.includes('INVALID_ARGUMENT')) {
                // Erro esperado com áudio vazio, mas autenticação OK
                console.log('✅ Credenciais configuradas corretamente');
                return true;
            }

            console.error('❌ Erro ao testar credenciais:', error.message);
            return false;
        }
    }
}

module.exports = GoogleSpeechSTT;
