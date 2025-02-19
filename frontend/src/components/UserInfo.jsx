// UserInfo.js
import React from 'react';

function UserInfo({ user }) {
  if (!user) {
    return <div className="text-center mt-24">Carregando informações do usuário...</div>;
  }
  console.log(user)

  return (
    <div className="flex flex-col items-center">
      <h2 className="font-medium md:mt-0 mt-24 text-2xl">Informações do Usuário</h2>
      <div className="mt-4 w-full max-w-md">
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Nome de Usuário
            </label>
            <p className="text-gray-900">{user.username}</p>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Email
            </label>
            <p className="text-gray-900">{user.email}</p>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Telefone
            </label>
            <p className="text-gray-900">{user.phone}</p>
          </div>
          {user.father_account && (
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Conta Pai
              </label>
              <p className="text-gray-900">{user.father_account}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserInfo;
