import React, { useEffect, useState } from 'react';
import MenuItem from './MenuItem';
import { AiOutlineMenu, AiOutlineClose } from 'react-icons/ai';
import logo from '../assets/logo.png';

function Sidebar({ onMenuSelect, selectedMenu, onLogout, userNivel }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCloseIcon, setShowCloseIcon] = useState(false);
  const [renderKey, setRenderKey] = useState(0);

  useEffect(() => {
    setRenderKey(prevKey => prevKey + 1);
  }, [userNivel]);

  const toggleSidebar = () => {
    if (!isOpen) {
      setIsOpen(true);
      setTimeout(() => setShowCloseIcon(true), 250);
    } else {
      setShowCloseIcon(false);
      setIsOpen(false)
    }
  };

  const ComprarSistema = () => {
    window.open(
      'https://wa.me//554588076874?text=Bom%20Dia%20/%20Tarde%0AEstou%20interessado%20em%20comprar%20um%20novo%20Sistema%20da%20PIXSYSTEM',
      '_blank'
    );
  };

  const Logout = async () => {
    const confirmed = window.confirm('Tem certeza que deseja sair?');
    if (confirmed) {
      try {
        localStorage.clear();
        sessionStorage.clear();
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/logout`, {
          method: 'POST',
          credentials: 'include',
        });
        if (response.ok) {
          if (onLogout) {
            onLogout();
          } else {
            window.location.href = '/login';
          }
        } else {
          console.error('Logout failed');
        }
      } catch (error) {
        console.error('Error during logout:', error);
      }
    }
  };

  const handleMenuClick = menuId => {
    onMenuSelect(menuId);
    if (isOpen) {
      toggleSidebar();
    }
  };

  return (
    <div key={renderKey}>
      <button
        onClick={toggleSidebar}
        className="text-white p-2 rounded-md fixed top-4 left-4 z-50 md:hidden"
        aria-label="Toggle sidebar"
      >
        {showCloseIcon ? (
          <AiOutlineClose size={24} style={{ marginLeft: '160px' }} />
        ) : (
          <AiOutlineMenu className="absolute left-[80vw] text-blue-600" size={36} />
        )}
      </button>
      <div
        className={`bg-customBlue text-white py-[2.5vh] px-[1vw] h-[100%] shadow-lg z-40 transition-transform duration-300 font-medium text-xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed top-0 left-0 w-56 md:static md:translate-x-0`}
      >
        <div className="h-[85vh]">
          <div className="flex ml-8 mb-2">
            <img src={logo} alt="Logo" className="md:h-11 w-auto h-10" />
          </div>
          <h3 className="mb-5 pb-4 border-b border-gray-300 ml-2"></h3>
          <ul className="list-none p-0 m-0">
          {userNivel !== 3 ? (
            <>
              <MenuItem
                label="Usuário"
                menuId="userInfo"
                onClick={handleMenuClick}
                isActive={selectedMenu === 'userInfo'}
              />
              <MenuItem
                label="Mapa"
                menuId="map"
                onClick={handleMenuClick}
                isActive={selectedMenu === 'map'}
              />
              <MenuItem
                label="Máquinas"
                menuId="maquinas"
                onClick={handleMenuClick}
                isActive={selectedMenu === 'maquinas'}
              />
              <li className="mb-2">
                <a
                  href="#"
                  onClick={ComprarSistema}
                  className="text-white no-underline block p-2 rounded transition duration-300 hover:bg-blue-900"
                >
                  Contato
                </a>
                <h3 className="mb-5 pb-4 border-b border-gray-300 ml-2"></h3>
              </li>
            </>
          ) : null}
          {userNivel !== 2 && (
            <MenuItem
              label="Configurar"
              menuId="configurar_local"
              onClick={handleMenuClick}
              isActive={selectedMenu === 'configurar_local'}
            />
          )}
        </ul>

        </div>
        <a
          href="#"
          onClick={Logout}
          className="text-white no-underline block p-2 rounded transition duration-300 hover:bg-blue-900"
        >
          Sair
        </a>
      </div>
      {isOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
        ></div>
      )}
    </div>
  );
}

export default Sidebar;
