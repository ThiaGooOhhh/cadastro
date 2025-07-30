# Instruções para Execução da Arquitetura Full-Stack

A aplicação foi refatorada para uma arquitetura de duas partes: um **Frontend** (a interface que você vê no navegador) e um **Backend** (um servidor que gerencia os dados e a lógica de negócio).

Para executar o projeto completo, você precisará rodar ambos os processos separadamente.

---

## 1. Configuração e Execução do Backend

O backend é responsável por se conectar ao banco de dados (Supabase) e à API da Gemini.

### Pré-requisitos:
- Node.js e npm instalados na sua máquina.
- Uma conta no [Supabase](https://supabase.com/) para criar o banco de dados.
- Uma chave de API para a [Gemini API](https://aistudio.google.com/app/apikey).

### Passos:

1.  **Crie a Estrutura de Pastas:**
    -   Crie uma nova pasta chamada `backend` na raiz do seu projeto.
    -   Mova o arquivo `backend.ts` para dentro desta nova pasta.

2.  **Inicialize o Projeto Backend:**
    -   Abra seu terminal e navegue até a pasta `backend` (`cd backend`).
    -   Execute os seguintes comandos para criar um `package.json` e instalar as dependências:
        ```bash
        npm init -y
        npm install express cors dotenv @supabase/supabase-js @google/genai pg
        npm install -D typescript ts-node @types/express @types/cors @types/node @types/pg
        ```

3.  **Crie o Arquivo de Configuração do TypeScript:**
    -   Ainda no terminal, dentro da pasta `backend`, execute o comando abaixo para criar o arquivo `tsconfig.json`:
        ```bash
        npx tsc --init
        ```
    -   Isso criará um arquivo `tsconfig.json` com configurações padrão, que são suficientes para iniciar.

4.  **Configure as Variáveis de Ambiente:**
    -   Dentro da pasta `backend`, crie um arquivo chamado `.env`.
    -   Adicione o seguinte conteúdo, substituindo pelos seus próprios valores:

        ```
        # Porta para o servidor backend rodar
        PORT=3001

        # Credenciais do Supabase
        SUPABASE_URL=URL_DO_SEU_PROJETO_SUPABASE
        SUPABASE_KEY=SUA_CHAVE_SERVICE_ROLE_DO_SUPABASE

        # String de Conexão Direta com o Banco (para o script de inicialização)
        DATABASE_URL="postgres://postgres.SEU_PROJETO:SUA_SENHA_DO_BANCO@aws-0-REGION.pooler.supabase.com:5432/postgres"

        # Chave da API da Google
        API_KEY=SUA_CHAVE_DA_GEMINI_API
        ```
    > **Como obter as credenciais:**
    > - `SUPABASE_URL` e `SUPABASE_KEY` (usar a chave `service_role`): Vá para `Project Settings > API`.
    > - `DATABASE_URL`: Vá para `Project Settings > Database > Connection string > URI`. Copie a string e substitua a senha `[YOUR-PASSWORD]`.
    > - **Atenção:** Nunca exponha estas chaves publicamente. O arquivo `.env` deve ser incluído no seu `.gitignore`.

5.  **Criação do Banco de Dados (Automática):**
    -   Você **não precisa** criar as tabelas manualmente. O servidor backend foi programado para verificar e criar o schema do banco de dados automaticamente na primeira vez que for executado.

6.  **Execute o Servidor Backend:**
    -   Ainda no terminal, dentro da pasta `backend`, execute:
        ```bash
        npx ts-node backend.ts
        ```
    -   Você deverá ver mensagens indicando a verificação do banco de dados, seguida por `Backend server running on http://localhost:3001`. Mantenha este terminal aberto.

---

## 2. Execução do Frontend

O frontend se conectará automaticamente ao servidor backend que você acabou de iniciar.

-   Abra o arquivo `index.html` principal do projeto em seu navegador como de costume.
-   Se encontrar erros, verifique o console de desenvolvedor do navegador e o terminal onde o backend está rodando para obter pistas sobre o problema.

---

## 3. Controle de Versão com Git e GitHub

Para salvar seu progresso e colaborar com outras pessoas, é essencial usar um sistema de controle de versão como o Git.

### Passos:

1.  **Instale o Git:**
    -   Se ainda não tiver, baixe e instale o Git a partir do [site oficial](https://git-scm.com/downloads).

2.  **Crie um Repositório no GitHub:**
    -   Acesse sua conta no [GitHub](https://github.com/).
    -   Crie um **novo repositório** (pode ser privado ou público). **Não** inicialize com um `README.md` ou `.gitignore`.

3.  **Inicialize o Git no seu Projeto:**
    -   Abra o terminal na pasta raiz do seu projeto (a pasta que contém o `index.html` e a pasta `backend`).
    -   Execute o comando:
        ```bash
        git init
        ```

4.  **Crie um `.gitignore`:**
    -   Na mesma pasta raiz, crie um arquivo chamado `.gitignore`. Este arquivo diz ao Git quais pastas e arquivos ignorar.
    -   Adicione o seguinte conteúdo a ele. É **muito importante** para não enviar suas chaves secretas (`.env`) e dependências (`node_modules`) para o repositório.
        ```
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

5.  **Adicione e "Commite" seus Arquivos:**
    -   No terminal, adicione todos os arquivos do seu projeto ao controle do Git:
        ```bash
        git add .
        ```
    -   Agora, crie um "commit", que é um registro das suas alterações:
        ```bash
        git commit -m "Commit inicial do projeto de gestão de clientes"
        ```

6.  **Conecte e Envie para o GitHub:**
    -   Volte para a página do seu repositório no GitHub. Copie a URL do seu repositório.
    -   No terminal, conecte seu repositório local ao repositório remoto no GitHub. Use os comandos que o próprio GitHub sugere na página "…or push an existing repository from the command line":
        ```bash
        # Substitua a URL pela URL do seu repositório
        git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git

        # Renomeia a branch principal para "main" (boa prática)
        git branch -M main

        # Envia seus arquivos para o GitHub
        git push -u origin main
        ```

Pronto! Seu código agora está seguro e versionado no GitHub. Para futuras alterações, basta repetir os passos 5 (`git add .` e `git commit`) e `git push` para enviar.