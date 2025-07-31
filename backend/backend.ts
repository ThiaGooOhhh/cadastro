/// <reference types="node" />

import dns from 'dns';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import 'dotenv/config';
import pg from 'pg';

// --- Forçar resolução de DNS para IPv4 ---
// Em algumas redes (incluindo ambientes de nuvem como a Render), a resolução de
// nomes de domínio (DNS) pode priorizar endereços IPv6 que não são corretamente
// roteáveis, causando o erro "ENETUNREACH" (Rede Inacessível). A linha abaixo
// instrui o Node.js a preferir endereços IPv4, resolvendo o problema de conexão.
dns.setDefaultResultOrder('ipv4first');

// --- Types ---
interface Address {
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
}

interface Client {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  cpf: string | null;
  address: Address | null;
}

interface Visit {
    id: number;
    client_id: number;
    date: string;
    subject: string;
    status: 'Agendada' | 'Concluída' | 'Cancelada';
}

// --- Configuração ---
const app: express.Application = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- Conexão e Variáveis de Ambiente ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const dbConnectionString = process.env.DATABASE_URL;

if (!supabaseUrl || !supabaseKey || !dbConnectionString) {
    console.error("ERRO: Variáveis de ambiente essenciais não foram definidas. Verifique seu arquivo .env");
    process.exit(1);
}

if (supabaseKey.split('.').length !== 3) {
    console.error("ERRO: A SUPABASE_KEY parece inválida. Ela deve ser um JWT com três partes separadas por pontos.");
    console.error("Por favor, copie a chave 'service_role' do seu painel Supabase novamente.");
    process.exit(1);
}

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

// --- Tratamento de Erros Genérico ---
const handleError = (res: Response, error: any, message = "Ocorreu um erro interno no servidor.") => {
  console.error(`--- ERRO NA OPERAÇÃO: ${message} ---`);
  console.error(error);
  // Extrai a mensagem de erro mais relevante, seja de um erro padrão ou de um erro do Supabase/Postgres
  const errorMessage = error.message || (error instanceof Error ? error.message : String(error));
  // Adiciona detalhes específicos do erro, se disponíveis
  const errorDetails = error.details || error.hint || errorMessage;

  res.status(500).json({ message, error: errorDetails });
};

// --- Sanitização de Dados ---
const sanitizeClientPayload = (payload: Partial<Omit<Client, 'id'>>) => {
    const sanitized = { ...payload };

    // Converte strings vazias para null para campos que podem ser nulos.
    // Isso garante que o banco de dados armazene 'NULL' em vez de uma string vazia.
    if (sanitized.phone === '') sanitized.phone = null;
    if (sanitized.email === '') sanitized.email = null;
    if (sanitized.cpf === '') sanitized.cpf = null;

    // Se o endereço for fornecido, mas todos os seus campos estiverem vazios, defina-o como nulo.
    if (sanitized.address && Object.values(sanitized.address).every(v => v === '')) {
        sanitized.address = null;
    }
    
    return sanitized;
};

// --- Rotas da API (Clientes, Visitas, IA) ---

// CLIENTES
app.get('/api/clients', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    handleError(res, error, "Falha ao buscar clientes.");
  }
});

type CreateClientPayload = Omit<Client, 'id'>;
app.post('/api/clients', async (req: Request<{}, any, CreateClientPayload>, res: Response) => {
  try {
    const sanitizedPayload = sanitizeClientPayload(req.body);
    const { data, error } = await supabase
      .from('clients')
      .insert([sanitizedPayload])
      .select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    handleError(res, error, "Falha ao criar cliente.");
  }
});

type UpdateClientPayload = Partial<Omit<Client, 'id'>>;
app.put('/api/clients/:id', async (req: Request<{ id: string }, any, UpdateClientPayload>, res: Response) => {
    try {
        const { id } = req.params;
        const sanitizedPayload = sanitizeClientPayload(req.body);
        const { data, error } = await supabase
          .from('clients')
          .update(sanitizedPayload)
          .eq('id', id).select();
        if (error) throw error;
        if (!data || data.length === 0) return res.status(404).json({ message: "Cliente não encontrado." });
        res.json(data[0]);
    } catch (error) {
        handleError(res, error, "Falha ao atualizar cliente.");
    }
});

app.delete('/api/clients/:id', async (req: Request<{ id: string }>, res: Response) => {
    try {
        const { id } = req.params;
        // A política ON DELETE CASCADE no banco de dados já garante que as visitas
        // associadas a este cliente serão excluídas automaticamente.
        const { error } = await supabase.from('clients').delete().eq('id', id);
        if (error) throw error;
        res.status(204).send();
    } catch (error) {
        handleError(res, error, "Falha ao excluir cliente.");
    }
});

