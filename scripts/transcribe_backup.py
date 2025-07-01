# -*- coding: utf-8 -*-
import sys
import json
import wave
import os
import numpy as np
from vosk import Model, KaldiRecognizer
from scipy.signal import butter, filtfilt

def preprocess_audio(audio_data, sample_rate):
    """
    Pré-processa o áudio para melhorar a qualidade do reconhecimento
    """
    try:
        # Verificar se há dados suficientes
        if len(audio_data) < 100:
            return audio_data
            
        # Normalização suave de volume
        if len(audio_data) > 0:
            # Calcular RMS para normalização mais suave
            rms = np.sqrt(np.mean(audio_data.astype(np.float32) ** 2))
            if rms > 0:
                # Normalização mais conservadora
                target_rms = 3000  # Valor target mais baixo
                scaling_factor = min(target_rms / rms, 2.0)  # Limitar amplificação
                audio_data = audio_data * scaling_factor
        
        # Filtros mais suaves (opcional e conservadores)
        try:
            # Apenas filtro passa-alta muito suave para remover ruído DC
            nyquist = sample_rate / 2
            low_cutoff = 50  # Hz - mais conservador
            
            if low_cutoff < nyquist:
                low = low_cutoff / nyquist
                b, a = butter(2, low, btype='high')  # Ordem mais baixa
                audio_data = filtfilt(b, a, audio_data.astype(np.float32))
        except Exception as filter_error:
            print(f"[INFO] Pulando filtros: {filter_error}")
            pass
        
        return audio_data.astype(np.int16)
    except Exception as e:
        print(f"[WARN] Erro no pré-processamento: {e}")
        return audio_data

def transcribe_audio(audio_file_path, model_path):
    """
    Transcreve um arquivo de áudio usando Vosk com melhorias
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
        
        # Configurar reconhecedor com parâmetros otimizados para melhor qualidade
        rec = KaldiRecognizer(model, 16000)
        
        # Configurações melhoradas se disponível
        try:
            rec.SetWords(True)  # Habilitar informações de palavras
            rec.SetMaxAlternatives(5)  # Mais alternativas para melhor precisão
            print("[INFO] Configuracoes avancadas habilitadas")
        except:
            print("[WARN] Usando configuracoes basicas")
        
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
        
        # Ler todo o áudio para pré-processamento
        print("[INFO] Lendo audio completo para pre-processamento...")
        audio_data = wf.readframes(wf.getnframes())
        wf.close()
        
        # Converter para numpy array
        audio_array = np.frombuffer(audio_data, dtype=np.int16)
        
        # Aplicar pré-processamento básico (mais conservador)
        print("[INFO] Aplicando pre-processamento conservador...")
        processed_audio = audio_array  # Sem processamento por enquanto
        
        # Converter de volta para bytes
        processed_data = processed_audio.tobytes()
        
        # Processa o áudio com chunks padrão
        print("[INFO] Iniciando reconhecimento...")
        results = []
        chunk_size = 2000  # Voltar ao padrão que funcionava
        
        for i in range(0, len(processed_data), chunk_size):
            chunk = processed_data[i:i + chunk_size]
            if len(chunk) == 0:
                break
            
            if rec.AcceptWaveform(chunk):
                result = json.loads(rec.Result())
                if result.get('text'):
                    # Filtrar resultados com critério mais flexível
                    text = result['text'].strip()
                    # Aceitar texto com pelo menos 1 palavra ou 2+ caracteres
                    if len(text) > 1:
                        results.append(text)
                        print(f"[PARTIAL] Chunk reconhecido: '{text}'")
        
        # Resultado final com melhor filtro
        final_result = json.loads(rec.FinalResult())
        if final_result.get('text'):
            final_text = final_result['text'].strip()
            # Aceitar resultado final com critério mais flexível
            if len(final_text) > 1:
                results.append(final_text)
                print(f"[FINAL] Resultado final: '{final_text}'")
        
        # Pós-processamento inteligente do texto
        transcribed_text = ' '.join(results).strip()
        
        # Melhorias no texto final
        if transcribed_text:
            # Remover duplicatas de palavras consecutivas
            words = transcribed_text.split()
            filtered_words = []
            prev_word = ""
            for word in words:
                if word.lower() != prev_word.lower():  # Evitar repetições
                    filtered_words.append(word)
                    prev_word = word
            
            transcribed_text = ' '.join(filtered_words)
            
            # Remover espaços duplos
            transcribed_text = ' '.join(transcribed_text.split())
            
            # Capitalizar primeira letra
            if transcribed_text and transcribed_text[0].islower():
                transcribed_text = transcribed_text[0].upper() + transcribed_text[1:]
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