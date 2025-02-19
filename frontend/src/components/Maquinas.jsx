import React, { useEffect, useState } from 'react';
import Transacoes from '../Modal/Transacoes';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { io } from 'socket.io-client';
import LocationButton from './LocationButton'; // Import the LocationButton component

function Maquinas({ user, onMenuSelect }) { // Destructure user prop
  const [maquinas, setMaquinas] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedMaquina, setSelectedMaquina] = useState(null);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const fetchMaquinas = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/maquinas`,
          {
            method: 'GET',
            credentials: 'include',
          }
        );
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            setError('Você não está autorizado a ver esta informação.');
          } else {
            const errorData = await response.json();
            throw new Error(
              `Error: ${response.status} - ${errorData.message || response.statusText}`
            );
          }
          return;
        }
        const data = await response.json();
        setMaquinas(data);
      } catch (error) {
        console.error('Failed to fetch maquinas:', error);
        setError('Falha ao buscar máquinas.');
        setMaquinas([]);
      }
    };

    const fetchStatuses = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/status`,
          {
            method: 'GET',
            credentials: 'include',
          }
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            `Error: ${response.status} - ${errorData.message || response.statusText}`
          );
        }
        const data = await response.json();
        setStatuses(data);
      } catch (error) {
        console.error('Failed to fetch statuses:', error);
        setError('Falha ao buscar status das máquinas.');
        setStatuses([]);
      }
    };

    fetchMaquinas();
    fetchStatuses();

    const newSocket = io(import.meta.env.VITE_BACKEND_URL, {
      withCredentials: true,
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      setError('Erro na conexão WebSocket.');
    });

    newSocket.on('status_changed', (updatedStatus) => {
      console.log('Received status_changed:', updatedStatus);
      setStatuses((prevStatuses) =>
        prevStatuses.map((status) =>
          status.maquina === updatedStatus.maquina ? updatedStatus : status
        )
      );
    });

    newSocket.on('status_updated', (updatedStatuses) => {
      console.log('Received status_updated:', updatedStatuses);
      setStatuses(updatedStatuses);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const openModal = (maquina) => {
    setSelectedMaquina(maquina);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedMaquina(null);
  };

  const getStatusColor = (status) => {
    if (status === 0) {
      return 'text-red-500 bg-red-500 ring-offset-red-400 ring-red-500';
    }
    if (status === 1) {
      return 'text-green-500 bg-green-500 ring-offset-green-400 ring-green-500';
    }
    if (status === 2) {
      return 'text-yellow-500 bg-yellow-500 ring-offset-yellow-400 ring-yellow-500';
    }
    return 'text-gray-500 bg-gray-500 ring-offset-gray-400 ring-gray-500';
  };

  const getStatusText = (status) => {
    if (status === 0) return 'Desligada';
    if (status === 1) return 'Ligada';
    if (status === 2) return 'Cobrando';
    return 'Desconhecido';
  };

  const getStatusForMaquina = (maquinaId) => {
    if (!statuses || statuses.length === 0) return null;
    const statusObj = statuses.find((s) => s.maquina === maquinaId);
    return statusObj ? statusObj.status : null;
  };

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="left-0 whitespace-nowrap">

      <div className='flex-col'>
        <h2 className="text-blue-700 mb-4 text-lg font-semibold">Máquinas</h2>
        <p className="mb-4 text-gray-700">Aqui serão listadas suas Máquinas.</p>
      </div>
      <div id="maquinas_lista" className="flex flex-wrap gap-4 mt-8">
        {maquinas.length > 0 ? (
          maquinas.map((maquina, index) => {
            const maquinaId = maquina.maquina;
            const statusValue = getStatusForMaquina(maquinaId);
            const statusColor = getStatusColor(statusValue);

            return (
              <div
                key={maquinaId || `maquina-${index}`}
                className="bg-white border border-gray-300 rounded-lg shadow p-4 w-full md:w-[350px] box-border overflow-hidden"
              >
                <div className="flex items-center gap-2 mt-4">
                  <div
                    className={`w-4 h-4 rounded-full ${statusColor.split(' ')[1]} shadow-lg`}
                  ></div>
                  <span className={`${statusColor.split(' ')[0]}`}>
                    {getStatusText(statusValue)}
                  </span>
                </div>

                <h3 className="mt-0 font-bold text-gray-800">
                  ID: {maquinaId}
                </h3>
                <p>
                  <span className="font-bold">Proprietário:</span> {maquina.proprietario}
                </p>
                <p>
                  <span className="font-bold">Local:</span> {maquina.local}
                </p>
                <p>
                  <span className="font-bold">Cliente:</span> {maquina.cliente}
                </p>
                <p>
                  <span className="font-bold">Chave PIX:</span> {maquina.chave_pix}
                </p>
                <p>
                  <span className="font-bold">Rede WiFi:</span> {maquina.wifi_ssid}
                </p>
                <p>
                  <span className="font-bold">Senha:</span> {maquina.wifi_pass}
                </p>
                <p>
                  <span className="font-bold">Versão:</span> {maquina.version_software}
                </p>
                <p>
                  <span className="font-bold">Transferido Hoje:</span> R${' '}
                  {(Number(maquina.daily_sum) / 100.0).toFixed(2)}
                </p>

                <div className="flex gap-8">
                  <button
                    className="bg-customBlue text-white py-2 px-4 rounded mt-2 hover:bg-blue-800"
                    onClick={() => openModal(maquina)}
                  >
                    Mais informações
                  </button>
                  {maquina.latitude &&
                  maquina.longitude &&
                  !isNaN(maquina.latitude) &&
                  !isNaN(maquina.longitude) ? (
                    <button
                      className="bg-customBlue text-white py-2 px-4 rounded mt-2 hover:bg-blue-800"
                      onClick={() => onMenuSelect('map', maquinaId)}
                    >
                      Localizar
                    </button>
                  ) : (
                    <p className="text-gray-500 mt-2">
                      <span>Não mapeado</span>
                    </p>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-gray-500">Nenhuma máquina encontrada.</p>
        )}
      </div>
      
      {showModal && (
        <Transacoes maquina={selectedMaquina} onClose={closeModal} />
      )}
    </div>
  );
}

export default Maquinas;
