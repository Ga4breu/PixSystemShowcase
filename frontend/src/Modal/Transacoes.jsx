import React, { useState, useEffect } from 'react';
import DateFilter from './DateFilter';
import { io } from 'socket.io-client';
import GenerateReport from './GenerateReport';

function Transacoes({ maquina, onClose }) {
  const [transacoes, setTransacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [sortKey, setSortKey] = useState('Horario_Cob');
  const [sortOrder, setSortOrder] = useState('desc');
  const [socket, setSocket] = useState(null);

  
  const fetchTransacoes = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('maquina', maquina.maquina);

      if (startDate) {
        // Set startDate to the very beginning of the day
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        params.append('dataInicio', start.toISOString());
      }
      if (endDate) {
        // Set endDate to the very end of the day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        params.append('dataFim', end.toISOString());
      }

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/transacoes?${params.toString()}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setError('Você não está autorizado a ver esta informação.');
        } else {
          throw new Error(`Error: ${response.statusText}`);
        }
        return;
      }
      const data = await response.json();
      setTransacoes(data);
    } catch (error) {
      console.error('Failed to fetch transacoes:', error);
      setError('Falha ao buscar transações.');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchTransacoes();
    const newSocket = io(import.meta.env.VITE_BACKEND_URL, {
      withCredentials: true,
    });
    setSocket(newSocket);

    // Evento: atualização geral de transações
    newSocket.on('transacoes_updated', (updatedTransacao) => {
      console.log('Received transacoes_updated event:', updatedTransacao);
      setTransacoes((prevTransacoes) =>
        prevTransacoes.map((transacao) =>
          transacao.EndtoEndID_Cob === updatedTransacao.EndtoEndID_Cob
            ? updatedTransacao
            : transacao
        )
      );
    });

    // Evento: atualização apenas do status da transação
    newSocket.on('transacao_status_updated', (updatedTransacao) => {
      console.log('Received transacao_status_updated event:', updatedTransacao);
      setTransacoes((prevTransacoes) =>
        prevTransacoes.map((transacao) =>
          transacao.EndtoEndID_Cob === updatedTransacao.EndtoEndID_Cob
            ? updatedTransacao
            : transacao
        )
      );
    });

    // Evento: nova transação
    newSocket.on('new_transacao', (newTransacao) => {
      if (newTransacao.Maquina.toLowerCase() !== maquina.maquina.toLowerCase()) {
        return;
      }
      console.log('Received new_transacao event:', newTransacao);
      setTransacoes((prevTransacoes) => [newTransacao, ...prevTransacoes]);
    });
    

    // Evento: remoção de transação
    newSocket.on('transacao_removed', ({ id }) => {
      console.log('Received transacao_removed event for ID:', id);
      setTransacoes((prevTransacoes) =>
        prevTransacoes.filter((transacao) => transacao.EndtoEndID_Cob !== id)
      );
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      setError('Erro na conexão WebSocket.');
    });

    return () => {
      newSocket.disconnect();
    };
  }, [maquina.maquina]);

  const handleFilter = () => {
    fetchTransacoes();
  };

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const sortedTransacoes = [...transacoes];
  if (sortKey) {
    sortedTransacoes.sort((a, b) => {
      let aValue = a[sortKey];
      let bValue = b[sortKey];

      if (sortKey === 'Valor_Transf' || sortKey === 'Valor_Cob') {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      } else if (sortKey === 'Data_Criado_Transf' || sortKey === 'Horario_Cob') {
        const dateA = aValue ? new Date(aValue) : new Date(0);
        const dateB = bValue ? new Date(bValue) : new Date(0);
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      } else {
        aValue = aValue || '';
        bValue = bValue || '';
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
    });
  }

  const handleQuickSelect = (days) => {
    if (!days) return;
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - days);
    setStartDate(start);
    setEndDate(today);
  };

  // Dados necessários para o relatório
  const machine_id = maquina.maquina;
  const cliente = maquina.cliente;
  const local = maquina.local;
  const chave_pix = maquina.chave_pix;
  const proprietario = maquina.proprietario;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-20 bg-black bg-opacity-50 h-[100vh]"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-lg shadow-lg w-full max-w-[80vw] mx-4">
        <div className="flex justify-between items-center border-b px-6 py-4">
          <h2 className="text-xl font-semibold md:overflow-auto overflow-scroll">
            Máquina: {machine_id}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none text-2xl"
            aria-label="Fechar"
          >
            &times;
          </button>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm font-semibold">Cliente: {cliente}</p>
          <p className="text-sm font-semibold">Local: {local}</p>
          <DateFilter
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            onFilter={handleFilter}
            onQuickSelect={handleQuickSelect}
          />

          {loading ? (
            <p className="text-gray-700">Carregando...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : sortedTransacoes.length > 0 ? (
            <div className="max-h-[30vh] md:max-h-[40vh] lg:max-h-[50vh] overflow-x-scroll">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="sticky top-0 bg-white">
                  <tr>
                    <th
                      onClick={() => handleSort('Horario_Cob')}
                      className="cursor-pointer px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Horário de Pagamento
                      {sortKey === 'Horario_Cob' && (
                        <span>{sortOrder === 'asc' ? ' ▲' : ' ▼'}</span>
                      )}
                    </th>
                    <th
                      onClick={() => handleSort('Valor_Cob')}
                      className="cursor-pointer px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Valor Pago
                      {sortKey === 'Valor_Cob' && (
                        <span>{sortOrder === 'asc' ? ' ▲' : ' ▼'}</span>
                      )}
                    </th>
                    <th
                      onClick={() => handleSort('Data_Criado_Transf')}
                      className="cursor-pointer px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Data da Transferência
                      {sortKey === 'Data_Criado_Transf' && (
                        <span>{sortOrder === 'asc' ? ' ▲' : ' ▼'}</span>
                      )}
                    </th>
                    <th
                      onClick={() => handleSort('Valor_Transf')}
                      className="cursor-pointer px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Valor Transferido
                      {sortKey === 'Valor_Transf' && (
                        <span>{sortOrder === 'asc' ? ' ▲' : ' ▼'}</span>
                      )}
                    </th>
                    <th
                      onClick={() => handleSort('Chave_Transferida')}
                      className="cursor-pointer px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Chave PIX
                      {sortKey === 'Chave_Transferida' && (
                        <span>{sortOrder === 'asc' ? ' ▲' : ' ▼'}</span>
                      )}
                    </th>
                    <th
                      onClick={() => handleSort('Status_Transf')}
                      className="cursor-pointer px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                      {sortKey === 'Status_Transf' && (
                        <span>{sortOrder === 'asc' ? ' ▲' : ' ▼'}</span>
                      )}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedTransacoes.map((transacao) => {
                    const {
                      Chave_Transferida,
                      Horario_Cob,
                      Valor_Cob,
                      Data_Criado_Transf,
                      Valor_Transf,
                      Status_Transf,
                      EndtoEndID_Cob,
                    } = transacao;

                    const formattedHorarioCob = Horario_Cob
                      ? new Date(Horario_Cob).toLocaleString('pt-BR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })
                      : '-';

                    const formattedDataCriadoTransf = Data_Criado_Transf
                      ? new Date(Data_Criado_Transf).toLocaleString('pt-BR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })
                      : '-';

                    const formattedValorCob =
                      Valor_Cob != null
                        ? (Number(Valor_Cob) / 100).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })
                        : '-';

                    const formattedValorTransf =
                      Valor_Transf != null
                        ? (Number(Valor_Transf) / 100).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })
                        : '-';

                    const isSuccess = Status_Transf === 'SUCCESS';

                    return (
                      <tr key={EndtoEndID_Cob}>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {formattedHorarioCob}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {formattedValorCob}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {formattedDataCriadoTransf}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {formattedValorTransf}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {Chave_Transferida || '-'}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900 flex items-center">
                          {Status_Transf ? (
                            <>
                              {isSuccess ? (
                                <svg
                                  className="h-5 w-5 text-green-500 mr-1"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  className="h-5 w-5 text-red-500 mr-1"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              )}
                              <span>{Status_Transf}</span>
                            </>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">Nenhuma transação encontrada.</p>
          )}
        </div>
        <div className="flex justify-end items-center border-t px-6 py-4 gap-2">
          {/* Botão de Gerar Relatório através do componente GenerateReport */}
          <GenerateReport
            machine_id={machine_id}
            local={local}
            chave_pix={chave_pix}
            proprietario={proprietario}
            cliente={cliente}
            startDate={startDate}
            endDate={endDate}
          />
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 focus:outline-none"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

export default Transacoes;
