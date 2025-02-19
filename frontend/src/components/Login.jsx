// src/components/Login.jsx
import React, { useState } from 'react';
import cafeImage from '../assets/cafe.jpg';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      // Send credentials to the backend for validation
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies in the request
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      console.log('Response data:', data); // Log the response from the backend

      if (data.success) {
        setMessage(''); // Clear any previous error message
        onLogin(); // Proceed with login
      } else {
        setMessage(data.message || 'Incorrect username or password'); // Display error message
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('An error occurred. Please try again.');
    }
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-center min-h-screen text-gray-800">
      <img
        src={cafeImage}
        alt="Café"
        className="hidden md:block w-1/2 h-screen object-cover"
      />
      <div className="flex items-center justify-center w-full md:w-1/2 h-screen bg-white">
        <div className="bg-white rounded-lg shadow-md p-10 text-center w-96">
          <h1 className="text-blue-700 mb-8 text-2xl font-semibold">Login</h1>
          <form id="loginForm" onSubmit={handleSubmit} className="mt-5 text-left">
            <label htmlFor="username" className="block mb-1 text-blue-700 font-medium">
              Usuário:
            </label>
            <input
              type="text"
              id="username"
              name="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2.5 mb-5 border border-gray-300 rounded text-base"
            />
            <label htmlFor="password" className="block mb-1 text-blue-700 font-medium">
              Senha:
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2.5 mb-5 border border-gray-300 rounded text-base"
            />
            {/* Wrap the button in a div that centers its content */}
            <div className="flex justify-center">
              <button
                type="submit"
                className="bg-blue-700 hover:bg-blue-800 text-white py-2.5 px-5 rounded text-base mt-5"
              >
                Login
              </button>
            </div>
          </form>

          {message && (
            <p id="message" className="text-red-500 text-sm mt-3">
              {message}
            </p>
          )}
          <p className="mt-5">
            Não tem uma conta?{' '}
            <a href="https://wa.me/554588076874?text=Gostaria%20de%20saber%20mais%20sobre%20o%20sistema%20PixSystem%21" className="text-blue-700 font-medium hover:underline">
              Entre em contato!
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
