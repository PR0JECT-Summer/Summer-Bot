const path = require('path');
const STTBridge = require('./src/handlers/sttBridge');
const AudioConverter = require('./src/handlers/converter');

async function testSTTComplete() {
    try {
        console.log('🧪 === TESTE COMPLETO DO PIPELINE STT ===\n');

        const stt = new STTBridge();
        const converter = new AudioConverter();

        console.log('📋 Verificando configurações:');
        console.log(`   Modelo Vosk: ${stt.modelPath}`);
        console.log(`   Script Python: ${stt.scriptPath}`);
        console.log('');

        // Teste 1: Verificar se FFmpeg está funcionando
        console.log('1️⃣ Testando FFmpeg...');
        try {
            // Criar um arquivo de teste OGG simples (se você tiver um)
            const testOggPath = path.join(__dirname, './assets/raw/test.ogg');

            // Se não tiver arquivo de teste, vamos pular
            console.log(`   Procurando arquivo teste: ${testOggPath}`);

            const fs = require('fs');
            if (fs.existsSync(testOggPath)) {
                console.log('   ✅ Arquivo de teste encontrado!');

                // Teste de conversão
                console.log('   🔄 Testando conversão...');
                const wavPath = await converter.convertOggToWav(testOggPath);
                console.log(`   ✅ Conversão OK: ${wavPath}`);

                // Teste de transcrição
                console.log('   🎤 Testando transcrição...');
                const transcription = await stt.transcribeWithVosk(wavPath);
                console.log(`   ✅ Transcrição: "${transcription}"`);

                // Teste completo
                console.log('\n2️⃣ Testando pipeline completo...');
                const fullResult = await stt.processAudio(testOggPath, false);
                console.log(`   ✅ Resultado final: "${fullResult}"`);

            } else {
                console.log('   ⚠️  Arquivo de teste não encontrado.');
                console.log('   💡 Para testar completamente:');
                console.log('      1. Grave um áudio no Discord com !gravar');
                console.log('      2. Copie o arquivo .ogg para assets/raw/test.ogg');
                console.log('      3. Execute este teste novamente');
            }

        } catch (error) {
            console.error('   ❌ Erro no teste FFmpeg:', error.message);
        }

        // Teste 2: Verificar dependências
        console.log('\n3️⃣ Verificando dependências...');

        try {
            const ffmpegStatic = require('ffmpeg-static');
            console.log(`   ✅ FFmpeg: ${ffmpegStatic}`);
        } catch (error) {
            console.log('   ❌ FFmpeg não encontrado - instale: npm install ffmpeg-static');
        }

        try {
            require('fluent-ffmpeg');
            console.log('   ✅ fluent-ffmpeg instalado');
        } catch (error) {
            console.log('   ❌ fluent-ffmpeg não encontrado - instale: npm install fluent-ffmpeg');
        }

        // Teste 3: Verificar Python e Vosk
        console.log('\n4️⃣ Verificando Python e Vosk...');

        const { spawn } = require('child_process');

        // Verificar Python
        const pythonTest = spawn('python', ['--version']);
        pythonTest.on('close', (code) => {
            if (code === 0) {
                console.log('   ✅ Python está disponível');
            } else {
                console.log('   ❌ Python não encontrado no PATH');
            }
        });

        pythonTest.on('error', () => {
            console.log('   ❌ Python não encontrado no PATH');
        });

        // Verificar se o modelo Vosk existe
        const fs = require('fs');
        if (fs.existsSync(stt.modelPath)) {
            console.log('   ✅ Modelo Vosk encontrado');
        } else {
            console.log('   ❌ Modelo Vosk não encontrado');
            console.log('   💡 Verifique o caminho:', stt.modelPath);
        }

        console.log('\n🎯 === TESTE CONCLUÍDO ===');

    } catch (error) {
        console.error('❌ Erro geral no teste:', error);
    }
}

// Executar teste
testSTTComplete();
