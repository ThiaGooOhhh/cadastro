
import React, { useState, useEffect, FormEvent, useCallback } from 'react';
import ReactDOM from 'react-dom/client';

const API_BASE_URL = 'http://localhost:3001/api';

// --- Tipagem (mantida para a UI) ---
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
    clientName: string;
    date: string;
    subject: string;
    status: 'Agendada' | 'Concluída' | 'Cancelada';
}

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'AI' | 'API';
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  details?: string;
}

const MAX_LOGS = 50;

// --- Funções Utilitárias ---
const formatPhone = (value: string): string => {
  if (!value) return '';
  const cleaned = value.replace(/\D/g, '').slice(0, 11);
  const match = cleaned.match(/^(\d{0,2})(\d{0,5})(\d{0,4})$/);
  if (!match) return cleaned;
  const [, ddd, part1, part2] = match;
  let formatted = '';
  if (ddd) formatted = `(${ddd}`;
  if (part1) formatted += `) ${part1}`;
  if (part2) formatted += `-${part2}`;
  return formatted;
};

// --- Componente Principal ---
const App = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'clients' | 'agenda'>('clients');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  // Estados para Cliente
  const [clientView, setClientView] = useState<'list' | 'form' | 'detail'>('list');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados para Visita
  const [visitView, setVisitView] = useState<'list' | 'form'>('list');
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const [preselectedClientIdForVisit, setPreselectedClientIdForVisit] = useState<number | null>(null);

  // Estado para o Modal de Confirmação
  const [modalState, setModalState] = useState<{
      isOpen: boolean;
      title: string;
      message: React.ReactNode;
      onConfirm: () => void;
      onCancel?: () => void;
      confirmButtonText: string;
      confirmButtonClass: string;
  }>({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: () => {},
      onCancel: undefined,
      confirmButtonText: 'Confirmar',
      confirmButtonClass: 'btn-primary'
  });

  const addLog = useCallback((level: LogLevel, message: string, details?: object | string) => {
    const timestamp = new Date().toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newLog: LogEntry = {
        timestamp,
        level,
        message,
        details: details ? (typeof details === 'string' ? details : JSON.stringify(details, null, 2)) : undefined,
    };
    setLogs(prev => [newLog, ...prev].slice(0, MAX_LOGS));
  }, []);

  const loadData = useCallback(async () => {
    addLog('INFO', 'UI: Iniciando carregamento de dados do backend...');
    setIsLoading(true);
    try {
        const clientsPromise = fetch(`${API_BASE_URL}/clients`).then(res => res.json());
        addLog('API', 'GET /api/clients - Enviada');
        const visitsPromise = fetch(`${API_BASE_URL}/visits`).then(res => res.json());
        addLog('API', 'GET /api/visits - Enviada');
        
        const [loadedClients, loadedVisits] = await Promise.all([clientsPromise, visitsPromise]);

        if (!Array.isArray(loadedClients) || !Array.isArray(loadedVisits)) {
            throw new Error('A resposta da API não está no formato esperado.');
        }

        addLog('API', 'GET /api/clients - Resposta Recebida', { 'Itens': loadedClients.length });
        addLog('API', 'GET /api/visits - Resposta Recebida', { 'Itens': loadedVisits.length });
        
        const sortedVisits = loadedVisits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setClients(loadedClients);
        setVisits(sortedVisits);
        addLog('INFO', `UI: Dados carregados e estado atualizado.`, { clients: loadedClients.length, visits: sortedVisits.length });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        addLog('ERROR', `API: Falha ao carregar dados. Verifique se o backend está rodando.`, errorMessage);
    } finally {
        setIsLoading(false);
    }
  }, [addLog]);

  useEffect(() => {
    addLog('INFO', 'Aplicação iniciada.');
    loadData();
  }, [loadData, addLog]);

  const clearLogs = () => {
    setLogs([]);
    addLog('INFO', "Ação 'Limpar Log' executada.");
  };

  const openConfirmationModal = (config: Partial<typeof modalState> & { onConfirm: () => void, title: string, message: React.ReactNode }) => {
    setModalState({
        ...modalState,
        ...config,
        isOpen: true,
    });
  };

  const closeConfirmationModal = () => {
      setModalState(prev => ({ ...prev, isOpen: false }));
  };
  
  const handleSelectClient = (client: Client) => {
    addLog('INFO', `Item de lista 'Cliente: ${client.name}' clicado para ver detalhes.`);
    setSelectedClient(client);
    setClientView('detail');
  }
  
  const handleDeleteClient = (id: number) => {
    const clientToDelete = clients.find(c => c.id === id);
    if (!clientToDelete) return;

    const elementName = `Excluir Cliente: ${clientToDelete.name}`;
    addLog('WARN', `UI: Diálogo de exclusão aberto para '${elementName}'.`);
    
    openConfirmationModal({
        title: 'Confirmar Exclusão',
        message: 'Tem certeza que deseja excluir este cliente? Todas as visitas associadas também serão removidas. Esta ação não pode ser desfeita.',
        confirmButtonText: 'Sim, Excluir',
        confirmButtonClass: 'btn-danger',
        onConfirm: async () => {
            addLog('INFO', `UI: Exclusão confirmada para '${elementName}'.`);
            addLog('API', `DELETE /api/clients/${id} - Enviada`);
            try {
                const response = await fetch(`${API_BASE_URL}/clients/${id}`, { method: 'DELETE' });
                if (!response.ok) throw new Error(`Falha na API: ${response.statusText}`);
                
                addLog('API', `DELETE /api/clients/${id} - Sucesso`);
                // Recarrega os dados para garantir consistência
                await loadData();
                
                if (selectedClient?.id === id) {
                    setClientView('list');
                }
                addLog('INFO', `UI: Cliente e visitas associadas excluídos com sucesso.`);

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                addLog('ERROR', `API: Erro ao executar ação '${elementName}'.`, errorMessage);
            }
        },
        onCancel: () => {
            addLog('INFO', `UI: Ação '${elementName}' cancelada pelo usuário.`);
        }
    });
  };
  
  const handleDeleteVisit = (id: number) => {
    const visitToDelete = visits.find(v => v.id === id);
    if (!visitToDelete) return;

    const elementName = `Excluir Visita ID ${id}`;
    addLog('WARN', `UI: Diálogo de exclusão aberto para '${elementName}'.`);

    openConfirmationModal({
        title: 'Confirmar Exclusão',
        message: 'Tem certeza que deseja excluir esta visita? Esta ação não pode ser desfeita.',
        confirmButtonText: 'Sim, Excluir',
        confirmButtonClass: 'btn-danger',
        onConfirm: async () => {
            addLog('INFO', `UI: Exclusão confirmada para '${elementName}'.`);
            addLog('API', `DELETE /api/visits/${id} - Enviada`);
            try {
                const response = await fetch(`${API_BASE_URL}/visits/${id}`, { method: 'DELETE' });
                if (!response.ok) throw new Error(`Falha na API: ${response.statusText}`);
                 
                addLog('API', `DELETE /api/visits/${id} - Sucesso`);
                await loadData();
                addLog('INFO', `UI: Visita ID ${id} excluída com sucesso.`);
            } catch(error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                addLog('ERROR', `API: Erro ao executar ação '${elementName}'.`, errorMessage);
            }
        },
        onCancel: () => {
             addLog('INFO', `UI: Ação '${elementName}' cancelada pelo usuário.`);
        }
    });
  };

  const handleNavigateToClientForm = (client: Client | null) => {
    setEditingClient(client);
    setClientView('form');
    addLog('INFO', client ? `Botão 'Editar Cliente: ${client.name}' clicado.` : "Botão '+ Novo Cliente' clicado.");
  }

  const handleNavigateToVisitForm = (visit: Visit | null, clientId: number | null = null) => {
    setEditingVisit(visit);
    setPreselectedClientIdForVisit(clientId);
    setActiveTab('agenda');
    setVisitView('form');
    const logMessage = visit
      ? `Botão 'Editar Visita ID ${visit.id}' clicado.`
      : clientId
        ? `Botão '+ Agendar Nova Visita' clicado para Cliente ID ${clientId}.`
        : `Botão '+ Nova Visita' clicado.`;
    addLog('INFO', logMessage);
  }

  const handleSaveOrUpdate = async () => {
      await loadData();
  };

  const onClientFormCancel = () => {
      setClientView(editingClient ? 'detail' : 'list');
      addLog('INFO', "Ação 'Edição/Criação de Cliente' cancelada.");
  };
  
  const onVisitFormCancel = () => {
      setVisitView('list');
      setPreselectedClientIdForVisit(null);
      addLog('INFO', "Ação 'Edição/Criação de Visita' cancelada.");
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    addLog('INFO', `UI: Busca de cliente por termo: '${value}'.`);
  };

  const filteredClients = clients.filter(client => {
      if (!searchTerm) return true;
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const numericSearchTerm = searchTerm.replace(/\D/g, '');

      return (
          client.name.toLowerCase().includes(lowerCaseSearchTerm) ||
          (client.email && client.email.toLowerCase().includes(lowerCaseSearchTerm)) ||
          (client.address && client.address.city.toLowerCase().includes(lowerCaseSearchTerm)) ||
          (numericSearchTerm && client.phone && client.phone.replace(/\D/g, '').includes(numericSearchTerm)) ||
          (numericSearchTerm && client.cpf && client.cpf.replace(/\D/g, '').includes(numericSearchTerm))
      );
  });

  const renderClientList = () => (
    <div>
        <div className="toolbar">
            <h2>Meus Clientes</h2>
            <input
                type="search"
                className="search-input"
                placeholder="Buscar por nome, CPF, cidade..."
                value={searchTerm}
                onChange={handleSearchChange}
                aria-label="Buscar clientes"
            />
            <button className="btn btn-primary" onClick={() => handleNavigateToClientForm(null)}>
                + Novo Cliente
            </button>
        </div>
        {clients.length > 0 ? (
            filteredClients.length > 0 ? (
                <ul className="client-list">
                    {filteredClients.map((client) => (
                        <li key={client.id} className="client-item" onClick={() => handleSelectClient(client)}>
                            <div className="client-info">
                                <strong>{client.name}</strong>
                                <span>{client.phone || 'Sem telefone'} | {client.address?.city || 'Sem cidade'}</span>
                            </div>
                            <div className="client-actions">
                                <button className="btn-icon" aria-label={`Ver detalhes de ${client.name}`}>➔</button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="empty-message"><p>Nenhum cliente encontrado para sua busca.</p></div>
            )
        ) : (
            <div className="empty-message"><p>Nenhum cliente cadastrado.</p></div>
        )}
    </div>
  );
  
  const renderClientDetail = () => {
    if (!selectedClient) return null;
    const clientVisits = visits.filter(v => v.client_id === selectedClient.id);
    return (
        <div className="detail-view">
             <button className="btn btn-secondary btn-back" onClick={() => { setClientView('list'); addLog('INFO', "Botão '← Voltar para a Lista' clicado.")}}>← Voltar para a Lista</button>
             <div className="detail-header">
                <h2>{selectedClient.name}</h2>
                <div className="detail-actions">
                    <button className="btn btn-edit" onClick={() => handleNavigateToClientForm(selectedClient)}>Editar Cliente</button>
                    <button className="btn btn-delete" onClick={() => handleDeleteClient(selectedClient.id)}>Excluir Cliente</button>
                </div>
             </div>
             <div className="detail-grid">
                <div className="detail-card">
                    <h3>Informações de Contato</h3>
                    <p><strong>Telefone:</strong> {selectedClient.phone || 'Não informado'}</p>
                    <p><strong>Email:</strong> {selectedClient.email || 'Não informado'}</p>
                    <p><strong>CPF:</strong> {selectedClient.cpf || 'Não informado'}</p>
                </div>
                <div className="detail-card">
                    <h3>Endereço</h3>
                    {selectedClient.address ? (
                        <>
                            <p>{selectedClient.address.street}, {selectedClient.address.number}</p>
                            <p>{selectedClient.address.neighborhood} - {selectedClient.address.city}, {selectedClient.address.state}</p>
                            <p><strong>CEP:</strong> {selectedClient.address.zip}</p>
                        </>
                    ) : (
                        <p>Endereço não cadastrado.</p>
                    )}
                </div>
             </div>
             <div className="detail-section">
                <h3>Visitas Agendadas</h3>
                <button className="btn btn-primary" onClick={() => handleNavigateToVisitForm(null, selectedClient.id)}>
                    + Agendar Nova Visita
                </button>
                {clientVisits.length > 0 ? renderVisitList(clientVisits) : <p className="empty-message-small">Nenhuma visita para este cliente.</p>}
             </div>
        </div>
    );
  }

  const renderClientForm = () => <ClientForm client={editingClient} onSave={() => { handleSaveOrUpdate(); setClientView('list'); }} onCancel={onClientFormCancel} onLog={addLog} />;

  const renderVisitList = (visitList: Visit[]) => (
     <ul className="visit-list">
        {visitList.map(visit => (
            <li key={visit.id} className={`visit-item status-${visit.status.toLowerCase()}`}>
                <div className="visit-info">
                    <span className={`badge badge-${visit.status.toLowerCase()}`}>{visit.status}</span>
                    <strong>{new Date(visit.date).toLocaleString('pt-BR', {dateStyle: 'short', timeStyle: 'short'})}</strong>
                    <span>Cliente: {visit.clientName}</span>
                    <p>Assunto: {visit.subject}</p>
                </div>
                <div className="visit-actions">
                    <button className="btn btn-edit" onClick={() => handleNavigateToVisitForm(visit)}>Editar</button>
                    <button className="btn btn-delete" onClick={() => handleDeleteVisit(visit.id)}>Excluir</button>
                </div>
            </li>
        ))}
     </ul>
  );

  const renderAgenda = () => (
    <div>
        <div className="toolbar">
            <h2>Próximas Visitas</h2>
            <button className="btn btn-primary" onClick={() => handleNavigateToVisitForm(null)}>
                + Nova Visita
            </button>
        </div>
        {visits.length > 0 ? renderVisitList(visits) : <div className="empty-message"><p>Nenhuma visita agendada.</p></div>}
    </div>
  );
  
  const renderVisitForm = () => <VisitForm visit={editingVisit} clients={clients} preselectedClientId={preselectedClientIdForVisit} onSave={() => { handleSaveOrUpdate(); setVisitView('list'); }} onCancel={onVisitFormCancel} onLog={addLog} />;

  return (
    <div className="container">
      <h1>Gestão de Clientes e Agenda</h1>
      <nav className="nav-tabs">
        <button className={`nav-link ${activeTab === 'clients' ? 'active' : ''}`} onClick={() => { setActiveTab('clients'); addLog('INFO', "Aba 'Clientes' selecionada."); }}>Clientes</button>
        <button className={`nav-link ${activeTab === 'agenda' ? 'active' : ''}`} onClick={() => { setActiveTab('agenda'); addLog('INFO', "Aba 'Agenda' selecionada."); }}>Agenda</button>
      </nav>
      <main className="tab-content">
        {isLoading ? <p>Carregando dados do servidor...</p> : (
            <>
                {activeTab === 'clients' && (
                    clientView === 'list' ? renderClientList() :
                    clientView === 'form' ? renderClientForm() :
                    renderClientDetail()
                )}
                {activeTab === 'agenda' && (
                    visitView === 'list' ? renderAgenda() : renderVisitForm()
                )}
            </>
        )}
      </main>
       <ConfirmationModal 
        isOpen={modalState.isOpen}
        onClose={closeConfirmationModal}
        onConfirm={modalState.onConfirm}
        onCancel={modalState.onCancel}
        title={modalState.title}
        message={modalState.message}
        confirmButtonText={modalState.confirmButtonText}
        confirmButtonClass={modalState.confirmButtonClass}
      />
      {logs.length > 0 && <LogDisplay logs={logs} onClear={clearLogs} />}
    </div>
  );
};


// --- Componente de Modal de Confirmação ---
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onCancel?: () => void;
  title: string;
  message: React.ReactNode;
  confirmButtonText?: string;
  confirmButtonClass?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  title,
  message,
  confirmButtonText = 'Confirmar',
  confirmButtonClass = 'btn-primary'
}) => {
  if (!isOpen) return null;

  const handleClose = useCallback(() => {
    if (onCancel) onCancel();
    onClose();
  }, [onCancel, onClose]);
  
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
       if (event.key === 'Escape') {
        handleClose();
       }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [handleClose]);

  return (
    <div className="modal-overlay" onClick={handleClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 id="modal-title">{title}</h3>
          <button onClick={handleClose} className="btn-close-modal" aria-label="Fechar">&times;</button>
        </div>
        <div className="modal-body">
          {typeof message === 'string' ? <p>{message}</p> : message}
        </div>
        <div className="modal-footer">
          <button onClick={handleClose} className="btn btn-secondary">Cancelar</button>
          <button onClick={handleConfirm} className={`btn ${confirmButtonClass}`}>{confirmButtonText}</button>
        </div>
      </div>
    </div>
  );
};


