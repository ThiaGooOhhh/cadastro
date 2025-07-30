# Guia Completo do Projeto de Gestão de Clientes

Este documento centraliza toda a informação essencial sobre a arquitetura, desafios, estrutura de código e configuração do projeto. Ele serve como a principal fonte de conhecimento para desenvolvedores atuais e futuros.

---

## 1. Visão Geral da Arquitetura

A aplicação foi desenvolvida seguindo uma arquitetura Full-Stack, separando as responsabilidades entre o cliente (Frontend) e o servidor (Backend).

-   **Frontend (React)**: É a interface com o usuário, responsável pela apresentação visual e interação. Ele não gerencia a persistência dos dados, apenas consome a API do backend.

-   **Backend (Node.js/Express)**: É o cérebro da aplicação. Um servidor responsável por toda a lógica de negócio:
    -   Receber requisições HTTP do frontend.
    -   Se comunicar com o banco de dados para operações de CRUD (Criar, Ler, Atualizar, Excluir).
    -   Gerenciar a segurança e as regras de negócio.

-   **Banco de Dados (Supabase/PostgreSQL)**: Substitui soluções temporárias como `localStorage` para armazenar os dados de clientes e visitas de forma persistente, segura e escalável.

---

## 2. Estrutura do Projeto (Monorepo)

O projeto é organizado como um monorepo, com o código do frontend e do backend em pastas separadas na raiz para maior clareza.

```
/
├── backend/                    # Aplicação Node.js (Servidor)
│   ├── .env                    # Arquivo com as chaves e segredos (NÃO versionado)
│   ├── backend.ts              # Ponto de entrada e lógica do servidor
│   ├── package.json
│   └── tsconfig.json
│
├── (Frontend - arquivos na raiz) # Aplicação React (Cliente)
│   ├── index.html
│   ├── ... (outros arquivos do frontend)
│
├── .gitignore
└── GUIA_DO_PROJETO.md          # Este arquivo
```

### Backend (`./backend`)

Para este projeto, a lógica do backend foi consolidada em um único arquivo (`backend.ts`) para simplificar a configuração inicial.

-   **`backend.ts`**: Contém:
    -   A configuração do servidor Express.
    -   A conexão com o Supabase.
    -   A definição de todas as rotas da API (`/api/clients`, `/api/visits`).
    -   A lógica de inicialização automática do banco de dados.

> **Nota para o Futuro**: Em projetos maiores, é recomendado modularizar o backend em uma estrutura mais robusta, como a sugerida em `estrutura.md`, separando `routes`, `controllers`, `services` e `models` em arquivos distintos.

---

## 3. Desafios e Lições Aprendidas (Histórico do Projeto)

Esta seção documenta os principais desafios técnicos encontrados e as soluções implementadas.

### Desafio 1: Volatilidade dos Dados no Desenvolvimento

-   **Problema:** Alterações como adicionar ou excluir um cliente eram perdidas ao salvar o código, devido ao Hot Module Replacement (HMR) que reiniciava o estado em memória do frontend.
-   **Causa Raiz:** Os dados eram mantidos em um array em memória no serviço do frontend.
-   **Solução Aplicada:** A solução definitiva foi criar um backend dedicado com um banco de dados, garantindo a persistência real dos dados fora do ciclo de vida do frontend.

### Desafio 2: Separação de Responsabilidades

-   **Problema:** A lógica de dados e a de apresentação estavam acopladas no frontend, dificultando a manutenção e a escalabilidade.
-   **Solução:** A aplicação foi refatorada para a arquitetura Full-Stack descrita neste documento, com uma API bem definida servindo como contrato entre o frontend e o backend.

### Desafio 3: Persistência e Normalização de Dados

-   **Problema:** Era necessário garantir a integridade dos dados e a relação entre clientes e visitas de forma eficiente.
-   **Solução:**
    -   **Banco de Dados Relacional:** Adoção do Supabase (PostgreSQL).
    -   **Schema Normalizado:** As tabelas `clients` e `visits` foram criadas com uma relação de chave estrangeira (`visits.client_id` -> `clients.id`) e uma política `ON DELETE CASCADE`. Isso garante que, ao excluir um cliente, todas as suas visitas associadas também sejam removidas, mantendo a integridade referencial.
    -   **Consultas Eficientes:** A rota `GET /api/visits` usa um `JOIN` para buscar o nome do cliente relacionado, evitando armazenar dados duplicados na tabela de visitas.

### Desafio 4: Gerenciamento de Configurações e Segredos

