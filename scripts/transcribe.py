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
            print(f"[ERROR] Arquivo de audio nao encontrado: {audio_file_path}")
            return ""
        
        # Verifica se o modelo existe
        if not os.path.exists(model_path):
            print(f"[ERROR] Modelo Vosk nao encontrado: {model_path}")
            return ""
        
        # Detectar tipo de modelo
        print(f"[INFO] Detectando tipo de modelo: {model_path}")
        
        # Verificar estrutura do modelo
        model_files = os.listdir(model_path)
        print(f"[DEBUG] Arquivos/pastas no modelo: {model_files}")
        
        # Modelo antigo tem arquivos diretos (final.mdl, etc.)
        has_old_structure = any(f.endswith('.mdl') or f.endswith('.fst') for f in model_files)
        # Modelo novo tem pastas (am, conf, graph, etc.)
        has_new_structure = any(f in ['am', 'conf', 'graph'] for f in model_files)
        
        if has_old_structure:
            print("[INFO] Modelo tipo ANTIGO detectado (arquivos diretos)")
        elif has_new_structure:
            print("[INFO] Modelo tipo NOVO detectado (estrutura Kaldi)")
        else:
            print("[WARN] Estrutura de modelo desconhecida")
        
        print(f"[INFO] Carregando modelo: {model_path}")
        model = Model(model_path)
        rec = KaldiRecognizer(model, 16000)
        print("[SUCCESS] Modelo carregado com sucesso")
        
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