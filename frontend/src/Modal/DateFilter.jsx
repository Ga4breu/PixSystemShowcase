// DateFilter.jsx
import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

function DateFilter({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onFilter,
  onQuickSelect,
}) {
  const handleQuickSelectChange = (e) => {
    const days = parseInt(e.target.value, 10);
    onQuickSelect(days);
  };

  return (
    <div className="mb-4 flex flex-col md:flex-row md:items-end md:space-x-4">
      <div className="mb-2 md:mb-0">
        <label className="block text-gray-700">Data de Início:</label>
        <DatePicker
          selected={startDate}
          onChange={(date) => setStartDate(date)}
          dateFormat="dd/MM/yyyy"
          className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          placeholderText="Selecione a data de início"
          maxDate={new Date()}
        />
      </div>
      <div className="mb-2 md:mb-0">
        <label className="block text-gray-700">Data de Fim:</label>
        <DatePicker
          selected={endDate}
          onChange={(date) => setEndDate(date)}
          dateFormat="dd/MM/yyyy"
          className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          placeholderText="Selecione a data de fim"
          maxDate={new Date()}
        />
      </div>
      <div className="mb-2 md:mb-0">
        <label className="block text-gray-700">Período Rápido:</label>
        <select
          className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          onChange={handleQuickSelectChange}
        >
          <option value="">Selecione um período</option>
          <option value="1">Último 1 dia</option>
          <option value="7">Últimos 7 dias</option>
          <option value="30">Últimos 30 dias</option>
        </select>
      </div>
      <button
        onClick={onFilter}
        className="bg-customBlue text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none mt-4 md:mt-0"
      >
        Filtrar
      </button>
    </div>
  );
}

export default DateFilter;