-   **Problema:** As credenciais do banco de dados e chaves de API são informações sensíveis e não devem ser expostas no código.
-   **Solução:**
    -   **Pacote `dotenv`:** Adicionado ao backend para carregar variáveis de ambiente a partir de um arquivo `.env`.
    -   **Arquivo `.gitignore`:** Configurado para ignorar todos os arquivos `.env` e a pasta `node_modules`, garantindo que segredos e dependências não sejam enviados para o repositório Git.

### Desafio 5: Inicialização e Migração do Banco de Dados

-   **Problema:** Como garantir que a estrutura do banco de dados (tabelas e colunas) esteja correta em qualquer ambiente de desenvolvimento?
-   **Solução:** Foi criada a função `initializeDatabase` em `backend.ts`.
    -   **Criação Automática:** Na primeira vez que o servidor é iniciado, a função verifica se as tabelas `clients` e `visits` existem. Se não, ela as cria com o schema correto, incluindo chaves estrangeiras e políticas de segurança (RLS).
    -   **Migração Simples:** A função também foi usada para aplicar migrações, como a remoção da coluna obsoleta `client_name` da tabela `visits`, mantendo o schema atualizado.

---

## 4. Guia de Instalação, Execução e Versionamento

Para executar o projeto completo, você precisará rodar o Backend e o Frontend separadamente.

### 4.1. Configuração do Backend

1.  **Navegue até a pasta do backend:**
    ```bash
    cd backend/
    ```

2.  **Instale as dependências:**
    -   Se for a primeira vez, inicialize o projeto e instale as dependências:
        ```bash
        npm init -y
        npm install express cors dotenv @supabase/supabase-js @google/genai pg
        npm install -D typescript ts-node @types/express @types/cors @types/node @types/pg
        ```
    -   Se o `package.json` já existir, apenas instale:
    ```bash
    npm install
    ```

3.  **Crie o Arquivo de Configuração do TypeScript (se não existir):**
    ```bash
    npx tsc --init
    ```

4.  **Configure as Variáveis de Ambiente:**
    -   Crie um arquivo chamado `.env` dentro da pasta `backend`.
    -   Copie o conteúdo abaixo e substitua pelas suas credenciais do Supabase e outras chaves.

    ```dotenv
    # Porta para o servidor backend rodar
    PORT=3001

    # Credenciais do Supabase
    SUPABASE_URL=URL_DO_SEU_PROJETO_SUPABASE
    SUPABASE_KEY=SUA_CHAVE_SERVICE_ROLE_DO_SUPABASE

    # String de Conexão Direta com o Banco (para o script de inicialização)
    DATABASE_URL="postgres://postgres.SEU_PROJETO:SUA_SENHA_DO_BANCO@aws-0-REGION.pooler.supabase.com:5432/postgres"

    # Chave da API da Google (se aplicável)
    API_KEY=SUA_CHAVE_DA_GEMINI_API
    ```
    > **Como obter as credenciais:**
    > - `SUPABASE_URL` e `SUPABASE_KEY` (usar a chave `service_role`): Vá para `Project Settings > API` no seu painel do Supabase.
    > - `DATABASE_URL`: Vá para `Project Settings > Database > Connection string > URI`. Copie a string e substitua a senha `[YOUR-PASSWORD]`.

5.  **Execute o Servidor Backend:**
    -   O script de inicialização criará as tabelas no banco de dados automaticamente na primeira execução.
    -   Execute o comando abaixo. **Sim, este comando precisa ser executado toda vez que você iniciar o desenvolvimento.** Ele inicia o servidor, que ficará rodando neste terminal para responder às solicitações do frontend.
        ```bash
        npx ts-node backend.ts
        ```
    -   Você deverá ver a mensagem: `Backend server running on http://localhost:3001`. Mantenha este terminal aberto.

### 4.2. Frontend: Configuração e Execução (Vite)

1.  **Abra um novo terminal** (mantenha o do backend rodando). Navegue até a **pasta raiz** do projeto (a que contém o `package.json` principal, não a pasta `backend`).

2.  **Instale as dependências do frontend** (só precisa fazer isso uma vez ou quando houver novas dependências no `package.json`):
    ```bash
    npm install
    ```

3.  **Inicie o servidor de desenvolvimento do frontend**:
    ```bash
    npm run dev
    ```

4.  O terminal mostrará uma URL local (geralmente `http://localhost:5173/` ou similar). Abra essa URL no seu navegador para ver e interagir com a aplicação.

