import React from "react";

function LocationButton({ user }) {
  const handleConnect = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;

          // Check if father_account is non-empty, otherwise use username
          const proprietario = user.father_account.trim() !== "" ? user.father_account : user.username;

          const url = `http://192.168.4.1/?latitude=${latitude}&longitude=${longitude}&proprietario=${proprietario}`;
          window.location.href = url;
        },
        (error) => {
          console.error("Error fetching location:", error);
          alert("Não conseguimos pegar sua localização. Tente novamente.");
        }
      );
    } else {
      alert("Geolocalização não é suportada pelo seu Browser.");
    }
  };

  return (
    <button
      id="configurar_conectar"
      className="bg-blue-700 text-white py-2 px-4 rounded h-[50%]"
      onClick={handleConnect}
    >
      Configurar Dispositivo Próximo
    </button>
  );
}

export default LocationButton;
