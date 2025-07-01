# Summer Bot - Discord STT/TTS Bot

Bot Discord com funcionalidades de Speech-to-Text (STT) e Text-to-Speech (TTS) usando Vosk para reconhecimento de voz em português.

## 📁 Estrutura do Projeto

```
summer-bot/
├── assets/                    # Arquivos de áudio temporários
│   ├── raw/                   # Áudios .ogg recebidos do Discord
│   └── processed/             # Áudios .wav convertidos para STT
│
├── scripts/                  # Scripts auxiliares em Python
│   └── transcribe.py         # Script que usa Vosk para transcrição
│
├── src/                      # Código principal do bot em Node.js
│   ├── bot.js                # Inicialização do Discord bot
│   ├── commands/             # Comandos de texto
│   ├── handlers/             # Funções de manipulação de áudio e STT
│   │   ├── audioReceiver.js  # Captura voz em tempo real
│   │   ├── converter.js      # Conversão OGG → WAV
│   │   └── sttBridge.js      # Chama o script Python com Vosk
│   └── tts/                  # Sistema de Text-to-Speech
│       └── speak.js
│
├── vosk-model/               # Pasta do modelo Vosk (descompactado)
│   └── vosk-model-small-pt-0.3/
│
├── .env                      # Tokens/API keys
├── package.json
└── README.md
```

## 🚀 Instalação

### 1. Instalar dependências Node.js
```bash
npm install
```

### 2. Instalar dependências Python
```bash
pip install vosk soundfile
```

### 3. Baixar modelo Vosk em português
```bash
# Baixe o modelo do site oficial do Vosk
# https://alphacephei.com/vosk/models
# Extraia para: vosk-model/vosk-model-small-pt-0.3/
```

### 4. Configurar variáveis de ambiente
```bash
cp .env.example .env
# Edite o .env com seu token do Discord
```

## 🎮 Comandos

- `!join` - Bot entra no canal de voz e inicia captura de áudio
- `!leave` - Bot sai do canal de voz

## 🔧 Funcionalidades

### ✅ Implementado
- [x] Estrutura modular do projeto
- [x] Captura de áudio do Discord
- [x] Conversão OGG → WAV
- [x] Transcrição usando Vosk (Python)
- [x] Exibição da transcrição no chat

### 🚧 Em desenvolvimento
- [ ] Sistema TTS completo
- [ ] Comandos avançados
- [ ] Interface de configuração
- [ ] Suporte a múltiplos idiomas

## ⚙️ Requisitos

- Node.js 16+
- Python 3.8+
- FFmpeg
- Modelo Vosk em português

## 📝 Uso

1. Convide o bot para seu servidor Discord
2. Use `!join` para o bot entrar no canal de voz
3. Fale no canal - o bot transcreverá automaticamente
4. Use `!leave` para o bot sair

## 🛠️ Desenvolvimento

```bash
# Modo desenvolvimento
npm run dev

# Executar normalmente
npm start
```

## 📄 Licença

ISC License