5.  O frontend se conectará automaticamente ao backend que está rodando em `http://localhost:3001`.

### 4.3. Controle de Versão com Git e GitHub

Para salvar seu progresso e colaborar, é essencial usar o Git.

1.  **Inicialize o Git no seu Projeto (se for a primeira vez):**
    -   Abra o terminal na pasta raiz do seu projeto (a que contém o `index.html` e a pasta `backend`).
    -   Execute o comando:
        ```bash
        git init
        ```

2.  **Crie um `.gitignore`:**
    -   Na mesma pasta raiz, crie um arquivo chamado `.gitignore`. Este arquivo diz ao Git quais pastas e arquivos ignorar.
    -   É **crucial** que ele contenha o seguinte para não enviar suas chaves secretas (`.env`) e dependências (`node_modules`) para o repositório:

        ```gitignore
        # Dependências do Node.js
        /backend/node_modules
        node_modules/

        # Arquivos de ambiente com segredos
        .env
        /backend/.env

        # Logs e arquivos de build
        npm-debug.log
        /dist
        ```

3.  **Adicione e "Commite" seus Arquivos:**
    -   No terminal, adicione todos os arquivos do seu projeto ao controle do Git:
        ```bash
        git add .
        ```
    -   Agora, crie um "commit", que é um registro das suas alterações:
        ```bash
        git commit -m "feat: Commit inicial do projeto"
        ```

