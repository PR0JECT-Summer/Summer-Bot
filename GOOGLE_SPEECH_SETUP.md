# Configurações do Google Cloud Speech-to-Text

## Como configurar:

### 1. Criar projeto no Google Cloud Console
1. Acesse: https://console.cloud.google.com/
2. Crie um novo projeto ou selecione um existente
3. Ative a API "Cloud Speech-to-Text API"

### 2. Criar chave de serviço
1. Vá em "IAM & Admin" > "Service Accounts"
2. Clique em "Create Service Account"
3. Dê um nome e descrição
4. Adicione a role: "Cloud Speech Client"
5. Clique em "Create Key" > JSON
6. Baixe o arquivo JSON

### 3. Configurar credenciais
Opção A - Variável de ambiente (Recomendado):
```
GOOGLE_APPLICATION_CREDENTIALS=C:\caminho\para\sua\chave.json
```

Opção B - Adicionar ao .env:
```
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
```

### 4. Testar configuração
Execute: `node test-google-speech.js`

## Custos (Janeiro 2024):
- Primeiros 60 minutos/mês: GRÁTIS
- Após isso: ~$0.006 por 15 segundos
- Muito barato para uso pessoal!

## Vantagens sobre Vosk:
- ✅ Qualidade muito superior
- ✅ Pontuação automática
- ✅ Suporte a múltiplos idiomas
- ✅ Reconhecimento de comando de voz
- ✅ Filtros de profanidade
- ✅ Reconhecimento de múltiplos falantes
