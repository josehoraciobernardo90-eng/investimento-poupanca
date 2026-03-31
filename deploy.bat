@echo off
setlocal
echo ===========================================
echo      FORCAR DEPLOY: COFRE CAPITAL
echo ===========================================
echo.

:: 1. Verificar se estamos na pasta correta
if not exist "artifacts\cofre\package.json" (
    echo [ERRO] Pasta nao reconhecida. Rode este script na pasta raiz do projeto.
    pause
    exit /b 1
)

:: 2. Limpar a pasta de build anterior
echo [1/3] Limpando arquivos temporarios...
if exist "artifacts\cofre\dist" rmdir /s /q "artifacts\cofre\dist"

:: 3. Rodar a compilação DIRETO na subpasta (Pula a trava do root)
echo [2/3] Compilando versao ATUALIZADA (Vite)...
cd artifacts\cofre
call pnpm run build
cd ..\..
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] A compilação falhou criticamente.
    pause
    exit /b %errorlevel%
)

:: 4. Realizar o Deploy
echo.
echo [3/3] Enviando para Firebase Hosting...
call firebase deploy --only hosting
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] O deploy falhou. Verifique se voce fez 'firebase login'.
    pause
    exit /b %errorlevel%
)

echo.
echo ===========================================
echo        DEPLOY FORCADO COM SUCESSO!
echo ===========================================
echo URL: https://investimento-poupaca.web.app
echo.
echo DICA: Se nao aparecer na hora, use Ctrl + F5 no navegador.
echo.
pause