4.  **Conectando e Enviando para o GitHub (Primeira Vez)**
    Existem duas maneiras de criar e conectar seu repositório no GitHub. O método com a CLI é mais rápido e moderno.

    #### Método 1: Manual (via site do GitHub)
    -   Vá até o site do [GitHub](https://github.com) e crie um novo repositório (sem inicializá-lo com arquivos).
    -   Copie a URL do seu repositório.
    -   No seu terminal, execute os comandos que o próprio GitHub sugere:
        ```bash
        # Conecta seu repositório local ao remoto
        git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git

        # Renomeia a branch principal para "main" (boa prática)
        git branch -M main

        # Envia seus arquivos para o GitHub
        git push -u origin main
        ```

    #### Método 2: GitHub CLI (Recomendado)
    A ferramenta de linha de comando oficial do GitHub (`gh`) simplifica muito este processo.

    1.  **Instale o GitHub CLI:** Se ainda não tiver, instale-o. No Windows, via PowerShell:
        ```powershell
        winget install --id GitHub.cli
        ```
        (Para outros sistemas, consulte a documentação oficial).

    2.  **Verifique a Autenticação:** Antes de tentar fazer login, verifique se você já está conectado à sua conta do GitHub:
        ```bash
        gh auth status
        ```
        -   Se o comando mostrar que você **já está logado** na conta correta, você pode pular o próximo passo e ir direto para a criação do repositório.
        -   Se o comando retornar um erro ou indicar que você **não está logado**, prossiga para o passo de autenticação.

    3.  **Autentique-se (se necessário):** Conecte a CLI à sua conta do GitHub.
        ```bash
        gh auth login
        ```
        Siga as instruções que aparecerão no terminal. O método mais simples é escolher "HTTPS" como protocolo e "Login with a web browser" para autenticar no navegador.

    4.  **Crie e envie o repositório:** Na pasta raiz do seu projeto, execute:
        ```bash
        gh repo create
        ```
        O assistente interativo irá guiá-lo. Ele criará o repositório no GitHub, adicionará o `remote` e fará o `push` dos seus commits iniciais automaticamente.

5.  **Envie Atualizações Futuras:**
    -   Após fazer novas alterações e "commitar" (passo 3), envie-as para o GitHub com:
        ```bash
        git push
        ```

    #### 4.3.1. Resolvendo Erros Comuns: "non-fast-forward"

    Se ao tentar dar `git push` você receber um erro como `! [rejected] main -> main (non-fast-forward)`, isso significa que o repositório remoto no GitHub tem commits (alterações) que você ainda não tem no seu computador. O Git está te protegendo para que você não sobrescreva o trabalho de outra pessoa (ou seu próprio trabalho de outra máquina).

    **Como resolver:**

    1.  **Puxe as alterações remotas:** Antes de enviar as suas, você precisa baixar e mesclar as alterações do GitHub.
        ```bash
        git pull origin main
        ```

    2.  **Resolva Conflitos (se houver):**
        -   Se o Git não conseguir mesclar as alterações automaticamente, ele irá pausar e te informar quais arquivos têm conflitos.
        -   Abra esses arquivos no seu editor (o VS Code mostra as áreas de conflito claramente).
        -   Edite os arquivos para manter as alterações que você quer, removendo as marcações de conflito (`<<<<<<<`, `=======`, `>>>>>>>`).
        -   Após resolver, salve os arquivos e adicione-os ao Git: `git add .`
        -   Crie um novo commit para a mesclagem: `git commit -m "Merge: Incorpora alterações remotas"`

    3.  **Envie novamente:** Agora que seu histórico local contém as alterações remotas, você pode enviar as suas.
        ```bash
        git push
        ```

    #### 4.3.2. Resolvendo Erros Comuns: "No remote for the current branch"

    Se ao tentar dar `git pull` ou `git push` você receber um erro como `fatal: No remote for the current branch.`, isso significa que seu branch local (ex: `main`) não sabe qual branch no GitHub ele deve acompanhar (rastrear).

    **Como resolver:**

    1.  **Defina o branch de rastreamento (upstream):** Execute o comando `push` com o sinalizador `-u` ou `--set-upstream`. Isso só precisa ser feito uma vez por branch.
        ```bash
        git push -u origin main
        ```
    2.  Após isso, os comandos `git push` e `git pull` funcionarão sem argumentos adicionais.

---
   #### 4.3.3. Resolvendo Erros Comuns: "refusing to merge unrelated histories"

   Este erro pode acontecer na primeira vez que você tenta dar `git pull` de um repositório que já foi inicializado no GitHub (por exemplo, com um arquivo `README.md`).

   -   **Erro:** `fatal: refusing to merge unrelated histories`
   -   **Causa:** Seu histórico de commits local e o histórico do repositório remoto não têm um ponto em comum. Eles começaram como dois projetos separados.
   -   **Solução:** Você precisa permitir que o Git mescle essas duas linhas do tempo.

       1.  **Execute o pull com a flag `--allow-unrelated-histories`:**
           ```bash
           git pull origin main --allow-unrelated-histories
           ```
       2.  **Resolva Conflitos (se houver):** Se houver arquivos com o mesmo nome nos dois lugares (como um `.gitignore`), o Git pode pedir para você resolver os conflitos manualmente, como descrito na seção "non-fast-forward".
       3.  **Envie suas alterações:** Após a mesclagem, você pode enviar seu trabalho.
           ```bash
           git push origin main
           ```

---

## 5. Deploy (Hospedagem Pública) na Render

Para que sua aplicação esteja acessível publicamente na internet, vamos hospedá-la na Render. O processo é dividido em duas partes: o deploy do **Backend** e o do **Frontend**.

**Pré-requisitos:**
-   Seu código precisa estar em um repositório no GitHub.
-   Você precisa de uma conta gratuita na Render.

### 5.1. Preparação: Variáveis de Ambiente no Frontend

Antes de fazer o deploy, precisamos garantir que o frontend saiba como encontrar a API do backend quando não estiver rodando localmente (`localhost`).

1.  **Use Variáveis de Ambiente no Frontend:**
    No seu código do frontend (provavelmente em `index.tsx` ou em um arquivo de serviço de API), substitua a URL `http://localhost:3001` por uma variável de ambiente do Vite.

    *Exemplo de como fazer a mudança:*

    ```typescript
    // Antes:
    const apiUrl = 'http://localhost:3001';

    // Depois:
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    // E em suas chamadas fetch:
    fetch(`${apiUrl}/api/clients`);
    ```

2.  **Crie um arquivo `.env` local (se não existir):**
    Na **raiz do projeto** (não na pasta `backend`), crie um arquivo chamado `.env` e adicione a linha abaixo para o desenvolvimento local funcionar como antes:
    ```
    VITE_API_URL=http://localhost:3001
    ```
    > **Importante**: O arquivo `.gitignore` já está configurado para ignorar arquivos `.env`, o que é a prática correta.

3.  **Faça o commit e push das alterações:**
    Salve as alterações no seu código e envie para o GitHub.
    ```bash
    git add .
    git commit -m "feat: Prepara frontend para deploy com variáveis de ambiente"
    git push
    ```

### 5.2. Deploy do Backend (API) como "Web Service"

1.  **Acesse a Render:** Vá para o seu Dashboard.
2.  **Novo Web Service:** Clique em **New +** e selecione **Web Service**.
3.  **Conecte seu Repositório:** Conecte sua conta do GitHub e selecione o repositório do projeto.
4.  **Configure o Serviço:**
    -   **Name:** Dê um nome único para sua API (ex: `cadastro-clientes-api`).
    -   **Region:** Escolha uma região (ex: `Oregon (US West)`).
    -   **Branch:** `main`.
    -   **Root Directory:** `backend` (Isso é **muito importante** para a Render encontrar os arquivos corretos).
    -   **Runtime:** `Node`.
    -   **Build Command:** `npm install`
    -   **Start Command:** `npx ts-node backend.ts`
    -   **Instance Type:** `Free`.
5.  **Adicione as Variáveis de Ambiente:**
    -   Clique em **Advanced**.
    -   Em "Environment Variables", clique em **Add Environment Variable** para cada uma das suas chaves do arquivo `backend/.env`. **Não** use aspas nos valores.
        -   `SUPABASE_URL`: (cole o valor)
        -   `SUPABASE_KEY`: (cole o valor da sua chave `service_role`)
        -   `DATABASE_URL`: (cole a string de conexão completa)
        -   `API_KEY`: (cole sua chave da Gemini, se estiver usando)
6.  **Crie o Serviço:** Clique em **Create Web Service**.

Aguarde o build e o deploy. Quando estiver pronto, a Render fornecerá uma URL pública para sua API (ex: `https://cadastro-clientes-api.onrender.com`). **Copie essa URL**, você precisará dela para o frontend.

### 5.3. Deploy do Frontend como "Static Site"

1.  **Acesse a Render:** Volte para o Dashboard.
2.  **Novo Static Site:** Clique em **New +** e selecione **Static Site**.
3.  **Conecte o mesmo Repositório:** Selecione o mesmo repositório do GitHub.
4.  **Configure o Site:**
    -   **Name:** Dê um nome único para sua aplicação (ex: `app-cadastro-clientes`).
    -   **Branch:** `main`.
    -   **Root Directory:** (Deixe em branco, pois o `package.json` está na raiz).
    -   **Build Command:** `npm run build`
    -   **Publish Directory:** `dist` (Este é o diretório de saída do Vite).
5.  **Adicione a Variável de Ambiente (para o build):**
    -   Clique em **Advanced**.
    -   Em "Environment Variables", clique em **Add Environment Variable**.
        -   **Key:** `VITE_API_URL`
        -   **Value:** Cole a URL do seu backend que você copiou no passo anterior (ex: `https://cadastro-clientes-api.onrender.com`).
6.  **Crie o Site:** Clique em **Create Static Site**.

Aguarde o build e o deploy. Em poucos minutos, sua aplicação estará no ar em uma URL pública fornecida pela Render!

---

## 6. Próximos Passos e Melhorias Futuras

Com a base da aplicação funcional e hospedada, os próximos passos se concentram em aumentar a robustez, segurança e manutenibilidade do código.

-   **Modularização do Backend**:
    -   **O quê**: Refatorar o arquivo monolítico `backend.ts` para uma estrutura mais organizada, separando a lógica em `routes`, `controllers` e `services`, conforme o padrão descrito em `estrutura.md`.
    -   **Por quê**: Melhora a organização, facilita a manutenção e permite que a equipe trabalhe em diferentes partes da API simultaneamente sem conflitos.

-   **Validação de Dados Robusta (Server-Side)**:
    -   **O quê**: Implementar uma biblioteca de validação de schemas, como o [Zod](https://zod.dev/), para validar os dados de entrada (`req.body`) em todas as rotas de `POST` e `PUT`.
    -   **Por quê**: Garante que apenas dados válidos e no formato correto cheguem ao banco de dados, prevenindo erros e aumentando a segurança.

-   **Implementação de Testes Automatizados**:
    -   **O quê**: Adicionar testes unitários e de integração para o backend usando um framework como Vitest ou Jest.
    -   **Por quê**: Garante que novas alterações não quebrem funcionalidades existentes e aumenta a confiança no código.

-   **Autenticação e Autorização de Usuários**:
    -   **O quê**: Adicionar uma camada de autenticação (ex: com JWT - JSON Web Tokens) para proteger as rotas da API, garantindo que apenas usuários autenticados possam criar, editar ou excluir dados.
    -   **Por quê**: É um requisito fundamental de segurança para qualquer aplicação que lida com dados de múltiplos usuários.

-   **Melhorias de UI/UX (User Interface/User Experience)**:
    -   **O quê**: Refinar a interface do frontend com indicadores de carregamento (spinners) para ações individuais, feedback de erro mais claro para o usuário e otimizações de responsividade.
    -   **Por quê**: Melhora a percepção de performance e a usabilidade geral da aplicação.