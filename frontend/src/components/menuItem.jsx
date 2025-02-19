// src/components/MenuItem.jsx
import React from 'react';

function MenuItem({ label, menuId, onClick, isActive }) {
  const handleClick = () => {
    onClick(menuId);
  };

  return (
    <li className="mb-2">
      <button
        onClick={handleClick}
        className={`text-white no-underline block p-2 rounded transition duration-300 hover:bg-blue-900 ${
          isActive ? 'bg-blue-900' : ''
        }`}
      >
        {label}
      </button>
    </li>
  );
}

export default MenuItem;
