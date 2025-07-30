# Estrutura do Projeto Full-Stack (React + Node.js)

Este documento descreve a organização de diretórios e arquivos para um projeto full-stack, utilizando React para o frontend, Node.js com Express para o backend, e uma base de dados para a persistência de dados.

O objetivo é manter uma base de código limpa, modular e escalável, facilitando o desenvolvimento e a implantação em plataformas como a Render.

> **Nota de Implementação:** A aplicação atual implementa a lógica de frontend e um serviço de backend simulado (em memória) dentro do arquivo `index.tsx` para se adequar ao ambiente de desenvolvimento. A estrutura de arquivos descrita abaixo representa a **melhor prática** para um projeto de produção real, onde o frontend e o backend são separados.

## Arquitetura Geral

O projeto é organizado como um monorepo com duas pastas principais na raiz: `frontend` e `backend`.

`
/
├── frontend/                   # Aplicação React (Cliente)
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── .env.development
│   ├── .env.production
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                    # Aplicação Node.js (Servidor)
│   ├── src/
│   │   ├── config/             # Configurações (DB, CORS, etc.)
│   │   ├── controllers/        # Lógica de requisição/resposta
│   │   ├── models/             # Esquemas do banco de dados
│   │   ├── routes/             # Definição das rotas da API
│   │   ├── services/           # Lógica de negócio
│   │   └── server.ts           # Ponto de entrada do servidor Express
│   ├── .env
│   ├── package.json
│   └── tsconfig.json
│
├── .gitignore
└── README.md
`

---

## Backend (`./backend`)

A estrutura do backend é organizada para separar responsabilidades.

-   **`src/models/Client.ts`**: Define o modelo de dados para um cliente usando Sequelize.

    ```typescript
    // Exemplo em src/models/Client.ts
    import { Model, DataTypes } from 'sequelize';
    import { sequelize } from '../config/database';

    class Client extends Model {
      public id!: number;
      public name!: string;
      public phone!: string;
    }

    Client.init({
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: new DataTypes.STRING(128),
        allowNull: false,
      },
      phone: {
        type: new DataTypes.STRING(20),
        allowNull: false,
      },
    }, {
      tableName: 'clients',
      sequelize, // Instância da conexão
    });

    export default Client;
    ```

-   **`src/controllers/clientController.ts`**: Contém a lógica para manipular as requisições HTTP (CRUD).

    ```typescript
    // Exemplo em src/controllers/clientController.ts
    import { Request, Response } from 'express';
    import Client from '../models/Client';

    // GET /api/clients
    export const getAllClients = async (req: Request, res: Response) => { /* ... */ };
    // POST /api/clients
    export const createClient = async (req: Request, res: Response) => { /* ... */ };
    // PUT /api/clients/:id
    export const updateClient = async (req: Request, res: Response) => { /* ... */ };
    // DELETE /api/clients/:id
    export const deleteClient = async (req: Request, res: Response) => { /* ... */ };
    ```
-   **`src/routes/clientRoutes.ts`**: Define as rotas da API para os clientes.
    ```typescript
    // Exemplo em src/routes/clientRoutes.ts
    import { Router } from 'express';
    import * as clientController from '../controllers/clientController';

    const router = Router();
    router.get('/', clientController.getAllClients);
    router.post('/', clientController.createClient);
    router.put('/:id', clientController.updateClient);
    router.delete('/:id', clientController.deleteClient);

    export default router;
    ```
-   **`src/server.ts`**: Ponto de entrada que inicializa o servidor e conecta as rotas.
    ```typescript
    // ...
    import clientRoutes from './routes/clientRoutes';
    // ...
    app.use('/api/clients', clientRoutes);
    // ...
    ```
---

## Frontend (`./frontend`)

A estrutura do frontend segue as melhores práticas para aplicações React.

-   **`src/services/api.ts`**: Centraliza a configuração do cliente HTTP (ex: Axios) para se comunicar com o backend. Ele lê a URL base da API a partir das variáveis de ambiente.

    ```typescript
    // Exemplo em src/services/api.ts
    import axios from 'axios';

    const api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
    });

    export default api;
    ```
-   **`src/types/client.ts`**: Define a tipagem para o objeto cliente.
    ```typescript
    // Exemplo em src/types/client.ts
    export interface Client {
      id: number;
      name: string;
      phone: string;
    }
    ```
-   **`.env.development`**: Arquivo para variáveis de ambiente locais.
    `REACT_APP_API_URL=http://localhost:3001/api`

-   **`.env.production`**: Arquivo para variáveis de ambiente de produção.
    `REACT_APP_API_URL=https://sua-api.onrender.com/api`

Essa estrutura fornece uma base sólida para o desenvolvimento, teste e implantação eficientes do seu projeto full-stack.
