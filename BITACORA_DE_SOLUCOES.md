# Bitácora de Soluções para Problemas Complexos

Este documento serve como um registro de problemas desafiadores encontrados durante o desenvolvimento e as soluções aplicadas. O objetivo é criar uma base de conhecimento para acelerar a resolução de problemas semelhantes no futuro.

---

## Estrutura de um Novo Registro

Ao adicionar um novo problema, siga esta estrutura:

-   **`ID do Problema`**: Um identificador único (ex: `PROBLEMA-001`).
-   **`Data`**: Data em que o problema foi identificado.
-   **`Título`**: Uma descrição curta e clara do problema.
-   **`Descrição do Problema`**: Detalhes sobre o comportamento observado e o impacto na aplicação.
-   **`Histórico de Tentativas`**: Uma lista das soluções tentadas que não funcionaram e por quê.
-   **`Análise da Causa Raiz`**: Uma investigação detalhada sobre o motivo real do problema.
-   **`Solução Aplicada`**: A solução final que resolveu o problema de forma eficaz.
-   **`Lições Aprendidas`**: Pontos-chave e insights obtidos que podem ser úteis no futuro.

---

## Registro de Problemas

### ID do Problema: `PROBLEMA-001`

-   **Data**: 01/08/2024
-   **Título**: Falha na persistência da exclusão de itens em ambiente de desenvolvimento.

-   **Descrição do Problema**:
    A ação de excluir um cliente parecia funcionar na UI (o item sumia da lista), mas o cliente reaparecia após um recarregamento da página ou uma atualização do Hot Module Replacement (HMR). O usuário reportou que "o botão excluir não está funcionando".

-   **Histórico de Tentativas**:
    1.  **Correção de Estado no React**: A primeira suspeita foi que o estado do React não estava sendo atualizado corretamente. A função de exclusão foi ajustada para garantir a remoção do item da lista local com `setClients(current => current.filter(...))`.
    2.  **Resultado**: O problema persistiu, sugerindo que a fonte dos dados (o `dataService`) estava sendo reinicializada para o seu estado original a cada atualização.

-   **Análise da Causa Raiz**:
    O `dataService` foi implementado como um objeto que armazenava os dados em um array em memória. Em ambientes de desenvolvimento modernos (como Vite ou Create React App), o Hot Module Replacement (HMR) pode recriar módulos quando o código é alterado. Isso fazia com que toda a instância do `dataService`, incluindo seu array de clientes, fosse descartada e recriada do zero, perdendo todas as alterações feitas em tempo de execução (como adições ou exclusões). A exclusão funcionava temporariamente, mas qualquer atualização do código-fonte restaurava o estado inicial dos dados.

-   **Solução Aplicada**:
    O `dataService` foi refatorado para utilizar a API de `localStorage` do navegador para persistir os dados.
    -   **`getClients()`**: Modificado para ler os dados de `localStorage.getItem(KEY)`.
    -   **`_saveData()`**: Implementado para escrever os dados em `localStorage.setItem(KEY, JSON.stringify(data))`.
    -   **Ações de CRUD (add, update, delete)**: Atualizadas para chamar `_saveData()` após qualquer modificação, garantindo a persistência entre recarregamentos.

-   **Lições Aprendidas**:
    -   Dados em memória são voláteis em ambientes de desenvolvimento com HMR/Fast Refresh.
    -   Para simular persistência de dados no frontend sem um backend real, `localStorage` ou `sessionStorage` são alternativas robustas e confiáveis.
    -   Problemas que parecem ser de "estado da UI" podem, na verdade, ter origem na camada de serviço de dados. Sempre verifique a fonte da verdade dos dados, especialmente em ambientes de desenvolvimento dinâmicos.