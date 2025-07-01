import whisper
import sys
import json
import os
import time
import warnings

# Suprimir warnings desnecessários do Whisper
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=FutureWarning)

def transcribe_with_whisper(audio_file_path, model_name="base"):
    """
    Transcreve áudio usando Whisper local
    """
    try:
        start_time = time.time()
        
        # Verificar se arquivo existe
        if not os.path.exists(audio_file_path):
            print(f"[ERROR] Arquivo não encontrado: {audio_file_path}")
            return ""
        
        # Verificar tamanho do arquivo
        file_size = os.path.getsize(audio_file_path)
        if file_size == 0:
            print(f"[ERROR] Arquivo vazio: {audio_file_path}")
            return ""
        
        print(f"[INFO] Carregando modelo Whisper: {model_name}")
        
        # Carregar modelo Whisper
        model = whisper.load_model(model_name)
        
        # Transcrever áudio
        print(f"[INFO] Transcrevendo: {os.path.basename(audio_file_path)} ({file_size} bytes)")
        
        result = model.transcribe(
            audio_file_path,
            language="pt",  # Português brasileiro
            task="transcribe",
            fp16=False,  # Compatibilidade máxima
            verbose=False,
            temperature=0.0,  # Deterministico
            no_speech_threshold=0.6,  # Detectar silêncio
            logprob_threshold=-1.0,
            compression_ratio_threshold=2.4
        )
        
        # Extrair texto
        transcribed_text = result.get("text", "")
        if isinstance(transcribed_text, str):
            transcribed_text = transcribed_text.strip()
        else:
            transcribed_text = str(transcribed_text).strip() if transcribed_text else ""
        
        # Capitalizar primeira letra se não estiver vazio
        if transcribed_text and len(transcribed_text) > 0:
            transcribed_text = transcribed_text[0].upper() + transcribed_text[1:]
        
        elapsed_time = time.time() - start_time
        
        if transcribed_text:
            print(f"[SUCCESS] Whisper transcreveu em {elapsed_time:.2f}s")
        else:
            print(f"[INFO] Whisper não detectou fala em {elapsed_time:.2f}s")
        
        return transcribed_text
        
    except Exception as e:
        print(f"[ERROR] Erro durante transcrição Whisper: {str(e)}")
        return ""

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("[ERROR] Uso: python whisper_transcribe.py <audio_file> <model_name>")
        sys.exit(1)
    
    audio_file = sys.argv[1]
    model_name = sys.argv[2]
    
    result = transcribe_with_whisper(audio_file, model_name)
    
    # Retornar apenas o resultado para o JavaScript
    print(result)
