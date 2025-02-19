// GenerateReport.jsx
import React, { useState } from 'react';

function GenerateReport({
  machine_id,
  local,
  chave_pix,
  proprietario,
  cliente,
  startDate,
  endDate,
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateReport = async () => {
    // Ensure start and end dates are selected
    if (!startDate || !endDate) {
      console.error('Selecione as datas de início e fim.');
      return;
    }

    setIsLoading(true);

    // Format dates as "YYYY-MM-DD"
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];

    // Prepare the data to be sent
    const data = {
      machine_id,
      start_date: formattedStartDate,
      end_date: formattedEndDate,
      local,
      chave_pix,
      proprietario,
      cliente,
    };
    console.log(data)
    try {
      // Use the proxy endpoint (/api/request_relatorio.php) to avoid CORS issues.
      const response = await fetch('https://pixsystem.net.br/request_relatorio.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.statusText}`);
      }

      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error('Arquivo vazio recebido.');
      }

      // Create an object URL for the blob and trigger the download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${formattedStartDate}=${formattedEndDate}=${machine_id}=${cliente}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Ocorreu um erro ao gerar o relatório:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleGenerateReport}
      disabled={isLoading}
      className={`bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 focus:outline-none ${
        isLoading ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {isLoading ? 'Gerando Relatório...' : 'Gerar Relatório'}
    </button>
  );
}

export default GenerateReport;
