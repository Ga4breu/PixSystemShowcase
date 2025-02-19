import React from "react";
import LocationButton from "./LocationButton";

function ConfigurarLocal({ user }) {
  return (
    <div className="text-center">
      <h2 className="text-blue-700 md:mt-[0%] mt-[15%] font-medium mb-4">
        Configurar Localmente Sistema PIXSYSTEM
      </h2>
      <LocationButton user={user} />
      <div id="Status_Conexao" className="mt-4">
        Status: Ocioso
      </div>
    </div>
  );
}

export default ConfigurarLocal;