// VISITAS
app.get('/api/visits', async (req: Request, res: Response) => {
    try {
      // Fazendo JOIN para buscar o nome do cliente em vez de armazená-lo redundantemente.
      const { data, error } = await supabase
        .from('visits')
        .select('*, client:clients(name)')
        .order('date', { ascending: false });

      if (error) throw error;

      // Mapeia os dados para manter a compatibilidade com o frontend, adicionando clientName.
      const responseData = data.map(visit => {
        const { client, ...rest } = visit;
        return { ...rest, clientName: client?.name || 'Cliente não encontrado' };
      });

      res.json(responseData);
    } catch (error) {
      handleError(res, error, "Falha ao buscar visitas.");
    }
});

// O clientName não é mais necessário no payload, será obtido via JOIN no GET.
type CreateVisitPayload = Omit<Visit, 'id'>;
app.post('/api/visits', async (req: Request<{}, any, CreateVisitPayload>, res: Response) => {
    try {
      const { data, error } = await supabase.from('visits').insert([req.body]).select();
      if (error) throw error;
      res.status(201).json(data[0]);
    } catch (error) {
      handleError(res, error, "Falha ao criar visita.");
    }
});

// O clientName não é mais necessário no payload.
type UpdateVisitPayload = Partial<Omit<Visit, 'id'>>;
app.put('/api/visits/:id', async (req: Request<{ id: string }, any, UpdateVisitPayload>, res: Response) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase.from('visits').update(req.body).eq('id', id).select();
        if (error) throw error;
        if (!data || data.length === 0) return res.status(404).json({ message: "Visita não encontrada." });
        res.json(data[0]);
    } catch (error) {
        handleError(res, error, "Falha ao atualizar visita.");
    }
});

app.delete('/api/visits/:id', async (req: Request<{ id: string }>, res: Response) => {
    try {
        const { id } = req.params; // Corrigido: extrair id dos parâmetros da requisição.
        const { error } = await supabase.from('visits').delete().eq('id', id);
        if (error) throw error;
        res.status(204).send();
    } catch (error) {
        handleError(res, error, "Falha ao excluir visita.");
    }
});

// --- Inicialização do Banco de Dados ---
const initializeDatabase = async () => {
    const { Pool } = pg;
    const pool = new Pool({ connectionString: dbConnectionString });
    const client = await pool.connect();
    try {
        console.log("Verificando schema do banco de dados...");
        const clientTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'clients'
      );
    `);

        if (!clientTableCheck.rows[0].exists) {
            console.log("Tabelas não encontradas. Criando schema...");
            await client.query(`
        CREATE TABLE public.clients (
            id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            name text NOT NULL,
            phone text,
            email text,
            cpf text,
            address jsonb,
            created_at timestamp with time zone NOT NULL DEFAULT now()
        );

        CREATE TABLE public.visits (
            id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            client_id bigint NOT NULL,
            date timestamp with time zone NOT NULL,
            subject text,
            status text,
            created_at timestamp with time zone NOT NULL DEFAULT now(),
            CONSTRAINT visits_client_id_fkey FOREIGN KEY (client_id)
                REFERENCES public.clients (id) ON DELETE CASCADE
        );

        -- Habilita RLS - boa prática do Supabase
        ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

        -- Políticas que permitem acesso total via service_role (usado no backend)
        CREATE POLICY "Enable all access for service-role"
            ON public.clients FOR ALL
            USING (true)
            WITH CHECK (true);

        CREATE POLICY "Enable all access for service-role"
            ON public.visits FOR ALL
            USING (true)
            WITH CHECK (true);
      `);
            console.log("Schema do banco de dados criado com sucesso.");
        } else {
            console.log("Schema do banco de dados já existe. Verificando por migrações pendentes...");
            
            // Migration: Verifica e remove a coluna obsoleta 'client_name' da tabela 'visits'
            const columnNameCheck = await client.query(`
                SELECT EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                    AND table_name = 'visits'
                    AND column_name = 'client_name'
                );
            `);

            if (columnNameCheck.rows[0].exists) {
                console.log("Coluna 'client_name' obsoleta encontrada na tabela 'visits'. Removendo...");
                await client.query(`ALTER TABLE public.visits DROP COLUMN client_name;`);
                console.log("Coluna 'client_name' removida com sucesso.");
            } else {
                console.log("Nenhuma migração de schema pendente encontrada.");
            }
        }
    } finally {
        await client.release();
        await pool.end();
    }
};

// --- Iniciar Servidor ---
const startServer = async () => {
    try {
        await initializeDatabase();
        app.listen(port, () => {
            console.log(`Backend server running on http://localhost:${port}`);
        });
    } catch (error) {
        console.error("FALHA CRÍTICA: Não foi possível conectar ao banco de dados. Verifique a rede e as credenciais. O servidor será encerrado.", error);
        process.exit(1);
    }
};

startServer();