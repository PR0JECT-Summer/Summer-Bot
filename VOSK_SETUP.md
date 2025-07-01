# Instruções para instalar o modelo Vosk

## 1. Baixar o modelo Vosk em português

Visite: https://alphacephei.com/vosk/models

Baixe o modelo recomendado para português:
- **vosk-model-small-pt-0.3** (50MB) - Recomendado para começar
- **vosk-model-pt-fb-v0.1.1** (1.5GB) - Modelo maior e mais preciso

## 2. Extrair o modelo

1. Baixe o arquivo .zip do modelo
2. Extraia o conteúdo na pasta `vosk-model/`
3. A estrutura deve ficar assim:

```
vosk-model/
└── vosk-model-small-pt-0.3/
    ├── am/
    ├── graph/
    ├── ivector/
    ├── conf/
    └── README
```

## 3. Verificar instalação

Execute este comando para testar se o modelo está funcionando:

```bash
python scripts/transcribe.py assets/processed/test.wav vosk-model/vosk-model-small-pt-0.3
```

## 4. Comandos de download direto (opcional)

```bash
# Modelo pequeno (50MB)
curl -L https://alphacephei.com/vosk/models/vosk-model-small-pt-0.3.zip -o vosk-model.zip
unzip vosk-model.zip -d vosk-model/
rm vosk-model.zip

# Modelo grande (1.5GB) - melhor qualidade
curl -L https://alphacephei.com/vosk/models/vosk-model-pt-fb-v0.1.1.zip -o vosk-model-large.zip
unzip vosk-model-large.zip -d vosk-model/
rm vosk-model-large.zip
```

## 5. Atualizar caminho no código (se necessário)

Se você usar um modelo diferente, atualize o caminho em:
`src/handlers/sttBridge.js` linha 6:

```javascript
this.modelPath = path.join(__dirname, '../../vosk-model/SEU-MODELO-AQUI');
```
