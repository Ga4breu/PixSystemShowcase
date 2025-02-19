import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Content from './components/Content';
import Sidebar from './components/Sidebar';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // Track authentication state
  const [userNivel, setUserNivel] = useState(null); // Track user level
  const [selectedMenu, setSelectedMenu] = useState(null); // Track selected menu
  const [selectedMachineId, setSelectedMachineId] = useState(null); // Track selected machine ID
  const [user, setUser] = useState(null); // Store user information

  const navigate = useNavigate(); // For navigation

  const checkAuth = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/check-auth`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Data from /check-auth:', data);
        setIsAuthenticated(true);
        setUserNivel(data.user.nivel);
        setUser(data.user);

        setSelectedMenu(data.user.nivel === 3 ? 'configurar_local' : 'map');
      } else {
        setIsAuthenticated(false);
        setUserNivel(null);
        setSelectedMenu(null);
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      setIsAuthenticated(false);
      setUserNivel(null);
      setSelectedMenu(null);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    checkAuth(); // Fetch and update user information
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserNivel(null);
    setSelectedMenu(null);
    setSelectedMachineId(null);
    setUser(null);

    // Redirect to the login page
    navigate('/login');
  };

  const handleMenuSelect = (menu, machineId = null) => {
    setSelectedMenu(menu);
    if (machineId !== null) {
      setSelectedMachineId(machineId);
    } else {
      setSelectedMachineId(null);
    }
  };

  // Conditional rendering to handle authentication state
  if (isAuthenticated === null) {
    return <div></div>; // Show a loading state while checking authentication
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/" replace />
          ) : (
            <Login onLogin={handleLogin} />
          )
        }
      />
      <Route
        path="/*"
        element={
          isAuthenticated ? (
            <div className="flex h-screen">
              <Sidebar
                onMenuSelect={handleMenuSelect}
                selectedMenu={selectedMenu}
                onLogout={handleLogout}
                userNivel={userNivel}
                className="h-screen flex-none"
              />
              <div className="flex-grow h-screen overflow-y-auto">
                <Content
                  selectedMenu={selectedMenu}
                  selectedMachineId={selectedMachineId}
                  onMenuSelect={handleMenuSelect}
                  user={user}
                />
              </div>
            </div>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default AppWrapper;
