# Guia de Deploy para Cloudflare Pages - Cofre Capital

Este documento descreve como configurar o deploy correto do projeto Cofre Capital no **Cloudflare Pages**. A falha `Não foi possível detectar um diretório contendo arquivos estáticos` e a execução do comando `npx wrangler deploy` indicam que as configurações de build na plataforma do Cloudflare não estão refletindo a estrutura do nosso monorepo (usando `pnpm`).

## Passo 1: Acesse as Configurações do seu Projeto no Cloudflare

1. Vá ao painel de controle do [Cloudflare](https://dash.cloudflare.com/).
2. Clique em **Workers & Pages** no menu lateral esquerdo.
3. Selecione o seu projeto `investimento-poupanca`.
4. Vá até a aba **Settings** (Configurações) e depois em **Builds & deployments**.
5. Na seção **Build configurations**, clique em **Edit configurations** (Editar configurações).

## Passo 2: Configurações Corretas de Build

Para que o deploy funcione corretamente numa estrutura monorepo pnpm, defina **exatamente** os seguintes valores:

- **Framework preset** (Predefinição de framework): `None` (Nenhum)
- **Build command** (Comando de build): `npm install -g pnpm && pnpm install && pnpm --filter cofre-capital build`
- **Build output directory** (Diretório de saída): `artifacts/cofre/dist/public`
- **Root directory** (Diretório raiz): *(Deixe em branco ou coloque `/`)*

> **Nota importante:** Se a versão de execução do ambiente Cloudflare que você usa suportar nativamente o pnpm, você pode usar apenas `pnpm install && pnpm --filter cofre-capital build`. O comando acima (`npm install -g pnpm &&...`) garante que a plataforma instale o pnpm caso não o tenha de imediato.

## Passo 3: Variáveis de Ambiente (OBRIGATÓRIO)

Ainda na aba **Settings** > **Environment variables** (Variáveis de Ambiente), você deve adicionar todas as chaves do Firebase (caso contrário, a aplicação renderizada falhará imediatamente após o deploy).

Adicione as variáveis para o ambiente de **Production**:

| Variável | Valor |
| :--- | :--- |
| `VITE_FIREBASE_API_KEY` | `AIzaSyAUXSY7an0z_mbidx8y3DDDVVHaAGtS0Ak` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `investimento-poupanca.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `investimento-poupanca` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `investimento-poupanca.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `673527529570` |
| `VITE_FIREBASE_APP_ID` | `1:673527529570:web:6eb8027566e66b1592d13b` |

> *Aviso:* Verifique os valores das variáveis pelo seu ficheiro local. A lista acima tem as chaves conhecidas do arquivo de configuração antigo.

## Passo 4: Definir a Versão do Node (Opcional, porém recomendado)

Para evitar problemas de compatibilidade do Node no Cloudflare Pages:
1. Nas Variáveis de Ambiente, adicione também:
   - Variável: `NODE_VERSION`
   - Valor: `20` (ou superior)

## Passo 5: Refazer o Build

Após salvar todas as configurações acima, vá até a aba **Deployments**, clique no menu de três pontos "..." ao lado do commit mais recente e selecione **Retry deployment** (Tentar realizar o deployment novamente). O Cloudflare agora vai baixar as bibliotecas corretamente via `pnpm` e compilar o diretório `artifacts/cofre/dist/public` onde a UI reside!
