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

Para salvar seu progresso e colaborar, é essencial usar o Git. Esta seção está dividida em dois cenários principais:

-   **Cenário A:** Você está configurando o projeto pela primeira vez e precisa enviá-lo para um novo repositório no GitHub.
-   **Cenário B:** O projeto já existe no GitHub e você só precisa enviar suas atualizações.

---

#### **Cenário A: Configuração Inicial e Primeiro Envio para o GitHub**

Siga estes passos se você ainda **não** tem um repositório para este projeto no GitHub.

**1. Preparação Local (Primeiro Commit)**

Se você ainda não inicializou o Git no seu projeto, faça isso agora.

-   **Inicialize o Git:** Na pasta raiz do projeto, execute:
    ```bash
    git init
    ```

-   **Crie o `.gitignore`:** Na mesma pasta, crie um arquivo chamado `.gitignore`. É **crucial** que ele contenha o seguinte para não enviar suas chaves secretas (`.env`) e dependências (`node_modules`):
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

-   **Adicione e "Commite" seus Arquivos:**
    ```bash
    git add .
    git commit -m "feat: Commit inicial do projeto"
    ```

**2. Criando e Enviando para o Repositório no GitHub**

Agora, vamos criar o repositório no GitHub e enviar seu código. O método com a CLI (linha de comando) é o mais recomendado.

##### **Método Recomendado: Usando a GitHub CLI (`gh`)**

A ferramenta de linha de comando oficial do GitHub (`gh`) automatiza e simplifica o processo.

-   **Passo 1: Verifique sua Autenticação**
    Primeiro, verifique se você já está conectado à sua conta do GitHub:
    ```bash
    gh auth status
    ```
    -   Se o comando mostrar que você **já está logado**, pule para o Passo 3.
    -   Se retornar um erro ou indicar que você não está logado, vá para o Passo 2.

-   **Passo 2: Autentique-se (se necessário)**
    Conecte a CLI à sua conta do GitHub. Você só precisa fazer isso uma vez por máquina.
    ```bash
    gh auth login
    ```
    Siga as instruções, escolhendo "HTTPS" e "Login with a web browser".

-   **Passo 3: Crie o Repositório e Envie o Código**
    Este comando vai criar o repositório no GitHub, conectar seu projeto local a ele e enviar seus commits.
    ```bash
    gh repo create
    ```
    O assistente interativo irá guiá-lo. Responda às perguntas para configurar o nome e a visibilidade do repositório. Ao final, seu código estará no GitHub.

##### **Método Alternativo: Manual (via site do GitHub)**

Se preferir não usar a CLI do GitHub:

1.  Vá até o site do GitHub e crie um novo repositório (sem inicializá-lo com arquivos `README` ou `.gitignore`).
2.  Copie a URL do seu repositório (ex: `https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git`).
3.  No seu terminal, execute os seguintes comandos:
    ```bash
    # Conecta seu repositório local ao remoto
    git remote add origin URL_DO_SEU_REPOSITORIO

    # Renomeia a branch principal para "main" (boa prática)
    git branch -M main

    # Envia seus arquivos para o GitHub e configura o rastreamento
    git push -u origin main
    ```

---

#### 4.3.2. O Fluxo de Trabalho Padrão para Evitar Conflitos (Pull, Commit, Push)

O "erro" de `rejected` (rejeitado) ao tentar fazer um `git push` não é um bug, mas uma medida de segurança do Git. Ele ocorre quando o repositório remoto (GitHub) tem commits que seu repositório local não possui.

Para evitar isso e manter seu trabalho sincronizado, adote o seguinte fluxo como prática padrão:

1.  **Sincronize ANTES de enviar (`pull`):** Antes de enviar suas alterações, sempre puxe as atualizações mais recentes do servidor. Isso garante que você está trabalhando na versão mais atual do código.
    ```bash
    git pull
    ```

2.  **Adicione e "Commite" suas alterações (`add` e `commit`):** Após fazer suas modificações, salve-as em um commit local.
    ```bash
    git add .
    git commit -m "feat: Descrição da sua alteração"
    ```

3.  **Envie seu trabalho (`push`):** Agora que seu repositório local está atualizado com as mudanças remotas e também contém suas novas alterações, você pode enviá-lo com segurança.
    ```bash
    git push
    ```

