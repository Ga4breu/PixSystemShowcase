import React, { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Transacoes from '../Modal/Transacoes';

// Import your custom icons
import markerOK from '../assets/Marker-OK.png';
import markerOFF from '../assets/Marker-OFF.png';
import markerALERT from '../assets/Marker-ALERT.png';
import markerUnknown from '../assets/Marker-Unknown.png';

function MapView({ selectedMachineId }) {
  const [maquinas, setMaquinas] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedMaquina, setSelectedMaquina] = useState(null);

  // References to the map and markers layer group
  const mapRef = useRef(null);
  const markersRef = useRef(L.layerGroup());
  const maquinaMarkersRef = useRef({}); // To keep track of markers by machine ID

  useEffect(() => {
    const fetchMaquinas = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/maquinas`, {
          method: 'GET',
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error('Failed to fetch máquinas data');
        }
        const data = await response.json();
        setMaquinas(data);
      } catch (error) {
        console.error('Error fetching máquinas:', error);
      }
    };

    const fetchStatuses = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/status`, {
          method: 'GET',
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
        const data = await response.json();
        setStatuses(data);
      } catch (error) {
        console.error('Failed to fetch statuses:', error);
      }
    };

    // Initial fetch
    fetchMaquinas();
    fetchStatuses();

    // Set up interval to re-fetch data every 30 seconds
    const interval = setInterval(() => {
      fetchMaquinas();
      fetchStatuses();
    }, 30000); // 30 seconds

    // Clean up the interval on component unmount
    return () => clearInterval(interval);
  }, []);

  const getStatusForMaquina = (maquinaId) => {
    const statusObj = statuses.find((status) => status.maquina === maquinaId);
    return statusObj ? statusObj.status : null;
  };

  const getIconForStatus = (status) => {
    switch (status) {
      case 0: // Desligada
        return L.icon({
          iconUrl: markerOFF,
          iconSize: [32, 48],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32],
        });
      case 1: // Ligada
        return L.icon({
          iconUrl: markerOK,
          iconSize: [32, 48],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32],
        });
      case 2: // Cobrando
        return L.icon({
          iconUrl: markerALERT,
          iconSize: [32, 48],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32],
        });
      default:
        // For any value that is not 0, 1, or 2, return the unknown marker
        return L.icon({
          iconUrl: markerUnknown,
          iconSize: [32, 48],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32],
        });
    }
  };
  

  // Initialize the map only once
  useEffect(() => {
    mapRef.current = L.map('leafletMap').setView([-24.7199, -53.7433], 10);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'Map data © OpenStreetMap contributors',
    }).addTo(mapRef.current);

    // Add the markers layer group to the map
    markersRef.current.addTo(mapRef.current);

    // Clean up on component unmount
    return () => {
      mapRef.current.remove();
    };
  }, []);

  // Update markers whenever maquinas or statuses change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.clearLayers();
    maquinaMarkersRef.current = {};

    // Add markers for each máquina
    maquinas.forEach((maquina) => {
      const {
        latitude,
        longitude,
        local,
        maquina: maquinaId,
        cliente,
        proprietario,
      } = maquina;

      if (latitude && longitude) {
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);

        if (!isNaN(lat) && !isNaN(lng)) {
          const status = getStatusForMaquina(maquinaId);
          const icon = getIconForStatus(status);

          const marker = L.marker([lat, lng], { icon });

          // Updated popup content with Tailwind CSS classes
          const popupContent = `
            <div>
              <strong>Máquina ID:</strong> ${maquinaId}<br/>
              <strong>Local:</strong> ${local}<br/>
              <strong>Cliente:</strong> ${cliente}<br/>
              <strong>Proprietário:</strong> ${proprietario}<br/>
              <button class="more-info-btn underline text-blue-500 hover:text-blue-400" data-maquina-id="${maquinaId}" style="background: none; border: none; padding: 0; font: inherit; cursor: pointer;">Mais informações</button>
            </div>
          `;
          marker.bindPopup(popupContent);

          marker.on('popupopen', function (e) {
            const popup = e.popup;
            const btn = popup._contentNode.querySelector('.more-info-btn');
            if (btn) {
              btn.addEventListener('click', function () {
                const maquinaId = btn.getAttribute('data-maquina-id');
                const selected = maquinas.find((m) => m.maquina == maquinaId);
                setSelectedMaquina(selected);
                setShowModal(true);
              });
            }
          });

          markersRef.current.addLayer(marker);


          maquinaMarkersRef.current[maquinaId] = marker;
        }
      }
    });


    if (selectedMachineId && maquinaMarkersRef.current[selectedMachineId]) {
      const marker = maquinaMarkersRef.current[selectedMachineId];
      mapRef.current.setView(marker.getLatLng(), 16); 
      marker.openPopup();
    }

  }, [maquinas, statuses, selectedMachineId]);

  return (
    <div>
      <h2 className="font-bold mb-4 md:mt-0 mt-12">Mapa</h2>
      <div id="leafletMap" className="h-[80vh] z-10"></div>
      {showModal && (
        <Transacoes maquina={selectedMaquina} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}

export default MapView;
