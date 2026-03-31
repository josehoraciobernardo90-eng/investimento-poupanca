# Guia de Deploy para Netlify - Cofre Capital

Este documento descreve como configurar o deploy contínuo do projeto Cofre Capital no Netlify.

## Passo 1: Conectar o Repositório
1. Crie uma conta no [Netlify](https://www.netlify.com/).
2. Clique em **Add new site** > **Import an existing project**.
3. Selecione seu provedor de Git (GitHub, GitLab, etc) e escolha este repositório.

## Passo 2: Configurações de Build
O arquivo `netlify.toml` já foi configurado com os seguintes parâmetros:
- **Build command**: `cd artifacts/cofre && pnpm install && pnpm run build`
- **Publish directory**: `artifacts/cofre/dist/public`

## Passo 3: Variáveis de Ambiente (CRÍTICO)
Você deve adicionar as seguintes variáveis no painel do Netlify (**Site settings > Build & deploy > Environment**):

| Variável | Valor Sugerido (do seu .env local) |
| :--- | :--- |
| `VITE_FIREBASE_API_KEY` | `AIzaSyDrIhPjoCMGNne0sszExR8FaydIzQBMgZ4` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `investimento-poupaca.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `investimento-poupaca` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `investimento-poupaca.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `1091910401751` |
| `VITE_FIREBASE_APP_ID` | `1:1091910401751:web:0065479c4e592d694cfa92` |
| `VITE_FIREBASE_MEASUREMENT_ID` | `G-EXVKKX2X2E` |

## Observações
- O sistema já possui regras de redirecionamento para SPAs (React/Wouter), garantindo que rotas como `/dashboard` funcionem ao atualizar a página.
- O Node.js foi fixado na versão 20 para evitar erros de compilação.
