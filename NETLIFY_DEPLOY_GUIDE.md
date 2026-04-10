# Guia de Deploy para Netlify - Cofre Capital

Este documento descreve como configurar o deploy contínuo do projeto Cofre Capital no Netlify.

## Passo 1: Conectar o Repositório
1. Crie uma conta no [Netlify](https://www.netlify.com/).
2. Clique em **Add new site** > **Import an existing project**.
3. Selecione seu provedor de Git (GitHub, GitLab, etc) e escolha este repositório.

## Passo 2: Configurações no Painel do Netlify
Para que o build funcione corretamente num monorepo pnpm, configure estes campos na UI do Netlify (**Site settings > Build & deploy > Continuous Deployment > Build settings**):

- **Base directory**: (Deixe em branco ou coloque `/`)
- **Build command**: `pnpm install && pnpm --filter cofre-capital build`
- **Publish directory**: `artifacts/cofre/dist/public`

## Passo 3: Variáveis de Ambiente (OBRIGATÓRIO)
Adicione as seguintes variáveis em (**Site settings > Build & deploy > Environment > Variables**):

| Variável | Valor |
| :--- | :--- |
| `VITE_FIREBASE_API_KEY` | `AIzaSyAUXSY7an0z_mbidx8y3DDDVVHaAGtS0Ak` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `investimento-poupanca.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `investimento-poupanca` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `investimento-poupanca.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `673527529570` |
| `VITE_FIREBASE_APP_ID` | `1:673527529570:web:6eb8027566e66b1592d13b` |

## Solução de Problemas
- **Erro ENOENT package.json**: Certifique-se de que o **Base directory** está vazio no Netlify. Se estiver definido como `artifacts/cofre`, o Netlify não encontrará o `pnpm-workspace.yaml` na raiz.
- **PNPM não encontrado**: O Netlify detecta o `pnpm-lock.yaml` automaticamente, mas garantir que o comando de build começa com `pnpm install` resolve a maioria dos problemas.
