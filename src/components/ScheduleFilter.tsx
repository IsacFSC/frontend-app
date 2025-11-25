'use client';

import { useState } from 'react';
import { FaChevronLeft, FaChevronRight, FaChevronDown, FaChevronUp } from 'react-icons/fa';

interface ScheduleFilterProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

const ScheduleFilter = ({
  searchTerm,
  onSearchTermChange,
  currentDate,
  onDateChange,
}: ScheduleFilterProps) => {
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);

  const handlePreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onDateChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    onDateChange(newDate);
  };

  const handlePreviousYear = () => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(newDate.getFullYear() - 1);
    onDateChange(newDate);
  };

  const handleNextYear = () => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(newDate.getFullYear() + 1);
    onDateChange(newDate);
  };

  return (
    <aside className="w-full md:w-80 order-1 md:order-2 space-y-6">
      <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold text-white mb-3">Filtros</h3>
        <div>
          <label htmlFor="search-schedules" className="text-gray-400 text-sm">Buscar por nome:</label>
          <input
            id="search-schedules"
            type="text"
            placeholder="Ex: Culto de Domingo"
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="w-full mt-1 p-2 border border-gray-700 bg-gray-900 text-white rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg shadow-lg text-white">
        <button
          type="button"
          onClick={() => setIsDateFilterOpen(!isDateFilterOpen)}
          className="w-full flex justify-between items-center text-left md:hidden"
          aria-expanded={isDateFilterOpen}
          aria-controls="date-filter-content"
        >
          <h3 className="text-lg font-semibold text-white">Navegar por data</h3>
          {isDateFilterOpen ? <FaChevronUp /> : <FaChevronDown />}
        </button>

        <h3 className="text-lg font-semibold text-white mb-4 text-center hidden md:block">
          Navegar por data
        </h3>

        <div
          id="date-filter-content"
          className={`${isDateFilterOpen ? 'block' : 'hidden'} md:block mt-4 md:mt-0`}
        >
          <div className="flex items-center justify-between mb-4">
            <button onClick={handlePreviousMonth} className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors duration-200" aria-label="Mês anterior">
              <FaChevronLeft />
            </button>
            <span className="text-lg font-semibold w-28 text-center capitalize">{currentDate.toLocaleDateString('pt-BR', { month: 'long' })}</span>
            <button onClick={handleNextMonth} className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors duration-200" aria-label="Próximo mês">
              <FaChevronRight />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <button onClick={handlePreviousYear} className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors duration-200" aria-label="Ano anterior">
              <FaChevronLeft />
            </button>
            <span className="text-lg font-semibold w-20 text-center">{currentDate.getFullYear()}</span>
            <button onClick={handleNextYear} className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors duration-200" aria-label="Próximo ano">
              <FaChevronRight />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default ScheduleFilter;
