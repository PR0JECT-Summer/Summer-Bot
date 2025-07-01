const speech = require('@google-cloud/speech');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class GoogleSpeechSTT {
    constructor() {
        // Verificar se as variáveis de ambiente estão configuradas
        this.validateEnvironmentVariables();
        
        // Configurar cliente da Google Speech com credenciais do .env
        const credentials = {
            type: "service_account",
            project_id: process.env.GOOGLE_PROJECT_ID,
            private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // Converter \n literal para quebras de linha
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            client_id: process.env.GOOGLE_CLIENT_ID,
            auth_uri: "https://accounts.google.com/o/oauth2/auth",
            token_uri: "https://oauth2.googleapis.com/token",
            auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
            client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL,
            universe_domain: "googleapis.com"
        };

        this.client = new speech.SpeechClient({
            credentials: credentials,
            projectId: credentials.project_id
        });
        
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
     * Transcreve arquivo WAV usando Google Speech-to-Text
     * @param {string} audioFilePath - Caminho para arquivo WAV
     * @returns {Promise<string>} - Texto transcrito
     */
    async transcribe(audioFilePath) {
        try {
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
     * Verifica se as credenciais estão configuradas e funcionando
     * @returns {Promise<boolean>} - True se as credenciais estão OK
     */
    async testCredentials() {
        try {
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
                console.error('❌ Credenciais não autenticadas');
                console.error('💡 Verifique se as variáveis de ambiente estão corretas');
                return false;
            } else if (error.message.includes('INVALID_ARGUMENT')) {
                // Erro esperado com áudio vazio, mas autenticação OK
                console.log('✅ Credenciais configuradas e funcionando');
                return true;
            } else if (error.message.includes('PERMISSION_DENIED')) {
                console.error('❌ Permissões insuficientes na API do Google Cloud');
                console.error('💡 Verifique se a Speech-to-Text API está habilitada');
                return false;
            }
            
            console.error('❌ Erro ao testar credenciais:', error.message);
            return false;
        }
    }

    /**
     * Valida se todas as variáveis de ambiente necessárias estão configuradas
     * @throws {Error} - Se alguma variável estiver faltando
     */
    validateEnvironmentVariables() {
        const requiredVars = [
            'GOOGLE_PROJECT_ID',
            'GOOGLE_PRIVATE_KEY_ID', 
            'GOOGLE_PRIVATE_KEY',
            'GOOGLE_CLIENT_EMAIL',
            'GOOGLE_CLIENT_ID',
            'GOOGLE_CLIENT_X509_CERT_URL'
        ];

        const missingVars = requiredVars.filter(varName => !process.env[varName]);

        if (missingVars.length > 0) {
            console.error('❌ Variáveis de ambiente do Google Speech não configuradas:');
            missingVars.forEach(varName => {
                console.error(`   • ${varName}`);
            });
            console.error('\n💡 Configure as variáveis no arquivo .env:');
            console.error('   1. Copie google-credentials.example.json para .env');
            console.error('   2. Adicione as credenciais do Google Cloud');
            console.error('   3. Reinicie a aplicação');
            
            throw new Error(`Credenciais do Google Speech não configuradas. Faltam: ${missingVars.join(', ')}`);
        }

        console.log('✅ Variáveis de ambiente do Google Speech configuradas');
    }
}

module.exports = GoogleSpeechSTT;
