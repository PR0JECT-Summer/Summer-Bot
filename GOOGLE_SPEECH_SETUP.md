# Google Speech-to-Text Setup

## Configuração das Credenciais

### 1. Obter Credenciais do Google Cloud

1. **Acesse o Google Cloud Console**:
   - Vá para [console.cloud.google.com](https://console.cloud.google.com)
   - Crie um novo projeto ou selecione um existente

2. **Ative a API Speech-to-Text**:
   - Vá para "APIs & Services" > "Library"
   - Procure por "Cloud Speech-to-Text API"
   - Clique em "Enable"

3. **Crie uma Conta de Serviço**:
   - Vá para "IAM & Admin" > "Service Accounts"
   - Clique em "Create Service Account"
   - Dê um nome (ex: "summer-bot-stt")
   - Adicione as roles necessárias:
     - Cloud Speech Client
     - Service Account User

4. **Gere uma Chave**:
   - Selecione a conta de serviço criada
   - Vá para "Keys" > "Add Key" > "Create New Key"
   - Escolha formato JSON
   - Baixe o arquivo

### 2. Instalar Credenciais

**Opção 1 - Diretório de Configuração (Recomendado)**:
```bash
# Windows
mkdir "%USERPROFILE%\.config\summer-bot"
copy "caminho\para\credenciais.json" "%USERPROFILE%\.config\summer-bot\google-credentials.json"

# Linux/Mac
mkdir -p ~/.config/summer-bot
cp caminho/para/credenciais.json ~/.config/summer-bot/google-credentials.json
```

**Opção 2 - Variável de Ambiente**:
```bash
# Windows
set GOOGLE_APPLICATION_CREDENTIALS=C:\caminho\para\credenciais.json

# Linux/Mac
export GOOGLE_APPLICATION_CREDENTIALS=/caminho/para/credenciais.json
```

**Opção 3 - Diretório Local** (somente para desenvolvimento):
```bash
mkdir credentials
copy "caminho\para\credenciais.json" "credentials\google-credentials.json"
```

### 3. Verificação

Execute o teste para verificar se tudo está funcionando:
```bash
node test-google-speech.js
```

## Segurança

⚠️ **IMPORTANTE**: 
- **NUNCA** commite arquivos de credenciais no Git!
- As credenciais contêm chaves privadas que dão acesso ao seu projeto Google Cloud
- Mantenha as credenciais em local seguro fora do repositório
- Use o arquivo `google-credentials.example.json` como referência

✅ **Boas Práticas**:
- Use variáveis de ambiente em produção
- Mantenha credenciais no diretório de configuração do usuário
- Revogue e regenere chaves periodicamente
- Use roles com permissões mínimas necessárias

## Troubleshooting

### Erro "UNAUTHENTICATED"
- Verifique se o arquivo de credenciais existe no local correto
- Confirme que o arquivo JSON não está corrompido
- Verifique se a variável de ambiente está definida corretamente

### Erro "PERMISSION_DENIED"
- Verifique se a API Speech-to-Text está ativada
- Confirme que a conta de serviço tem as permissões corretas

### Erro "QUOTA_EXCEEDED"
- Verifique os limites de cota no Google Cloud Console
- Consider usar um plano pago se necessário

## Custos

A API Google Speech-to-Text tem os seguintes custos (valores aproximados):
- Primeiros 60 minutos por mês: **GRÁTIS**
- Após isso: ~$0.006 por 15 segundos de áudio
- Para uso moderado do bot, os custos são mínimos

Para mais informações: [cloud.google.com/speech-to-text/pricing](https://cloud.google.com/speech-to-text/pricing)