# 🔧 CONFIGURAÇÃO DO SUMMER BOT

## ✅ Estrutura do Projeto Concluída!

O projeto foi reorganizado com sucesso na estrutura solicitada:

```
summer-bot/
├── assets/                    # ✅ Arquivos de áudio temporários
│   ├── raw/                   # ✅ Áudios .ogg recebidos do Discord
│   └── processed/             # ✅ Áudios .wav convertidos para STT
│
├── scripts/                  # ✅ Scripts auxiliares em Python
│   └── transcribe.py         # ✅ Script que usa Vosk para transcrição
│
├── src/                      # ✅ Código principal do bot em Node.js
│   ├── bot.js                # ✅ Inicialização do Discord bot
│   ├── commands/             # ✅ Comandos de texto
│   ├── handlers/             # ✅ Funções de manipulação de áudio e STT
│   │   ├── audioReceiver.js  # ✅ Captura voz em tempo real
│   │   ├── converter.js      # ✅ Conversão OGG → WAV
│   │   └── sttBridge.js      # ✅ Chama o script Python com Vosk
│   └── tts/                  # ✅ Sistema de Text-to-Speech
│       └── speak.js
│
├── vosk-model/               # ⚠️ Pasta do modelo Vosk (FALTA BAIXAR)
│   └── vosk-model-small-pt-0.3/
│
├── .env                      # ⚠️ Token do Discord (FALTA CONFIGURAR)
├── package.json              # ✅ Configurado
└── README.md                 # ✅ Documentação
```

## 🎯 Próximos Passos:

### 1. ⚠️ Configurar Token do Discord
```bash
# Edite o arquivo .env e coloque seu token real:
DISCORD_TOKEN=SEU_TOKEN_REAL_AQUI
```

### 2. 📥 Baixar Modelo Vosk (para STT)
```bash
# 1. Visite: https://alphacephei.com/vosk/models
# 2. Baixe: vosk-model-small-pt-0.3
# 3. Extraia para: vosk-model/vosk-model-small-pt-0.3/
```

### 3. 🚀 Executar o Bot
```bash
# Opção 1: Via npm
npm start

# Opção 2: Via script Windows
start.bat

# Opção 3: Desenvolvimento (com reload automático)
npm run dev
```

## 🎮 Comandos do Bot:

- `!ping` - Teste de conectividade
- `!join` - Bot entra no canal de voz
- `!leave` - Bot sai do canal de voz
- `!help` - Lista de comandos

## 📋 Status Atual:

✅ **Concluído:**
- [x] Estrutura de pastas organizada
- [x] Bot básico funcionando
- [x] Sistema modular STT/TTS preparado
- [x] Scripts de automação criados
- [x] Documentação completa

⚠️ **Pendente:**
- [ ] Token do Discord válido
- [ ] Modelo Vosk baixado
- [ ] Teste das funcionalidades STT/TTS

O projeto está **80% concluído** e pronto para uso assim que você configurar o token e baixar o modelo Vosk!
