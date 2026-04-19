@echo off
setlocal
echo ===========================================
echo      SINCRONIZAR COM GITHUB - CLOUDFLARE
echo ===========================================
echo.
echo Este script enviara os dados recentes para o GitHub,
echo corrigindo o erro onde o Cloudflare nao encontrou o package.json.
echo.

:: 1. Verificar se estamos na pasta correta
if not exist "package.json" (
    echo [ERRO] Pasta nao reconhecida. Certifique-se que esta na raiz do projeto.
    pause
    exit /b 1
)

:: 2. Adicionar as mudancas (Stage)
echo [1/3] Preparando os ficheiros para o commit...
git add .

:: 3. Criar o commit
echo.
echo [2/3] Criando o commit...
git commit -m "chore: atualizando arquivos estruturais para deploy no cloudflare"

:: 4. Enviar os arquivos para o GitHub (Push)
echo.
echo [3/3] Enviando para o repositorio base no GitHub...
git push origin HEAD

if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha no push. Verifique se o seu git esta logado.
    pause
    exit /b %errorlevel%
)

echo.
echo ===========================================
echo   TODOS OS FICHEIROS ENVIADOS COM SUCESSO!
echo ===========================================
echo.
echo O que fazer agora:
echo 1. Va ate o painel da sua Cloudflare.
echo 2. Nas configuracoes de deploy (Builds e deployments) configure:
echo    - Build command: pnpm install ^&^& pnpm --filter cofre-capital build
echo    - Build output directory: artifacts/cofre/dist/public
echo 3. Clique para repetir o Build na Cloudflare.
echo.
pause
