# Análise de Desafios e Soluções do Projeto

Este documento resume os principais desafios técnicos encontrados durante o desenvolvimento e as soluções implementadas. O objetivo é servir como uma base de conhecimento para consultas futuras.

---

### Desafio 1: Volatilidade dos Dados em Ambiente de Desenvolvimento

-   **Problema:** As alterações de dados (como adicionar ou excluir um cliente) eram perdidas sempre que o código-fonte era salvo. A funcionalidade parecia não persistir os dados.
-   **Causa Raiz:** Os dados eram mantidos em um array em memória no frontend. O Hot Module Replacement (HMR) do ambiente de desenvolvimento (Vite/Create React App) reiniciava o módulo de serviço de dados a cada alteração, descartando o estado atual.
-   **Solução Intermediária:** Utilizar a API `localStorage` do navegador para persistir os dados localmente, garantindo que eles não fossem perdidos entre os recarregamentos da página. (Detalhado em `BITACORA_DE_SOLUCOES.md`).
-   **Solução Definitiva:** Migração para uma arquitetura com backend e banco de dados dedicado.

---

### Desafio 2: Separação de Responsabilidades (Frontend e Backend)

-   **Problema:** A lógica de dados e a de apresentação estavam fortemente acopladas no frontend, o que dificultava a manutenção, a segurança e a escalabilidade.
-   **Solução:** A aplicação foi refatorada para uma arquitetura Full-Stack.
    -   **Backend:** Foi criado um servidor em `backend/backend.ts` usando Node.js e Express para centralizar toda a lógica de negócio e o acesso aos dados.
    -   **Frontend:** A interface do usuário (React) foi simplificada para apenas consumir a API exposta pelo backend, sem gerenciar a persistência dos dados.
    -   **Referência:** A visão geral desta mudança está documentada em `ARQUITETURA_PROPOSTA.md`.

---

### Desafio 3: Persistência e Normalização de Dados

-   **Problema:** O `localStorage` é limitado e inseguro. Era necessária uma solução de banco de dados relacional para garantir a integridade e a relação entre clientes e visitas.
-   **Solução:**
    -   **Banco de Dados:** Foi adotado o Supabase (PostgreSQL) como banco de dados.
    -   **Schema Normalizado:** As tabelas `clients` e `visits` foram criadas com uma relação de chave estrangeira (`visits.client_id` -> `clients.id`), evitando a duplicação de dados (como o nome do cliente na tabela de visitas).
    -   **Inicialização Automática:** O arquivo `backend.ts` contém a função `initializeDatabase`, que cria e migra o schema do banco de dados automaticamente na primeira execução do servidor, facilitando a configuração em novos ambientes.
    -   **Código Relevante:**
        -   A função `initializeDatabase` em `backend.ts` demonstra a criação e migração do schema.
        -   A rota `GET /api/visits` usa um `JOIN` (`.select('*, client:clients(name)')`) para buscar dados relacionados de forma eficiente.

---

### Desafio 4: Gerenciamento de Configurações e Segredos

-   **Problema:** As credenciais do banco de dados e as chaves de API são informações sensíveis e não devem ser armazenadas diretamente no código-fonte (hard-coded).
-   **Solução:**
    -   **Pacote `dotenv`:** Foi adicionado ao backend para carregar variáveis de ambiente a partir de um arquivo.
    -   **Arquivo `.env`:** Um arquivo `.env` foi criado na pasta `backend` para armazenar todas as chaves e segredos.
    -   **`.gitignore`:** Foi configurado um arquivo `.gitignore` na raiz do projeto para garantir que a pasta `node_modules` e os arquivos `.env` não sejam enviados para o repositório Git, protegendo as informações sensíveis.
    -   **Código Relevante:**
        -   `import 'dotenv/config';` no topo de `backend.ts`.
        -   Uso de `process.env.VARIAVEL` para acessar as credenciais.

---

## Lição Principal

A transição de um protótipo baseado em navegador para uma aplicação full-stack robusta envolveu a superação de desafios relacionados à persistência de dados, arquitetura, normalização de banco de dados e segurança. As soluções adotadas criaram uma base de código mais limpa, segura e escalável.