#### **Cenário B: Enviando Atualizações para um Repositório Existente**

Se o projeto já está no GitHub, o fluxo de trabalho diário é mais simples:

**1. Faça suas alterações no código.**

**2. Adicione e "Commite" as alterações:**
   - Adicione todos os arquivos modificados:
     ```bash
     git add .
     ```
   - Crie um "commit" com uma mensagem descritiva:
     ```bash
     git commit -m "feat: Adiciona funcionalidade de busca de clientes"
     ```

**3. Envie as alterações para o GitHub:**
   ```bash
   git push
   ```

---

#### 4.3.1. Resolvendo Problemas Comuns de Sincronização

Ao trabalhar em equipe ou em diferentes computadores, você pode encontrar erros ao tentar usar `git push` ou `git pull`.

##### **Erro: "non-fast-forward"**

-   **O que significa:** O repositório remoto no GitHub tem alterações que você ainda não tem localmente. O Git impede o `push` para não sobrescrever o trabalho de outros.
-   **Solução:**
    1.  **Puxe as alterações remotas:**
        ```bash
        git pull
        ```
    2.  **Resolva Conflitos (se houver):** Se você e o repositório remoto alteraram a mesma parte do mesmo arquivo, o Git pausará a mesclagem e entrará em um estado de conflito.
        -   Execute `git status` para ver quais arquivos estão em "Unmerged paths".
        -   Abra esses arquivos no VS Code. Você verá os conflitos marcados com `<<<<<<< HEAD`, `=======`, e `>>>>>>>`.
        -   O VS Code fornecerá botões para "Accept Current Change" (suas alterações), "Accept Incoming Change" (alterações remotas) ou "Accept Both Changes".
        -   Escolha a opção correta ou edite o código manualmente para combinar as duas versões.
        -   Após resolver e salvar cada arquivo, adicione-os ao Git:
            ```bash
            git add .
            ```
        -   Finalize a mesclagem com um commit. O Git geralmente sugere uma mensagem padrão, que você pode aceitar:
            ```bash
            git commit
            ```

    3.  **Envie novamente:** Agora que seu repositório está sincronizado, o push funcionará.
        ```bash
       git status
        ```
    > **Dica:** Se a mesclagem parecer muito complicada, você pode cancelá-la com segurança a qualquer momento (antes do `git commit`) usando o comando: `git merge --abort`.

##### **Erro: "refusing to merge unrelated histories"**

-   **O que significa:** Acontece na primeira vez que você tenta dar `git pull` de um repositório que já tinha um commit inicial (ex: um `README.md` criado pelo GitHub). Seus commits locais e os remotos não têm um histórico em comum.
-   **Solução:**
    ```bash
    git pull origin main --allow-unrelated-histories
    ```
    Após isso, resolva possíveis conflitos e envie suas alterações com `git push`.

##### **Erro: "No remote for the current branch" ou "fatal: ... does not appear to be a git repository"**

-   **O que significa:** Seu branch local (ex: `main`) não sabe para qual branch no GitHub ele deve enviar as alterações (não há um "upstream" configurado).
-   **Solução:**
    -   **Para configurar o rastreamento (faça isso uma vez por branch):**
        ```bash
        git push -u origin main
        ```
    -   **Se o `remote` não existir (verifique com `git remote -v`):**
        ```bash
        git remote add origin URL_DO_SEU_REPOSITORIO_NO_GITHUB
        ```

    > **Dica Pro: Configurando o Rastreamento Automático**
    >
    > Para evitar ter que digitar `-u` toda vez que você envia um novo branch pela primeira vez, você pode configurar o Git para fazer isso automaticamente. O Git até sugere isso com a mensagem: `To have this happen automatically... see 'push.autoSetupRemote'`.
    >
    > Execute este comando uma única vez para configurar isso globalmente em sua máquina:
    > ```bash
    > git config --global push.autoSetupRemote true
    > ```
    > Depois disso, para qualquer novo branch, um simples `git push` na primeira vez será suficiente para criar o branch remoto e configurar o rastreamento.

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
    -   **Start Command:** `npm start`
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
    -   **Build Command:** `npm install && npm run build`
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