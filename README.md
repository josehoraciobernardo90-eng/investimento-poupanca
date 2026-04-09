# Cofre Capital - Investimento Seguro & Crescimento Coletivo

## 🏦 Sobre o Projeto
O **Cofre Capital** é uma plataforma digital de gestão de poupança e crédito comunitário, projetada para oferecer transparência e segurança em investimentos coletivos. Situado em **Chimoio, Moçambique**, o sistema moderniza a prática de poupança em grupo, permitindo o acompanhamento em tempo real de capitais, depósitos e empréstimos.

## 🚀 Funcionalidades Principais
- **💳 Portal do Membro:**
  - Consulta de saldo acumulado em tempo real.
  - Histórico detalhado de aportes e rendimentos.
  - Solicitação simplificada de empréstimos e acompanhamento de status.
  - Sistema de notificações e alertas.
- **🛡️ Painel Administrativo:**
  - Gestão completa de membros e aprovações de registro.
  - Controle rigoroso de fluxos financeiros e liquidez do cofre.
  - Sistema de auditoria para rastrear todas as movimentações.
  - Gestão de regras de crédito e penalidades.

## 🛠️ Tecnologias Utilizadas
- **Frontend:** [React](https://reactjs.org/) + [Vite](https://vitejs.dev/) (Interface rápida e moderna)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/) (Segurança de tipos)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/)
- **Animações:** [Framer Motion](https://www.framer.com/motion/) (Design Premium e UI fluida)
- **Infraestrutura:** [Firebase](https://firebase.google.com/) (Realtime Database, Authentication & Hosting)

## 📦 Estrutura do Monorepo
Este projeto utiliza um workspace **pnpm** para gerenciar as dependências de forma eficiente:
- `/artifacts/cofre`: Aplicação principal (Frontend).
- `/lib`: Bibliotecas compartilhadas e lógica de negócio.
- `/scripts`: Scripts de automação e utilitários.

## ⚙️ Como Instalar e Rodar
1. **Clone o repositório:**
   ```bash
   git clone https://github.com/josehoraciobernardo90-eng/investimento-poupanca.git
   ```
2. **Instale as dependências:**
   ```bash
   pnpm install
   ```
3. **Configure o Firebase:**
   Crie um arquivo `.env` na raiz (ou dentro de `artifacts/cofre`) com as suas chaves do Firebase:
   ```env
   VITE_FIREBASE_API_KEY=seu_api_key
   VITE_FIREBASE_AUTH_DOMAIN=seu_auth_domain
   VITE_FIREBASE_PROJECT_ID=seu_project_id
   VITE_FIREBASE_STORAGE_BUCKET=seu_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
   VITE_FIREBASE_APP_ID=seu_app_id
   VITE_FIREBASE_DATABASE_URL=seu_database_url
   ```
4. **Inicie o servidor de desenvolvimento:**
   ```bash
   pnpm dev
   ```

## 🌍 Impacto Local
Este sistema foi desenvolvido para fortalecer a economia colaborativa em **Chimoio**, adaptando as melhores práticas globais de software para a realidade e necessidade das comunidades moçambicanas.

---
*Gerenciado e mantido por Jose Horacio Bernardo* 🇲🇿
