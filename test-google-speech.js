const GoogleSpeechSTT = require('./src/handlers/googleSpeech');
const STTBridge = require('./src/handlers/sttBridge');
const path = require('path');

async function testGoogleSpeech() {
    try {
        console.log('🧪 === TESTE DA GOOGLE SPEECH API ===\n');
        
        const stt = new STTBridge();
        
        // 1. Testar credenciais
        console.log('1️⃣ Testando credenciais do Google Cloud...');
        const hasCredentials = await stt.testGoogleSpeech();
        
        if (!hasCredentials) {
            console.log('❌ Credenciais do Google Cloud não configuradas');
            console.log('💡 Siga as instruções em GOOGLE_SPEECH_SETUP.md');
            console.log('🔄 Usando Vosk como fallback...\n');
        } else {
            console.log('✅ Credenciais do Google Cloud configuradas!\n');
        }
        
        // 2. Testar com arquivo de áudio (se existir)
        console.log('2️⃣ Testando transcrição...');
        
        const testWavFile = path.join(__dirname, './assets/processed/test.wav');
        const fs = require('fs');
        
        if (fs.existsSync(testWavFile)) {
            console.log(`📁 Arquivo de teste encontrado: ${testWavFile}`);
            
            console.log('🤖 Testando Google Speech...');
            const transcription = await stt.transcribeWithBestMethod(testWavFile);
            
            console.log(`✅ Resultado: "${transcription}"`);
            
        } else {
            console.log('⚠️ Arquivo de teste não encontrado');
            console.log('💡 Para testar completamente:');
            console.log('   1. Execute o bot e grave um áudio');
            console.log('   2. Copie um arquivo .wav para assets/processed/test.wav');
            console.log('   3. Execute este teste novamente');
        }
        
        // 3. Informações de configuração
        console.log('\n3️⃣ Configuração atual:');
        console.log(`   Google Speech: ${hasCredentials ? '✅ Ativo' : '❌ Inativo'}`);
        console.log(`   Vosk Fallback: ✅ Disponível`);
        console.log(`   Método preferido: ${hasCredentials ? 'Google Speech' : 'Vosk'}`);
        
        console.log('\n🎯 === TESTE CONCLUÍDO ===');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
    }
}

// Executar teste
testGoogleSpeech();
