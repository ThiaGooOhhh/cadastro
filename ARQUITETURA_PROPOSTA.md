# Visão Geral da Arquitetura Proposta

O objetivo é transformar a aplicação atual (que roda inteiramente no navegador) em uma arquitetura Full-Stack, separando as responsabilidades:

1.  **Frontend (React)**: Continuará sendo a interface com o usuário, responsável pela apresentação visual. No entanto, ele deixará de gerenciar os dados diretamente. Será hospedado no **Render** como um **Static Site**.

2.  **Backend (Node.js/Express)**: Será um novo servidor responsável por toda a lógica de negócio: receber requisições do frontend, se comunicar com o banco de dados e interagir com APIs externas (como a Gemini API). Será hospedado no **Render** como um **Web Service**.

3.  **Banco de Dados (Supabase)**: Substituirá o `localStorage` para armazenar os dados de clientes e visitas de forma persistente, segura e escalável.
