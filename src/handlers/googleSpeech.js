const speech = require('@google-cloud/speech');
const fs = require('fs');
const path = require('path');

class GoogleSpeechSTT {
    constructor() {
        // Configurar cliente da Google Speech com as credenciais diretas
        const credentials = {
            type: "service_account",
            project_id: "gen-lang-client-0414032880",
            private_key_id: "68c7e0d4873658c8c1e35547ee82af29c84b4014",
            private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCiLMq+Iy+mIdVY\nYMRXaVAvwMxwmLcFFZajX3OE4WK5y//SI08CoAqkzu+DbWzVJwJKSyZZ67C1EXHv\nW0H+rfzs3pnDEkPyn6+EzZk8mZ/GQQc30GaybILxRM979PIjscYVklTnRJxHK40w\niKKCAquskVzaVB4RBYYrmBzD+/nlcVUr9wNCdNmtO5kgwPlpjIeyQlJen+187zfT\nT0oiTz4kvbVl3+4x5YzD3O5A6UK9dRJ/kezX1gK7Theicrsk0MbKeagpWVD/CC+h\nSgHzjEQtYUByDRJcHi+zkirhcOH+GgFmQV81FHDn3ECrp+qc2PH7t9fZKqpBJ5Jv\nGCXq6qb3AgMBAAECggEAHxvfgkymmcQ4tBzP3QKvJpHhxaGNzhRfkpQ/SRihAwn+\nVzV9tP+1OvsVF814SIUUm+LBhxM+kOU5SVRkmvGOKHPk4/YPga2fEicMQ4MmknWr\n6El6QbSuA5ETCfCpOC6kVEP/NGPFZKOWkF5NagoQG2jA+oKTR+ma3KbvsaqWu6vN\nF+7ITWY6E6KmZDCo1fmYrr8SHonknGsyT2V2qGGtKOFOC7JzBTGDnRoJknzZ3jHj\ntfrhZPZhx+9Ejd9cGK92bisYgkM/L2AHOJK8NraBzR3NPlTUSK1fi3bp0aDEmwkE\nnyvNbKm2/tbLbgHqie2Xao49BpbQ6NSbqCzr1lIWGQKBgQDSbpBfPGqalX/BHJnm\nVOS9zNT9BpI0VEVZXSgXZisfnGBuZStwFREwP9VyTI33yTlcxuzAVsya2mpBECEy\n3V9Dc7hnwPx07LcDgQzWIIEPZEG6883R0OwVcnluWAjC48Hz6w9YhrRSimWzfr4D\ntlUfKT2PmfFjCkwRITdjuiWVjwKBgQDFSxKOEWmWxUmVY9mXP1QcmxhWufiqEsQ5\nk4MBijFYM3WaZC5SuaiS1UQ0ZYdH6z9oYh5mg0LLn2uXgLyApuqkoW1pT4jOIVdM\nwaQfkQ0hWJzSMIxwDTvklFAhMVpkSCOVNd6N2EANkwNj6a0tT3x5t/YSBb2hg2nq\n6fFAtEI0GQKBgEOPbdi1vAAveVnVxe92WA474jHuVyhn2fAMAaAplDTM7wTihGSy\nztbv16afv4DLYRhRYZeLBpu8/hovhIkhG8G7OHxPMH6VtVhxqV5iBy2a4aOVPQJd\nEj78htIPf5iaqR2X3VBtxx0tA+PyEC1+76tWgUZGhYJnvu5M/MyO6hwvAoGAaPIn\nG5Udkoq9Oo8TloWkS1cg2jkwkd9Lq8jQvgfxeZZd71Ns5KpHhluVXT3IeTQk1XSj\n8SnPZRsXE07ydojTdeE8nvEkt2k60+SJVhVFY8CMIq6adZxEiLFv8kgbag6JhvxR\ntygZ4l6aRhJuARUwBFsbtLiDB6Asvj3VC/MW6DkCgYEAj9ms10B1IM2faWCmgkDo\nHj8CUqniOox+VtpXg15CNRfcUQke0SLdkvAr9AaA+8yNzrIVbigkIYoA5NspnaBn\nu3R/ClTNkpAuBHpDNdGIoySnLiSvPM6PE62GVfavAk6HDwIEpJi1njBKpnTKm5w7\nVGDuU5wR/c30zlDEbgYsDYI=\n-----END PRIVATE KEY-----\n",
            client_email: "summer-stt@gen-lang-client-0414032880.iam.gserviceaccount.com",
            client_id: "115477543512668442370",
            auth_uri: "https://accounts.google.com/o/oauth2/auth",
            token_uri: "https://oauth2.googleapis.com/token",
            auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
            client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/summer-stt%40gen-lang-client-0414032880.iam.gserviceaccount.com",
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
     * Verifica se as credenciais estão configuradas
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
