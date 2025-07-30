# Projeto de Cadastro de Clientes

Este é um projeto full-stack de um sistema de cadastro de clientes, com um frontend em React e um backend em Node.js/Express, utilizando Supabase como banco de dados.

## Como Executar o Projeto

Para executar a aplicação completa, você precisa rodar o Backend e o Frontend em terminais separados.

### 1. Backend (Servidor da API)

1.  Navegue até a pasta do backend: `cd backend`
2.  Instale as dependências: `npm install`
3.  Configure suas credenciais no arquivo `.env` (siga o exemplo em `GUIA_DO_PROJETO.md`).
4.  Inicie o servidor: `npx ts-node backend.ts`

O servidor estará rodando em `http://localhost:3001`.

### 2. Frontend (Interface do Usuário)

1.  Em um **novo terminal**, na pasta raiz do projeto, instale as dependências: `npm install`
2.  Inicie o servidor de desenvolvimento: `npm run dev`

Abra a URL fornecida pelo Vite (geralmente `http://localhost:5173`) no seu navegador.

---

Para mais detalhes sobre a arquitetura, deploy e resolução de problemas, consulte o `GUIA_DO_PROJETO.md`.
