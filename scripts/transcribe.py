# -*- coding: utf-8 -*-
import sys
import json
import wave
import os
from vosk import Model, KaldiRecognizer

def transcribe_audio(audio_file_path, model_path):
    """
    Transcreve um arquivo de áudio usando Vosk
    """
    try:
        # Verifica se o arquivo de áudio existe
        if not os.path.exists(audio_file_path):
            print(f"Erro: Arquivo de audio nao encontrado: {audio_file_path}")
            return ""
        
        # Verifica se o modelo existe
        if not os.path.exists(model_path):
            print(f"Erro: Modelo Vosk nao encontrado: {model_path}")
            return ""
        
        print(f"[INFO] Carregando modelo: {model_path}")
        model = Model(model_path)
        rec = KaldiRecognizer(model, 16000)
        
        print(f"[INFO] Processando audio: {audio_file_path}")
        wf = wave.open(audio_file_path, 'rb')
        
        # Verifica formato do áudio
        channels = wf.getnchannels()
        width = wf.getsampwidth()
        rate = wf.getframerate()
        
        print(f"[INFO] Formato do audio: {channels}ch, {width*8}bit, {rate}Hz")
        
        if channels != 1 or width != 2 or rate != 16000:
            print("[WARN] Formato pode nao ser ideal (recomendado: mono, 16-bit, 16kHz)")
        
        # Processa o áudio
        results = []
        while True:
            data = wf.readframes(4000)
            if len(data) == 0:
                break
            if rec.AcceptWaveform(data):
                result = json.loads(rec.Result())
                if result.get('text'):
                    results.append(result['text'])
        
        # Resultado final
        final_result = json.loads(rec.FinalResult())
        if final_result.get('text'):
            results.append(final_result['text'])
        
        wf.close()
        
        transcribed_text = ' '.join(results).strip()
        print(f"[SUCCESS] Transcricao: '{transcribed_text}'")
        return transcribed_text
        
    except Exception as e:
        print(f"[ERROR] Erro durante transcricao: {str(e)}")
        return ""

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Uso: python transcribe.py <arquivo_audio> <caminho_modelo>")
        sys.exit(1)
    
    audio_file = sys.argv[1]
    model_path = sys.argv[2]
    
    result = transcribe_audio(audio_file, model_path)
    
    # Saída no formato JSON para facilitar parsing no Node.js
    output = {
        "success": bool(result),
        "text": result,
        "audio_file": audio_file
    }
    
    print(json.dumps(output, ensure_ascii=False))