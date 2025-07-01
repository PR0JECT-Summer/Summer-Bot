@echo off
echo ===========================
echo    Summer Bot - Iniciando
echo ===========================
echo.

REM Verificar se o .env existe
if not exist .env (
    echo ❌ Arquivo .env não encontrado!
    echo.
    echo Crie um arquivo .env com:
    echo DISCORD_TOKEN=seu_token_aqui
    echo.
    pause
    exit /b 1
)

REM Verificar se node_modules existe
if not exist node_modules (
    echo ⚠️ Dependências não instaladas. Executando npm install...
    call npm install
    if errorlevel 1 (
        echo ❌ Erro ao instalar dependências!
        pause
        exit /b 1
    )
)

echo ✅ Iniciando Summer Bot...
echo.
node src/bot.js

pause
