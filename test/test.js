const path = require('path');
const STTBridge = require('../src/handlers/sttBridge');
const { convertOggToWav } = require('../src/handlers/converter');

async function testSTT() {
    try {
        console.log('🧪 Testando pipeline STT...');

        // Exemplo: se você tiver um arquivo OGG de teste
        const testOggFile = path.join(__dirname, '../assets/raw/Test.ogg');

        // 1. Converter OGG para WAV
        console.log('1️⃣ Convertendo OGG para WAV...');
        const wavFile = await convertOggToWav(testOggFile);

        // 2. Transcrever
        console.log('2️⃣ Transcrevendo áudio...');
        const stt = new STTBridge();
        const text = await stt.transcribe(wavFile);

        console.log('🎯 Resultado final:', text);

    } catch (error) {
        console.error('❌ Erro no teste:', error);
    }
}

testSTT();