// --- Componente de Log ---
const LogDisplay: React.FC<{ logs: LogEntry[]; onClear: () => void }> = ({ logs, onClear }) => {
    const [copyButtonText, setCopyButtonText] = useState('Reportar Problema');
    const [isMinimized, setIsMinimized] = useState(true); // Start minimized by default
    
    // State for dragging functionality
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = React.useRef({ mouseX: 0, mouseY: 0, elemX: 0, elemY: 0 });
    
    const lastLog = logs.length > 0 ? logs[0] : null;
    const isCancellation = !!lastLog && lastLog.message.includes("cancelada pelo usuário");

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        // Prevent drag from starting on buttons within the header
        if ((e.target as HTMLElement).closest('button')) {
            return;
        }

        setIsDragging(true);
        dragStartRef.current = {
            mouseX: e.clientX,
            mouseY: e.clientY,
            elemX: position.x,
            elemY: position.y,
        };
        e.preventDefault();
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return;
        
        const deltaX = e.clientX - dragStartRef.current.mouseX;
        const deltaY = e.clientY - dragStartRef.current.mouseY;
        setPosition({
            x: dragStartRef.current.elemX + deltaX,
            y: dragStartRef.current.elemY + deltaY,
        });
    }, [isDragging]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            document.body.style.cursor = 'move';
            document.body.style.userSelect = 'none';
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
        
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    const toggleMinimize = () => {
        setIsMinimized(!isMinimized);
    };

    const handleReportProblem = () => {
        if (!lastLog || isCancellation) {
            return;
        }
        
        const match = lastLog.message.match(/'([^']*)'/);
        const elementName = match ? match[1] : 'a última ação';
        
        const reportText = `Problema detectado: O elemento '${elementName}' não está funcionando como esperado.\n\nDetalhes do log para análise:\n[${lastLog.timestamp}][${lastLog.level}] ${lastLog.message}`;
        
        navigator.clipboard.writeText(reportText).then(() => {
            setCopyButtonText('Copiado!');
            setTimeout(() => setCopyButtonText('Reportar Problema'), 2000);
        }).catch(err => {
            console.error('Erro ao reportar o problema:', err);
            setCopyButtonText('Falhou!');
            setTimeout(() => setCopyButtonText('Reportar Problema'), 2000);
        });
    };

    const style: React.CSSProperties = {
        transform: `translate(${position.x}px, ${position.y}px)`,
    };
    
    const containerClasses = `log-container ${isDragging ? 'is-dragging' : ''} ${isMinimized ? 'is-minimized' : ''}`;

    return (
        <div className={containerClasses} style={style} role="log" aria-live="polite">
            <div className="log-header" onMouseDown={handleMouseDown}>
                <h3>Log de Eventos</h3>
                <div className="log-header-actions">
                    <button onClick={toggleMinimize} className="btn-toggle-log" aria-label={isMinimized ? 'Maximizar log' : 'Minimizar log'}>
                        {isMinimized ? '↑' : '↓'}
                    </button>
                    {!isMinimized && (
                        <>
                            <button 
                                onClick={handleReportProblem} 
                                className="btn-clear-log" 
                                aria-label={isCancellation ? "Última ação foi cancelada pelo usuário" : "Reportar problema com base no último log"}
                                disabled={isCancellation}
                            >
                                {isCancellation ? 'Ação Cancelada' : copyButtonText}
                            </button>
                            <button onClick={onClear} className="btn-clear-log" aria-label="Limpar log">Limpar</button>
                        </>
                    )}
                </div>
            </div>
            {!isMinimized && (
                <div className="log-content">
                    <ul className="log-list">
                        {logs.map((log, index) => (
                            <li key={index} className={`log-item log-item-${log.level}`}>
                               <div className="log-item-header">
                                    <span className={`log-level log-level-${log.level}`}>{log.level}</span>
                                    <span className="log-message">{log.message}</span>
                                    <span className="log-timestamp">{log.timestamp}</span>
                               </div>
                               {log.details && <pre className="log-details">{log.details}</pre>}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};


// --- Componente de Formulário de Cliente ---
type ClientFormData = {
    name: string;
    phone: string;
    email: string;
    cpf: string;
    address: Address;
};

const ClientForm: React.FC<{client: Client | null, onSave: () => void, onCancel: () => void, onLog: (level: LogLevel, message: string, details?: any) => void}> = ({client, onSave, onCancel, onLog}) => {
    const [formData, setFormData] = useState<ClientFormData>({
        name: client?.name || '',
        phone: client?.phone || '',
        email: client?.email || '',
        cpf: client?.cpf || '',
        address: client?.address || { street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zip: '' }
    });
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, address: {...prev.address, [name]: value}}));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const actionName = client ? 'Salvar Alterações' : 'Adicionar Cliente';
        onLog('INFO', `UI: Botão '${actionName}' clicado.`, { formData });
        
        const method = client ? 'PUT' : 'POST';
        const endpoint = client ? `${API_BASE_URL}/clients/${client.id}` : `${API_BASE_URL}/clients`;
        
        onLog('API', `${method} ${endpoint.replace(API_BASE_URL, '')} - Enviada`);
        try {
            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) throw new Error(`Falha na API: ${response.statusText}`);
            
            const savedClient = await response.json();
            onLog('API', `${method} ${endpoint.replace(API_BASE_URL, '')} - Sucesso`, savedClient);
            onSave();
            
        } catch(error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            onLog('ERROR', `API: Erro ao executar ação '${actionName}'.`, errorMessage);
            alert("Não foi possível salvar o cliente. Verifique o log de erros.");
        }
    };

    return (
        <form className="client-form" onSubmit={handleSubmit}>
            <div className="form-header">
              <h2>{client ? 'Editar Cliente' : 'Adicionar Novo Cliente'}</h2>
            </div>
            
            <fieldset>
                <legend>Dados Pessoais</legend>
                <div className="form-group">
                    <label htmlFor="name">Nome Completo</label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="phone">Telefone</label>
                    <input type="tel" id="phone" name="phone" value={formData.phone} onChange={(e) => setFormData(p => ({...p, phone: formatPhone(e.target.value)}))} placeholder="(XX) XXXXX-XXXX" />
                </div>
                 <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} />
                </div>
                 <div className="form-group">
                    <label htmlFor="cpf">CPF</label>
                    <input type="text" id="cpf" name="cpf" value={formData.cpf} onChange={handleChange} />
                </div>
            </fieldset>

            <fieldset>
                <legend>Endereço</legend>
                <div className="form-group">
                    <label htmlFor="street">Rua</label>
                    <input type="text" id="street" name="street" value={formData.address.street} onChange={handleAddressChange} />
                </div>
                 <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="number">Número</label>
                        <input type="text" id="number" name="number" value={formData.address.number} onChange={handleAddressChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="complement">Complemento</label>
                        <input type="text" id="complement" name="complement" value={formData.address.complement} onChange={handleAddressChange} />
                    </div>
                </div>
                 <div className="form-group">
                    <label htmlFor="neighborhood">Bairro</label>
                    <input type="text" id="neighborhood" name="neighborhood" value={formData.address.neighborhood} onChange={handleAddressChange} />
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="city">Cidade</label>
                        <input type="text" id="city" name="city" value={formData.address.city} onChange={handleAddressChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="state">Estado</label>
                        <input type="text" id="state" name="state" value={formData.address.state} onChange={handleAddressChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="zip">CEP</label>
                        <input type="text" id="zip" name="zip" value={formData.address.zip} onChange={handleAddressChange} />
                    </div>
                </div>
            </fieldset>

            <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{client ? 'Salvar Alterações' : 'Adicionar Cliente'}</button>
            </div>
        </form>
    );
}

// --- Componente de Formulário de Visita ---
const VisitForm: React.FC<{visit: Visit | null, clients: Client[], preselectedClientId: number | null, onSave: () => void, onCancel: () => void, onLog: (level: LogLevel, message: string, details?: any) => void}> = ({visit, clients, preselectedClientId, onSave, onCancel, onLog}) => {
    const [formData, setFormData] = useState<Omit<Visit, 'id' | 'clientName'>>({
        client_id: visit?.client_id ?? preselectedClientId ?? (clients.length > 0 ? clients[0].id : 0),
        date: visit?.date ? new Date(visit.date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
        subject: visit?.subject || '',
        status: visit?.status || 'Agendada'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'client_id' ? Number(value) : value }));
    };
    
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!formData.client_id || formData.client_id === 0) {
            onLog('WARN', "Ação 'Agendar Visita' bloqueada: cliente não selecionado.");
            alert("Por favor, selecione um cliente.");
            return;
        }
        const actionName = visit ? 'Salvar Alterações da Visita' : 'Agendar Visita';
        onLog('INFO', `UI: Botão '${actionName}' clicado.`, { formData });
        
        const method = visit ? 'PUT' : 'POST';
        const endpoint = visit ? `${API_BASE_URL}/visits/${visit.id}` : `${API_BASE_URL}/visits`;

        onLog('API', `${method} ${endpoint.replace(API_BASE_URL, '')} - Enviada`);
        try {
            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) throw new Error(`Falha na API: ${response.statusText}`);

            const savedVisit = await response.json();
            onLog('API', `${method} ${endpoint.replace(API_BASE_URL, '')} - Sucesso`, savedVisit);
            onSave();
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            onLog('ERROR', `API: Erro ao executar ação '${actionName}'.`, errorMessage);
            alert("Não foi possível salvar a visita. Verifique o log de erros.");
        }
    };

    return (
        <form className="client-form" onSubmit={handleSubmit}>
            <h2>{visit ? 'Editar Visita' : 'Agendar Nova Visita'}</h2>
            <div className="form-group">
                <label htmlFor="client_id">Cliente</label>
                <select id="client_id" name="client_id" value={formData.client_id} onChange={handleChange} required disabled={!!preselectedClientId}>
                    <option value={0} disabled>Selecione um cliente</option>
                    {clients.map(client => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                </select>
            </div>
             <div className="form-group">
                <label htmlFor="date">Data e Hora</label>
                <input type="datetime-local" id="date" name="date" value={formData.date} onChange={handleChange} required />
            </div>
            <div className="form-group">
                <div className="label-with-action">
                    <label htmlFor="subject">Assunto</label>
                </div>
                <input type="text" id="subject" name="subject" value={formData.subject} onChange={handleChange} required />
            </div>
            <div className="form-group">
                <label htmlFor="status">Status</label>
                <select id="status" name="status" value={formData.status} onChange={handleChange} required>
                    <option value="Agendada">Agendada</option>
                    <option value="Concluída">Concluída</option>
                    <option value="Cancelada">Cancelada</option>
                </select>
            </div>
            <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{visit ? 'Salvar Alterações' : 'Agendar Visita'}</button>
            </div>
        </form>
    );
};

// --- Renderização do App ---
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
