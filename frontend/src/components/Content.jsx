// src/components/Content.jsx
import React from 'react';
import UserInfo from './UserInfo.jsx';
import MapView from './MapView.jsx';
import Maquinas from './Maquinas.jsx';
import ConfigurarLocal from './ConfigurarLocal.jsx';

function Content({ selectedMenu = 'userInfo', selectedMachineId, onMenuSelect, user }) {
  return (
    <div className="w-full p-4">
      {selectedMenu === 'userInfo' && <UserInfo user={user} />}
      {selectedMenu === 'map' && <MapView selectedMachineId={selectedMachineId} />}
      {selectedMenu === 'maquinas' && <Maquinas onMenuSelect={onMenuSelect} user={user} />}
      {selectedMenu === 'configurar_local' && <ConfigurarLocal user={user}/>}
    </div>
  );
}

export default Content;
